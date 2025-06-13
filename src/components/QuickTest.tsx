import { useState } from 'react';
import { TestTube, CheckCircle, XCircle } from 'lucide-react';

interface QuickTestProps {
  apiKey: string;
}

export const QuickTest: React.FC<QuickTestProps> = ({ apiKey }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const runQuickTest = async () => {
    if (!apiKey) {
      setTestResult('请先设置API密钥');
      setTestStatus('error');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // 使用轻量级测试
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-pro-preview-06-05'
      });
      
      const result = await model.generateContent('请简单回复"连接成功"');
      const response = await result.response;
      const text = response.text();
      
      setTestResult(`✅ API连接成功！模型响应: ${text}`);
      setTestStatus('success');
    } catch (error: any) {
      console.error('API测试失败:', error);
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        setTestResult('❌ API配额已用完，请稍后重试或升级计划');
      } else if (error.message?.includes('API_KEY_INVALID')) {
        setTestResult('❌ API密钥无效，请检查密钥是否正确');
      } else {
        setTestResult(`❌ 连接失败: ${error.message}`);
      }
      setTestStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
            使用Google Gemini API完成年报信息提取，并导出到CSV文件
          </h3>
        </div>
        <button
          onClick={runQuickTest}
          disabled={isTesting || !apiKey}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
        >
          {isTesting ? '测试中...' : '测试连接'}
        </button>
      </div>
      
      {testResult && (
        <div className={`flex items-start space-x-2 text-sm ${
          testStatus === 'success' ? 'text-green-700 dark:text-green-400' : 
          testStatus === 'error' ? 'text-red-700 dark:text-red-400' : 
          'text-blue-700 dark:text-blue-400'
        }`}>
          {testStatus === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          {testStatus === 'error' && <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <span>{testResult}</span>
        </div>
      )}
    </div>
  );
}; 