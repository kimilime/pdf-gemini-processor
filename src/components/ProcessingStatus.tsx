import React from 'react';
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ProcessingStatusProps {
  totalFiles: number;
  completedFiles: number;
  errorFiles: number;
  processingFiles: number;
  isProcessing: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  canStart: boolean;
  errorMessages: { [fileName: string]: string };
  error?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  totalFiles,
  completedFiles,
  errorFiles,
  processingFiles,
  isProcessing,
  onStart,
  onPause,
  onReset,
  canStart,
  errorMessages,
  error
}) => {
  const progressPercentage = totalFiles > 0 ? Math.round((completedFiles + errorFiles) / totalFiles * 100) : 0;

  console.log('ProcessingStatus 渲染:', {
    totalFiles,
    canStart,
    isProcessing,
    onStart: typeof onStart
  });

  const handleStart = () => {
    console.log('ProcessingStatus: 开始按钮被点击');
    onStart();
  };

  const handlePause = () => {
    console.log('ProcessingStatus: 暂停按钮被点击');
    onPause();
  };

  const handleReset = () => {
    console.log('ProcessingStatus: 重置按钮被点击');
    onReset();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          处理状态
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>总共 {totalFiles} 个文件</span>
          <span>•</span>
          <span className="text-green-600 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            已完成 {completedFiles}
          </span>
          {errorFiles > 0 && (
            <>
              <span>•</span>
              <span className="text-red-600 flex items-center">
                <XCircle className="h-3 w-3 mr-1" />
                失败 {errorFiles}
              </span>
            </>
          )}
          {processingFiles > 0 && (
            <>
              <span>•</span>
              <span className="text-yellow-600 flex items-center">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                处理中 {processingFiles}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalFiles > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>处理进度</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="flex h-3 rounded-full overflow-hidden">
              {/* 已完成部分 */}
              <div 
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${totalFiles > 0 ? (completedFiles / totalFiles * 100) : 0}%` }}
              ></div>
              {/* 错误部分 */}
              <div 
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${totalFiles > 0 ? (errorFiles / totalFiles * 100) : 0}%` }}
              ></div>
              {/* 处理中部分 */}
              <div 
                className="bg-yellow-500 transition-all duration-300 animate-pulse"
                style={{ width: `${totalFiles > 0 ? (processingFiles / totalFiles * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 mb-4">
        {!isProcessing ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>开始批量处理</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
          >
            <Pause className="h-4 w-4" />
            <span>暂停处理</span>
          </button>
        )}

        <button
          onClick={handleReset}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>重置</span>
        </button>
      </div>

      {/* Error Messages */}
      {Object.keys(errorMessages).length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">处理错误：</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(errorMessages).map(([fileName, errorMessage]) => (
              <div key={fileName} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                <div className="font-medium mb-1">{fileName}</div>
                <div className="text-xs opacity-90">{errorMessage}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}; 