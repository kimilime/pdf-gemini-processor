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

// 解析Gemini响应
const parseGeminiResponse = (response: string): TableData[] => {
  console.log('开始解析响应，内容长度:', response.length);
  
  try {
    // 首先尝试直接解析完整的JSON数组
    const parsed = JSON.parse(response);
    
    if (Array.isArray(parsed)) {
      console.log('直接解析成功，返回', parsed.length, '条记录');
      return parsed;
    }
    
    if (typeof parsed === 'object' && parsed !== null) {
      console.log('解析为单个对象，转换为数组');
      return [parsed];
    }
  } catch (firstError) {
    console.log('直接解析失败，尝试提取JSON块:', firstError);
  }

  try {
    // 尝试提取JSON块（支持多种格式）
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/g,
      /```\s*([\s\S]*?)\s*```/g,
      /\[[\s\S]*\]/g,
      /\{[\s\S]*\}/g
    ];

    for (const pattern of patterns) {
      const matches = [...response.matchAll(pattern)];
      
      for (const match of matches) {
        try {
          let jsonStr = match[1] || match[0];
          
          // 更全面的JSON清理
          jsonStr = jsonStr
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/\/\/.*$/gm, '')  // 移除单行注释
            .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
            .replace(/(\d+),(\d+)/g, '$1.$2')  // 149,0 -> 149.0
            .replace(/,(\s*[,}\]])/g, '$1')     // 移除多余的逗号
            .replace(/,(\s*,)/g, ',')           // 移除重复的逗号
            .replace(/([^\\])"/g, '$1"')        // 确保引号正确
            .replace(/:\s*,/g, ': null,')       // 空值处理
            .replace(/,\s*}/g, '}')             // 移除对象末尾的逗号
            .replace(/,\s*]/g, ']')             // 移除数组末尾的逗号
            .trim();

          console.log('尝试解析清理后的JSON，长度:', jsonStr.length);
          
          const parsed = JSON.parse(jsonStr);
          
          if (Array.isArray(parsed)) {
            console.log('成功解析JSON数组，包含', parsed.length, '条记录');
            return parsed;
          }
          
          if (typeof parsed === 'object' && parsed !== null) {
            console.log('成功解析JSON对象，转换为数组');
            return [parsed];
          }
        } catch (parseError) {
          console.log('JSON解析失败，尝试下一个模式:', parseError);
          continue;
        }
      }
    }
  } catch (secondError) {
    console.error('所有JSON解析尝试都失败:', secondError);
  }

  // 如果JSON解析失败，尝试表格格式解析
  console.log('JSON解析完全失败，尝试表格格式解析');
  try {
    const tableData = parseTextTable(response);
    if (tableData.length > 0) {
      console.log('表格解析成功，返回', tableData.length, '条记录');
      return tableData;
    }
  } catch (tableError) {
    console.error('表格解析也失败:', tableError);
  }

  // 最后尝试从响应中提取关键数据（适用于自由文本格式）
  console.log('尝试从自由文本中提取数据');
  try {
    const extractedData = extractDataFromText(response);
    if (extractedData.length > 0) {
      console.log('文本提取成功，返回', extractedData.length, '条记录');
      return extractedData;
    }
  } catch (extractError) {
    console.error('文本提取失败:', extractError);
  }
  
  throw new Error(`无法解析返回的数据格式。原始返回内容的前1000字符：\n\n${response.substring(0, 1000)}`);
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

// 从自由文本中提取数据
const extractDataFromText = (text: string): TableData[] => {
  const data: TableData[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // 寻找包含姓名和薪酬信息的行
  for (const line of lines) {
    const cleanLine = line.trim();
    
    // 匹配可能的薪酬数据模式
    const patterns = [
      // 匹配 "姓名: 张三, 固薪: 100万元" 格式
      /(\S+)[：:]\s*([^,，]+)[,，]\s*(\S+)[：:]\s*([^,，]+)/g,
      // 匹配 "张三 - 固薪100万元" 格式
      /(\S+)\s*[-—]\s*(\S+)(\d+(?:\.\d+)?)[万千]?元?/g,
      // 匹配简单的 "张三 100万" 格式
      /(\S+)\s+(\d+(?:\.\d+)?)[万千]?元?/g
    ];

    for (const pattern of patterns) {
      const matches = [...cleanLine.matchAll(pattern)];
      
      for (const match of matches) {
        try {
          const row: TableData = {};
          
          if (pattern.source.includes('：') || pattern.source.includes(':')) {
            // 键值对格式
            row[match[1]] = match[2];
            row[match[3]] = parseFloat(match[4]) || match[4];
          } else {
            // 简单格式
            row['姓名'] = match[1];
            row['薪酬'] = parseFloat(match[2]) || match[2];
          }
          
          data.push(row);
        } catch (error) {
          console.log('提取数据行失败:', error);
        }
      }
    }
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
    // 初始化Gemini API - 使用最新的2.5 Pro正式版本
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',  // 使用最新的2.5 Pro正式版本
      generationConfig: {
        temperature: 0.0,  // 尝试更低的温度获得更一致的结果
        topP: 1.0,        // 尝试网页版可能使用的参数
        topK: 32,         // 调整为可能更接近网页版的值
        maxOutputTokens: 65536,  // 2.5 Pro的最大输出限制
        candidateCount: 1,
      },
      systemInstruction: `你是一个专业的财务数据分析师，专门从年报PDF中提取结构化的薪酬数据。

重要的数字单位转换规则：
- 如果看到"千元"或"千"，数值除以10得到万元（例如：240千 = 24万）
- 如果看到"元"，数值除以10000得到万元（例如：2400000元 = 240万）  
- 如果看到"万元"或"万"，保持数值不变

请严格按照用户提供的格式要求进行数据提取和转换。确保理解并正确处理所有货币单位。`
    });

    // 将PDF文件转换为Base64
    console.log('开始转换PDF文件，文件大小:', file.size, '字节');
    const base64Data = await fileToBase64(file);
    console.log('PDF转换完成，Base64长度:', base64Data.length);

    // 直接使用用户的prompt，不添加额外的包装
    const fullPrompt = prompt;

    console.log('发送请求到Gemini API，使用模型:', 'gemini-2.5-pro');
    console.log('Prompt长度:', fullPrompt.length);
    console.log('API Key前10位:', apiKey.substring(0, 10) + '...');
    console.log('生成配置:', {
      temperature: 0.0,
      topP: 1.0,
      topK: 32,
      maxOutputTokens: 65536,
      candidateCount: 1
    });
    console.log('系统指令:', "你是一个专业的财务数据分析师...");
    console.log('完整Prompt前500字符:', fullPrompt.substring(0, 500));
    
    // 使用重试机制发送请求到Gemini API
    const result = await retryAPICall(async () => {
      return await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        {
          text: fullPrompt
        }
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