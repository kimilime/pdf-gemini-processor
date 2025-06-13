import { GoogleGenerativeAI } from '@google/generative-ai';

interface TableData {
  [key: string]: string | number;
}

// 将文件转换为Base64格式
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // 移除data:application/pdf;base64,前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 解析Gemini返回的JSON数据
const parseGeminiResponse = (response: string): TableData[] => {
  try {
    // 尝试提取JSON部分
    const jsonMatch = response.match(/\[[\s\S]*\]/) || response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // 如果是单个对象，转换为数组
      if (!Array.isArray(parsed)) {
        return [parsed];
      }
      
      return parsed;
    }
    
    // 如果没有找到JSON，尝试解析文本格式的表格
    return parseTextTable(response);
  } catch (error) {
    console.error('解析响应失败:', error);
    throw new Error(`无法解析返回的数据格式。原始返回内容：\n\n${response}`);
  }
};

// 解析文本格式的表格数据
const parseTextTable = (text: string): TableData[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const data: TableData[] = [];
  
  let headers: string[] = [];
  let isTableStarted = false;
  
  for (const line of lines) {
    const cleanLine = line.trim();
    
    // 跳过分隔符行
    if (cleanLine.match(/^[\|\-\+\s]+$/)) {
      continue;
    }
    
    // 检测表格开始
    if (cleanLine.includes('|')) {
      const cells = cleanLine.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (!isTableStarted && cells.length > 1) {
        headers = cells;
        isTableStarted = true;
      } else if (isTableStarted && cells.length === headers.length) {
        const row: TableData = {};
        headers.forEach((header, index) => {
          const value = cells[index];
          // 尝试转换为数字
          const numValue = parseFloat(value.replace(/[,，]/g, ''));
          row[header] = !isNaN(numValue) && value.match(/[\d,，.]+/) ? numValue : value;
        });
        data.push(row);
      }
    }
  }
  
  if (data.length === 0) {
    throw new Error('未能从响应中解析出表格数据');
  }
  
  return data;
};

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的API调用
const retryAPICall = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000): Promise<any> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries) {
        throw error;
      }
      
      // 如果是配额限制错误，等待更长时间
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        const retryDelay = error.message?.includes('43s') ? 45000 : baseDelay * Math.pow(2, i);
        console.log(`API配额限制，等待 ${retryDelay/1000} 秒后重试...`);
        await delay(retryDelay);
      } else {
        await delay(baseDelay * Math.pow(2, i));
      }
    }
  }
};

// 主要的处理函数
export const processWithGemini = async (
  file: File,
  prompt: string,
  apiKey: string
): Promise<TableData[]> => {
  try {
    // 初始化Gemini API - 使用最新的2.0模型
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',  // 使用Gemini 2.0 Flash实验版（目前最新最强）
      generationConfig: {
        temperature: 0.1,  // 降低温度以获得更一致的结果
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,  // 增加输出Token限制
      }
    });

    // 将PDF文件转换为Base64
    console.log('开始转换PDF文件，文件大小:', file.size, '字节');
    const base64Data = await fileToBase64(file);
    console.log('PDF转换完成，Base64长度:', base64Data.length);

    // 构建完整的提示词
    const fullPrompt = `
重要：这是一个PDF文档分析任务！请直接分析提供的PDF文件内容，不要询问或要求提供文件。

用户要求：${prompt}

请严格按照以下要求处理：
1. 直接分析已上传的PDF文件内容
2. 提取相关数据并返回有效的JSON格式
3. 不要进行对话，只返回分析结果
4. 如果是表格数据，请包含所有相关的列
5. 数字类型的数据请保持为数字格式
6. 如果没有找到相关数据，请返回空数组 []

必须返回JSON格式，示例：
[
  {
    "姓名": "张三",
    "职位": "CEO", 
    "基本薪酬": 1000000,
    "奖金": 500000
  }
]

请立即开始分析PDF文件并返回JSON数据：
`;

    console.log('发送请求到Gemini API...');
    // 使用重试机制发送请求到Gemini API
    const result = await retryAPICall(async () => {
      return await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        fullPrompt,
      ]);
    });

    const response = await result.response;
    const text = response.text();
    console.log('API响应长度:', text.length);
    console.log('API响应前500字符:', text.substring(0, 500));

    if (!text) {
      throw new Error('API返回空响应');
    }

    // 解析响应
    const parsedData = parseGeminiResponse(text);

    if (parsedData.length === 0) {
      throw new Error('未能从PDF中提取到相关数据');
    }

    return parsedData;
  } catch (error) {
    console.error('处理失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('API密钥无效，请检查您的Gemini API密钥');
      }
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('API请求配额已用完，请稍后重试或升级您的API计划。详情：https://ai.google.dev/gemini-api/docs/rate-limits');
      }
      if (error.message.includes('MODEL_NOT_FOUND')) {
        throw new Error('模型不可用，请稍后重试');
      }
      throw error;
    }
    
    throw new Error('处理过程中出现未知错误');
  }
}; 