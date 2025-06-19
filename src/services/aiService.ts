// 通用AI服务接口
export interface ModelConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'qwen' | 'deepseek' | 'doubao';
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

export interface TableData {
  [key: string]: string | number;
}

// 默认配置
export const DEFAULT_CONFIGS: Record<string, Partial<ModelConfig>> = {
  gemini: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    apiUrl: 'https://generativelanguage.googleapis.com'
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    apiUrl: 'https://api.openai.com/v1'
  },
  claude: {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    apiUrl: 'https://api.anthropic.com'
  },
  qwen: {
    provider: 'qwen',
    model: 'qwen-max',
    apiUrl: 'https://dashscope.aliyuncs.com'
  },
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiUrl: 'https://api.deepseek.com'
  },
  doubao: {
    provider: 'doubao',
    model: 'doubao-pro-32k',
    apiUrl: 'https://ark.cn-beijing.volces.com'
  }
};

// 将文件转换为Base64格式
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 重试机制
const retryAPICall = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`尝试 ${attempt}/${maxRetries} 失败:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      console.log(`等待 ${delayTime}ms 后重试...`);
      await delay(delayTime);
    }
  }
};

// Gemini API 调用
const callGeminiAPI = async (config: ModelConfig, prompt: string, base64Data: string): Promise<string> => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({ 
    model: config.model || 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
    }
  });

  const result = await model.generateContent([
    {
      text: prompt
    },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: base64Data
      }
    }
  ]);

  const response = await result.response;
  return response.text();
};

// OpenAI API 调用
const callOpenAIAPI = async (config: ModelConfig, prompt: string, base64Data: string): Promise<string> => {
  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64Data}` }
            }
          ]
        }
      ],
      max_tokens: 8192,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Claude API 调用
const callClaudeAPI = async (config: ModelConfig, prompt: string, base64Data: string): Promise<string> => {
  const response = await fetch(`${config.apiUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

// 通义千问 API 调用
const callQwenAPI = async (config: ModelConfig, prompt: string, base64Data: string): Promise<string> => {
  const response = await fetch(`${config.apiUrl}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'qwen-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:application/pdf;base64,${base64Data}` }
              }
            ]
          }
        ]
      },
      parameters: {
        temperature: 0.1,
        max_tokens: 8192
      }
    })
  });

  if (!response.ok) {
    throw new Error(`通义千问API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.output.text;
};

// DeepSeek API 调用
const callDeepSeekAPI = async (config: ModelConfig, prompt: string, base64Data: string): Promise<string> => {
  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64Data}` }
            }
          ]
        }
      ],
      max_tokens: 8192,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// 豆包 API 调用
const callDoubaoAPI = async (config: ModelConfig, prompt: string, base64Data: string): Promise<string> => {
  const response = await fetch(`${config.apiUrl}/api/v3/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'doubao-pro-32k',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64Data}` }
            }
          ]
        }
      ],
      max_tokens: 8192,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`豆包API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// 解析AI响应 (复用原有解析逻辑)
const parseAIResponse = (response: string): TableData[] => {
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
          
          // JSON清理
          jsonStr = jsonStr
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(\d+),(\d+)/g, '$1.$2')
            .replace(/,(\s*[,}\]])/g, '$1')
            .replace(/,(\s*,)/g, ',')
            .replace(/([^\\])"/g, '$1"')
            .replace(/:\s*,/g, ': null,')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
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

  throw new Error(`无法解析返回的数据格式。原始返回内容的前1000字符：\n\n${response.substring(0, 1000)}`);
};

// 通用处理函数
export const processWithAI = async (
  file: File,
  prompt: string,
  config: ModelConfig
): Promise<TableData[]> => {
  console.log('开始处理文件:', file.name, '使用模型:', config.provider);
  
  try {
    // 将PDF转换为Base64
    const base64Data = await fileToBase64(file);
    console.log('PDF转换为Base64完成，大小:', base64Data.length);
    
    // 根据提供商调用相应的API
    const callAPI = async (): Promise<string> => {
      switch (config.provider) {
        case 'gemini':
          return await callGeminiAPI(config, prompt, base64Data);
        case 'openai':
          return await callOpenAIAPI(config, prompt, base64Data);
        case 'claude':
          return await callClaudeAPI(config, prompt, base64Data);
        case 'qwen':
          return await callQwenAPI(config, prompt, base64Data);
        case 'deepseek':
          return await callDeepSeekAPI(config, prompt, base64Data);
        case 'doubao':
          return await callDoubaoAPI(config, prompt, base64Data);
        default:
          throw new Error(`不支持的模型提供商: ${config.provider}`);
      }
    };
    
    // 使用重试机制调用API
    const responseText = await retryAPICall(callAPI);
    console.log('API调用成功，响应长度:', responseText.length);
    
    // 解析响应
    const parsedData = parseAIResponse(responseText);
    console.log('解析完成，提取到', parsedData.length, '条记录');
    
    return parsedData;
    
  } catch (error: any) {
    console.error('处理文件时发生错误:', error);
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      throw new Error(`API密钥无效，请检查您的${config.provider}密钥是否正确`);
    }
    
    if (error.message?.includes('RATE_LIMIT') || error.message?.includes('429')) {
      throw new Error('API调用频率限制，请稍后重试');
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
      throw new Error('API配额已用尽，请检查您的账户余额');
    }
    
    throw new Error(`处理失败: ${error.message || '未知错误'}`);
  }
};

// 兼容性函数，保持向后兼容
export const processWithGemini = async (
  file: File,
  prompt: string,
  apiKey: string
): Promise<TableData[]> => {
  const config: ModelConfig = {
    provider: 'gemini',
    apiKey,
    model: 'gemini-2.0-flash-exp'
  };
  
  return processWithAI(file, prompt, config);
}; 