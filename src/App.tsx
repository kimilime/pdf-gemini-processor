import React, { useState } from 'react';
import { Upload, Send, Download, FileText, Settings } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { PromptEditor } from './components/PromptEditor';
import { ResultsTable } from './components/ResultsTable';
import { ApiKeyModal } from './components/ApiKeyModal';
import { processWithGemini } from './services/geminiService';
import './App.css';

interface TableData {
  [key: string]: string | number;
}

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('请提取PDF文件中高管薪酬相关的表格数据，包括姓名、职位、基本薪酬、奖金、股权激励等信息。请以JSON格式返回结构化数据。');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TableData[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setError('');
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
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

    setIsProcessing(true);
    setError('');

    try {
      const result = await processWithGemini(uploadedFile, prompt, apiKey);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请检查API密钥和网络连接');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) return;

    const csvContent = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `高管薪酬数据_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              文件上传
            </h2>
            <FileUploader onFileUpload={handleFileUpload} currentFile={uploadedFile} />
          </div>

          {/* Prompt Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              处理指令
            </h2>
            <PromptEditor prompt={prompt} onChange={handlePromptChange} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleProcess}
            disabled={isProcessing || !uploadedFile}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>{isProcessing ? '处理中...' : '开始处理'}</span>
          </button>

          {results.length > 0 && (
            <button
              onClick={handleExportResults}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>导出结果</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              处理结果
            </h2>
            <ResultsTable data={results} />
          </div>
        )}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiModal}
          onClose={() => setShowApiModal(false)}
          onSave={setApiKey}
          currentKey={apiKey}
        />
      </div>
    </div>
  );
}

export default App;
