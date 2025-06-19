import { useState, useEffect } from 'react';
import { FileText, Settings, Brain } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { PromptEditor } from './components/PromptEditor';
import { ResultsTable } from './components/ResultsTable';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ModelConfigModal } from './components/ModelConfigModal';
import { ProcessingStatus } from './components/ProcessingStatus';
import { StyleDemo } from './components/StyleDemo';
import { processWithAI, processWithGemini, DEFAULT_CONFIGS } from './services/aiService';
import type { ModelConfig } from './services/aiService';
import './App.css';

interface TableData {
  [key: string]: string | number;
}

type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

interface ProcessingState {
  isProcessing: boolean;
  currentIndex: number;
  fileStatuses: { [fileName: string]: FileStatus };
  errorMessages: { [fileName: string]: string };
}

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash-exp',
    apiUrl: 'https://generativelanguage.googleapis.com'
  });
  const [showModelModal, setShowModelModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>(`请从港股企业年报PDF文件中提取董事薪酬相关信息，并按以下规范返回结构化JSON数据：

【提取原则】

1. 优先提取准确数据，不确定时保持原始数值
2. 仔细识别年报中的薪酬表格和数据
3. 确保提取的是实际支付的薪酬，而非预算或其他数据

【提取要求】

1. 目标数据源：董事薪酬披露章节、董事酬金表、高管薪酬明细等
2. 提取对象：所有董事及高级管理人员
3. 数据完整性：确保所有相关人员信息均被提取

【必需字段】

- 公司名：年报所属企业名称
- 股票代码：港股代码（如适用）
- 报告年份：年报对应的财政年度（格式：YYYY）
- 姓名：董事/高管全名
- 董事会职务：从董事名单/董事会成员列表中获取的职务，如：主席、副主席、独立非执行董事、执行董事等
- 高管职务：查找该姓名是否在高管名单中出现，如出现则提取其管理职务，如：首席执行官、总裁、首席财务官等；如未出现则为空
- 入职日：履职开始日期（格式：YYYY-MM-DD，如无信息填写"不适用"）
- 离职日：职务终止日期（格式：YYYY-MM-DD，如无信息填写"不适用"）
- 币种：薪酬计量货币单位（港币/人民币等）
- 固薪：包含薪金和董事袍金的固定报酬部分
- 奖金：酌定性奖金，如酌情花红、绩效奖金等现金性可变报酬
- 长期激励：以股份形式支付的报酬，如股票期权、限制性股票、股份奖励等
- 其他：主要是福利、养老金等
- 合计：薪酬总计

【薪酬构成详细说明】

1. 固薪 = 基本薪金 + 董事袍金 + 其他固定津贴
   - 寻找：薪金、基本薪酬、董事袍金、津贴等固定项目
   - 通常是年报中最大的薪酬组成部分

2. 奖金 = 酌定性现金奖金
   - 寻找：酌情花红、绩效奖金、年终奖金、可变现金报酬等
   - 以现金形式支付的可变报酬

3. 长期激励 = 股权性报酬
   - 寻找：股票期权、限制性股票、股份奖励、股权激励计划等
   - 以公司股份或股票形式支付的报酬

【数值处理规则】
请将所有薪酬数值统一转换为万元单位：

- 如果看到"千"单位：除以10。例：2400千 → 240
- 如果看到"元"单位：除以10000。例：2400000元 → 240
- 如果已经是"万"单位：保持数值。例：240万 → 240
- 如果是"百万"单位：乘以100。例：2.4百万 → 240
- 只有在明确显示为0或"无"或"-"时才填写0
- 如果数据缺失或不明确，填写"不适用"而不是0

【重要注意事项】

- 仔细区分"0薪酬"和"数据缺失"
- 新入职或离职的董事可能确实为0薪酬
- 非执行董事通常只有董事袍金（固薪），奖金和长期激励可能为0
- 执行董事通常三个组成部分都有
- 如果表格中显示"-"或空白，且无其他说明，请填写0
- 如果完全找不到某人的薪酬信息，请在该字段填写"数据未披露"

【输出格式】
严格按照JSON数组格式返回：
[
  {
    "公司名": "腾讯控股有限公司",
    "股票代码": "00700",
    "报告年份": "2023",
    "姓名": "马化腾",
    "董事会职务": "董事会主席兼首席执行官",
    "高管职务": "首席执行官",
    "入职日": "不适用",
    "离职日": "不适用",
    "币种": "港币",
    "固薪": 365.4,
    "奖金": 0,
    "长期激励": 0,
    "其他": 0,
    "合计": 365.4
  }
]

【数据验证】
输出前请检查：

1. 提取的数值是否与PDF中的表格一致？
2. 薪酬构成分类是否正确（固薪/奖金/长期激励）？
3. 单位转换是否正确？
4. 0值是否确实代表无薪酬而非数据缺失？
5. JSON格式是否正确？`);
  
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentIndex: 0,
    fileStatuses: {},
    errorMessages: {}
  });
  
  const [results, setResults] = useState<TableData[]>([]);
  const [error, setError] = useState<string>('');

  // 从localStorage加载配置
  useEffect(() => {
    // 优先加载新的模型配置
    const savedModelConfig = localStorage.getItem('ai-model-config');
    if (savedModelConfig) {
      try {
        const config = JSON.parse(savedModelConfig);
        setModelConfig(config);
        setApiKey(config.apiKey);
      } catch (error) {
        console.error('解析模型配置失败:', error);
      }
    } else {
      // 兼容旧版本，加载Gemini API密钥
      const savedApiKey = localStorage.getItem('gemini-api-key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
        setModelConfig(prev => ({ ...prev, apiKey: savedApiKey }));
      }
    }
  }, []);

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
    setError('');
    
    // 初始化文件状态
    const newFileStatuses: { [fileName: string]: FileStatus } = {};
    files.forEach(file => {
      newFileStatuses[file.name] = 'pending';
    });
    
    setProcessingState(prev => ({
      ...prev,
      fileStatuses: newFileStatuses,
      errorMessages: {}
    }));
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  // 处理单个文件
  const processSingleFile = async (file: File) => {
    console.log('开始处理文件:', file.name);
    
    setProcessingState(prev => ({
      ...prev,
      fileStatuses: {
        ...prev.fileStatuses,
        [file.name]: 'processing'
      }
    }));

    try {
      console.log('调用 AI 服务处理文件:', file.name, '使用模型:', modelConfig.provider);
      const result = await processWithAI(file, prompt, modelConfig);
      console.log('文件处理成功，结果条数:', result.length);
      
      // 添加文件来源信息到每条记录
      const resultWithSource = result.map(item => ({
        ...item,
        '文件来源': file.name
      }));
      
      setResults(prev => {
        const newResults = [...prev, ...resultWithSource];
        console.log('更新结果，总条数:', newResults.length);
        return newResults;
      });
      
      setProcessingState(prev => ({
        ...prev,
        fileStatuses: {
          ...prev.fileStatuses,
          [file.name]: 'completed'
        }
      }));
      
      console.log('文件处理完成:', file.name);
      
    } catch (err) {
      console.error('文件处理失败:', file.name, err);
      const errorMessage = err instanceof Error ? err.message : '处理失败';
      
      setProcessingState(prev => ({
        ...prev,
        fileStatuses: {
          ...prev.fileStatuses,
          [file.name]: 'error'
        },
        errorMessages: {
          ...prev.errorMessages,
          [file.name]: errorMessage
        }
      }));
    }
  };

  // 批量处理文件
  const handleBatchProcess = async () => {
    console.log('开始批量处理，文件数量:', uploadedFiles.length);
    
    if (uploadedFiles.length === 0) {
      setError('请先上传PDF文件');
      return;
    }

    if (!modelConfig.apiKey.trim()) {
      if (modelConfig.provider === 'gemini') {
        setShowApiModal(true);
      } else {
        setShowModelModal(true);
      }
      return;
    }

    if (!prompt.trim()) {
      setError('请输入处理提示词');
      return;
    }

    console.log('设置处理状态为true');
    setProcessingState(prev => ({
      ...prev,
      isProcessing: true,
      currentIndex: 0
    }));
    
    setError('');
    setResults([]); // 清空之前的结果

    try {
      // 逐个处理文件
      for (let i = 0; i < uploadedFiles.length; i++) {
        console.log(`开始处理第 ${i + 1} 个文件:`, uploadedFiles[i].name);
        
        setProcessingState(prev => ({
          ...prev,
          currentIndex: i
        }));
        
        await processSingleFile(uploadedFiles[i]);
        
        // 在文件之间添加短暂延迟，避免API限制
        if (i < uploadedFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('所有文件处理完成');
    } catch (error) {
      console.error('批量处理过程中出现错误:', error);
      setError('批量处理过程中出现错误，请查看具体文件的错误信息');
    }

    console.log('设置处理状态为false');
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false
    }));
  };

  // 暂停处理
  const handlePauseProcess = () => {
    console.log('App: handlePauseProcess 被调用');
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false
    }));
  };

  // 重置处理状态
  const handleResetProcess = () => {
    console.log('App: handleResetProcess 被调用');
    setProcessingState({
      isProcessing: false,
      currentIndex: 0,
      fileStatuses: {},
      errorMessages: {}
    });
    setResults([]);
    setError('');
  };

  // 处理模型配置保存
  const handleModelConfigSave = (config: ModelConfig) => {
    setModelConfig(config);
    setApiKey(config.apiKey);
    localStorage.setItem('ai-model-config', JSON.stringify(config));
  };

  // 处理API密钥保存 (兼容旧版本)
  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    setModelConfig(prev => ({ ...prev, apiKey: key }));
    localStorage.setItem('gemini-api-key', key);
    
    // 如果是新配置系统，也保存到新的存储键
    const newConfig = { ...modelConfig, apiKey: key };
    localStorage.setItem('ai-model-config', JSON.stringify(newConfig));
  };

  const handleExportResults = () => {
    if (results.length === 0) return;

    // 生成CSV内容
    const csvContent = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).map(val => {
        // 处理包含逗号、双引号或换行的值
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(','))
    ].join('\n');

    // 添加BOM头以确保中文在Excel中正确显示
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // 创建Blob，指定正确的编码
    const blob = new Blob([csvWithBOM], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `批量处理结果_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL对象
    URL.revokeObjectURL(url);
  };

  // 计算处理统计
  const getProcessingStats = () => {
    const total = uploadedFiles.length;
    const completed = Object.values(processingState.fileStatuses).filter(status => status === 'completed').length;
    const errors = Object.values(processingState.fileStatuses).filter(status => status === 'error').length;
    const processing = Object.values(processingState.fileStatuses).filter(status => status === 'processing').length;
    
    return { total, completed, errors, processing };
  };

  const stats = getProcessingStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              年报提取分析工具
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowModelModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                title="AI 模型配置"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {modelConfig.provider === 'gemini' ? 'Gemini' : 
                   modelConfig.provider === 'openai' ? 'GPT' :
                   modelConfig.provider === 'claude' ? 'Claude' :
                   modelConfig.provider === 'qwen' ? '通义千问' :
                   modelConfig.provider === 'deepseek' ? 'DeepSeek' :
                   modelConfig.provider === 'doubao' ? '豆包' : '模型'}
                </span>
              </button>
              <button
                onClick={() => setShowApiModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                title="API 设置"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">设置</span>
              </button>
            </div>
          </div>
        </div>

        {/* 应用介绍 */}
        <div className="mb-6">
          <StyleDemo />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              批量文件上传
            </h2>
            <FileUploader 
              onFileUpload={handleFileUpload} 
              currentFiles={uploadedFiles}
              fileStatuses={processingState.fileStatuses}
            />
          </div>

          {/* Prompt Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              处理指令
            </h2>
            <PromptEditor prompt={prompt} onChange={handlePromptChange} />
          </div>
        </div>

        {/* Processing Status */}
        {uploadedFiles.length > 0 && (
          <ProcessingStatus
            totalFiles={stats.total}
            completedFiles={stats.completed}
            errorFiles={stats.errors}
            processingFiles={stats.processing}
            isProcessing={processingState.isProcessing}
            onStart={handleBatchProcess}
            onPause={handlePauseProcess}
            onReset={handleResetProcess}
            canStart={uploadedFiles.length > 0 && !!modelConfig.apiKey.trim() && !!prompt.trim()}
            errorMessages={processingState.errorMessages}
            error={error}
          />
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                处理结果 ({results.length} 条记录)
            </h2>
              <button
                onClick={handleExportResults}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                导出CSV
              </button>
            </div>
            <ResultsTable data={results} />
          </div>
        )}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiModal}
          onClose={() => setShowApiModal(false)}
          apiKey={apiKey}
          onSave={handleApiKeySave}
        />

        {/* Model Config Modal */}
        <ModelConfigModal
          isOpen={showModelModal}
          onClose={() => setShowModelModal(false)}
          currentConfig={modelConfig}
          onSave={handleModelConfigSave}
        />
      </div>
    </div>
  );
}

export default App;
