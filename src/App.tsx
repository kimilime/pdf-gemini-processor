import { useState, useEffect } from 'react';
import { FileText, Settings } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { PromptEditor } from './components/PromptEditor';
import { ResultsTable } from './components/ResultsTable';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ProcessingStatus } from './components/ProcessingStatus';
import { StyleDemo } from './components/StyleDemo';
import { processWithGemini } from './services/geminiService';
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>(`请从港股企业年报PDF文件中提取董事薪酬相关信息，并按以下规范返回结构化JSON数据：

【提取要求】
1. 目标数据源：董事薪酬披露章节
2. 提取对象：所有董事及高级管理人员
3. 数据完整性：确保所有相关人员信息均被提取

【必需字段】
- 公司名：年报所属企业名称
- 股票代码：港股代码（如适用）
- 姓名：董事/高管全名
- 职务：具体职位描述
- 入职日：履职开始日期（格式：YYYY-MM-DD，如无信息填写"不适用"）
- 离职日：职务终止日期（格式：YYYY-MM-DD，如无信息填写"不适用"）
- 币种：薪酬计量货币单位（港币/人民币等，不含"万元"字样）
- 固薪：固定薪酬总额，包含董事袍金（单位：万）
- 奖金：变动薪酬，包含现金性酌定奖金（单位：万）
- 长期激励：股权性薪酬，包含股票期权、限制性股票等（单位：万）
- 合计：薪酬总计（单位：万）

【输出格式】
严格按照JSON数组格式返回，示例：
[
  {
    "公司名": "腾讯控股有限公司",
    "股票代码": "00700",
    "姓名": "马化腾",
    "职务": "董事会主席兼首席执行官",
    "入职日": "不适用",
    "离职日": "不适用",
    "币种": "港币",
    "固薪": 365.4,
    "奖金": 0,
    "长期激励": 0,
    "合计": 365.4
  }
]

【注意事项】
- 货币单位统一为万元
- 数值字段请使用数字类型，非文本
- 如某项薪酬为零或无披露，填写数字0
- 确保JSON格式正确，可直接解析`);
  
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentIndex: 0,
    fileStatuses: {},
    errorMessages: {}
  });
  
  const [results, setResults] = useState<TableData[]>([]);
  const [error, setError] = useState<string>('');

  // 从localStorage加载API密钥
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
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
    setProcessingState(prev => ({
      ...prev,
      fileStatuses: {
        ...prev.fileStatuses,
        [file.name]: 'processing'
      }
    }));

    try {
      const result = await processWithGemini(file, prompt, apiKey);
      
      // 添加文件来源信息到每条记录
      const resultWithSource = result.map(item => ({
        ...item,
        '文件来源': file.name
      }));
      
      setResults(prev => [...prev, ...resultWithSource]);
      
      setProcessingState(prev => ({
        ...prev,
        fileStatuses: {
          ...prev.fileStatuses,
          [file.name]: 'completed'
        }
      }));
      
    } catch (err) {
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
    if (uploadedFiles.length === 0) {
      setError('请先上传PDF文件');
      return;
    }

    if (!apiKey) {
      setShowApiModal(true);
      return;
    }

    if (!prompt.trim()) {
      setError('请输入处理提示词');
      return;
    }

    setProcessingState(prev => ({
      ...prev,
      isProcessing: true,
      currentIndex: 0
    }));
    
    setError('');
    setResults([]); // 清空之前的结果

    // 逐个处理文件
    for (let i = 0; i < uploadedFiles.length; i++) {
      if (!processingState.isProcessing) break; // 如果用户暂停了处理
      
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

    setProcessingState(prev => ({
      ...prev,
      isProcessing: false
    }));
  };

  // 暂停处理
  const handlePauseProcess = () => {
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false
    }));
  };

  // 重置处理状态
  const handleResetProcess = () => {
    setProcessingState({
      isProcessing: false,
      currentIndex: 0,
      fileStatuses: {},
      errorMessages: {}
    });
    setResults([]);
    setError('');
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
              PDF智能处理器
            </h1>
          </div>
          <button
            onClick={() => setShowApiModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>API设置</span>
          </button>
        </div>

        {/* 临时样式测试 */}
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
            canStart={uploadedFiles.length > 0 && !!apiKey && !!prompt.trim()}
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
          onSave={setApiKey}
        />
      </div>
    </div>
  );
}

export default App;
