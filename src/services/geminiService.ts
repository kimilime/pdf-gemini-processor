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
    throw new Error('无法解析返回的数据格式，请检查Prompt是否要求返回JSON格式');
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

// 主要的处理函数
export const processWithGemini = async (
  file: File,
  prompt: string,
  apiKey: string
): Promise<TableData[]> => {
  try {
    // 初始化Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // 将PDF文件转换为Base64
    const base64Data = await fileToBase64(file);

    // 构建完整的提示词
    const fullPrompt = `
${prompt}

请仔细分析上传的PDF文件，提取其中的相关数据。请确保：
1. 返回有效的JSON格式数据
2. 如果是表格数据，请包含所有相关的列
3. 数字类型的数据请保持为数字格式
4. 如果没有找到相关数据，请返回空数组 []

示例返回格式：
[
  {
    "姓名": "张三",
    "职位": "CEO",
    "基本薪酬": 1000000,
    "奖金": 500000
  },
  {
    "姓名": "李四", 
    "职位": "CFO",
    "基本薪酬": 800000,
    "奖金": 300000
  }
]
`;

    // 发送请求到Gemini API
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data,
        },
      },
      fullPrompt,
    ]);

    const response = await result.response;
    const text = response.text();

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
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('API配额已用完，请检查您的账户余额');
      }
      if (error.message.includes('MODEL_NOT_FOUND')) {
        throw new Error('模型不可用，请稍后重试');
      }
      throw error;
    }
    
    throw new Error('处理过程中出现未知错误');
  }
}; 