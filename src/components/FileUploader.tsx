import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Clock, CheckCircle, XCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
  currentFiles: File[];
  fileStatuses?: { [fileName: string]: 'pending' | 'processing' | 'completed' | 'error' };
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, currentFiles, fileStatuses = {} }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      alert('请选择PDF文件');
      return;
    }
    if (pdfFiles.length !== files.length) {
      alert(`只选择了 ${pdfFiles.length} 个PDF文件，忽略了 ${files.length - pdfFiles.length} 个非PDF文件`);
    }
    
    // 合并新文件和已有文件，去重
    const existingFileNames = currentFiles.map(f => f.name);
    const newFiles = pdfFiles.filter(file => !existingFileNames.includes(file.name));
    const allFiles = [...currentFiles, ...newFiles];
    
    onFileUpload(allFiles);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onFileUpload(newFiles);
  };

  const clearAllFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileUpload([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return '处理中...';
      case 'completed':
        return '已完成';
      case 'error':
        return '处理失败';
      default:
        return '等待处理';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          选择多个PDF文件或拖拽到此处
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          支持批量上传PDF文件进行处理
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* File List */}
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              已选择文件 ({currentFiles.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              清空全部
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {currentFiles.map((file, index) => {
              const status = fileStatuses[file.name] || 'pending';
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate text-left">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{getStatusText(status)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={status === 'processing'}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 