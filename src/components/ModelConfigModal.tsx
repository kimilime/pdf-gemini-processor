import React, { useState, useEffect } from 'react';
import { X, Brain, Key, Globe, Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { ModelConfig } from '../services/aiService';
import { DEFAULT_CONFIGS } from '../services/aiService';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ModelConfig) => void;
  currentConfig: ModelConfig;
}

const MODEL_NAMES = {
  gemini: 'Google Gemini',
  openai: 'OpenAI GPT',
  claude: 'Anthropic Claude',
  qwen: '阿里通义千问',
  deepseek: 'DeepSeek',
  doubao: '字节豆包'
};

const MODEL_DESCRIPTIONS = {
  gemini: 'Google 最新的多模态大语言模型，支持PDF处理',
  openai: 'OpenAI 的 GPT 系列模型，强大的文本理解能力',
  claude: 'Anthropic 的 Claude 模型，安全可靠的AI助手',
  qwen: '阿里云通义千问，中文处理能力突出',
  deepseek: 'DeepSeek 模型，性价比较高的AI服务',
  doubao: '字节跳动豆包模型，理解能力强'
};

const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-pro',
  openai: 'gpt-4o',
  claude: 'claude-3-5-sonnet-20241022',
  qwen: 'qwen-plus',
  deepseek: 'deepseek-v3',
  doubao: 'doubao-1.5-pro-32k'
};

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}) => {
  const [config, setConfig] = useState<ModelConfig>(currentConfig);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handleProviderChange = (provider: ModelConfig['provider']) => {
    const defaultConfig = DEFAULT_CONFIGS[provider];
    setConfig(prev => ({
      ...prev,
      provider,
      model: defaultConfig?.model || DEFAULT_MODELS[provider],
      apiUrl: defaultConfig?.apiUrl || ''
    }));
  };

  const handleResetToDefault = () => {
    const defaultConfig = DEFAULT_CONFIGS[config.provider];
    setConfig(prev => ({
      ...prev,
      model: defaultConfig?.model || DEFAULT_MODELS[config.provider],
      apiUrl: defaultConfig?.apiUrl || ''
    }));
  };

  const handleSave = () => {
    if (config.apiKey.trim()) {
      // 保存配置到localStorage
      localStorage.setItem('ai-model-config', JSON.stringify(config));
      onSave(config);
      onClose();
    }
  };

  const handleClose = () => {
    setConfig(currentConfig);
    onClose();
  };

  const getApiKeyPlaceholder = () => {
    switch (config.provider) {
      case 'gemini': return '请输入 Google AI Studio API 密钥';
      case 'openai': return '请输入 OpenAI API 密钥';
      case 'claude': return '请输入 Anthropic API 密钥';
      case 'qwen': return '请输入阿里云API密钥';
      case 'deepseek': return '请输入 DeepSeek API 密钥';
      case 'doubao': return '请输入字节豆包API密钥';
      default: return '请输入API密钥';
    }
  };

  const getDocLinks = () => {
    switch (config.provider) {
      case 'gemini':
        return [
          { text: 'Google AI Studio', url: 'https://makersuite.google.com/app/apikey' },
          { text: '使用文档', url: 'https://ai.google.dev/docs' }
        ];
      case 'openai':
        return [
          { text: 'OpenAI Platform', url: 'https://platform.openai.com/api-keys' },
          { text: 'API 文档', url: 'https://platform.openai.com/docs' }
        ];
      case 'claude':
        return [
          { text: 'Anthropic Console', url: 'https://console.anthropic.com/' },
          { text: 'API 文档', url: 'https://docs.anthropic.com/' }
        ];
      case 'qwen':
        return [
          { text: '阿里云控制台', url: 'https://dashscope.console.aliyun.com/' },
          { text: 'API 文档', url: 'https://help.aliyun.com/zh/dashscope/' }
        ];
      case 'deepseek':
        return [
          { text: 'DeepSeek Platform', url: 'https://platform.deepseek.com/' },
          { text: 'API 文档', url: 'https://platform.deepseek.com/api-docs' }
        ];
      case 'doubao':
        return [
          { text: '火山方舟', url: 'https://console.volcengine.com/ark' },
          { text: 'API 文档', url: 'https://www.volcengine.com/docs/82379' }
        ];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 模型配置
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* 标签页 */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              基础配置
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              高级配置
            </button>
          </div>

          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* 模型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  选择AI模型提供商
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(MODEL_NAMES).map(([provider, name]) => (
                    <button
                      key={provider}
                      onClick={() => handleProviderChange(provider as ModelConfig['provider'])}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        config.provider === provider
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {MODEL_DESCRIPTIONS[provider as keyof typeof MODEL_DESCRIPTIONS]}
                      </div>
                      {provider === 'gemini' && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                          ✨ 推荐 (默认)
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* API 密钥 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Key className="inline h-4 w-4 mr-1" />
                  API 密钥
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder={getApiKeyPlaceholder()}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 获取API密钥指南 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  如何获取 {MODEL_NAMES[config.provider]} API 密钥：
                </h4>
                <div className="space-y-1">
                  {getDocLinks().map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mr-4"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      {link.text}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* 模型名称 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    模型名称
                  </label>
                  <button
                    onClick={handleResetToDefault}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    重置为默认
                  </button>
                </div>
                <input
                  type="text"
                  value={config.model || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  placeholder={`默认: ${DEFAULT_MODELS[config.provider]}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* API 地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API 基础地址
                </label>
                <input
                  type="url"
                  value={config.apiUrl || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder={DEFAULT_CONFIGS[config.provider]?.apiUrl || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  留空将使用默认地址，可用于配置代理或自部署服务
                </p>
              </div>

              {/* 注意事项 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  高级配置注意事项：
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                  <li>修改模型名称前请确认目标模型支持多模态（文档+图像）输入</li>
                  <li>自定义API地址时请确保网络连通性和SSL证书有效</li>
                  <li>不同模型的响应格式可能不同，可能影响数据解析</li>
                  <li>建议首次使用时先用默认配置测试</li>
                </ul>
              </div>
            </div>
          )}

          {/* 通用注意事项 */}
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              重要提示：
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>配置信息将保存在本地浏览器中</li>
              <li>请妥善保管您的 API 密钥，不要与他人分享</li>
              <li>推荐使用 Gemini 2.5 Pro，本应用针对该模型进行了优化</li>
              <li>不同模型的处理效果和成本可能存在差异</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!config.apiKey.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}; 