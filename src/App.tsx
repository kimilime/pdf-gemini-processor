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
  const [prompt, setPrompt] = useState<string>('');
  
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
    console.log('开始处理文件:', file.name);
    
    setProcessingState(prev => ({
      ...prev,
      fileStatuses: {
        ...prev.fileStatuses,
        [file.name]: 'processing'
      }
    }));

    try {
      console.log('调用 processWithGemini 处理文件:', file.name);
      const result = await processWithGemini(file, prompt, apiKey);
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

    if (!apiKey) {
      setShowApiModal(true);
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
              年报及公告批量提取分析工具
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="https://github.com/kimilime/annual_report_crawler"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>年报下载工具</span>
            </a>
            <button
              onClick={() => setShowApiModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>API设置</span>
            </button>
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
