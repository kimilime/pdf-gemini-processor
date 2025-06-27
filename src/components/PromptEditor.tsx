// No React import needed with new JSX Transform
import { MessageSquare, ChevronDown } from 'lucide-react';
import { presetPrompts } from '../data/presetPrompts';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onChange }) => {
  return (
    <div className="space-y-6">
      {/* 预设选择下拉框 */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          📋 选择预设指令
        </label>
        <div className="relative group">
          <select
            onChange={(e) => {
              const selectedPrompt = presetPrompts.find(preset => preset.name === e.target.value);
              if (selectedPrompt) {
                onChange(selectedPrompt.prompt);
              }
            }}
            defaultValue=""
            className="w-full pl-4 pr-12 py-3 text-sm
                     bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750
                     border-2 border-gray-200 dark:border-gray-600 
                     rounded-xl shadow-sm
                     hover:border-blue-300 dark:hover:border-blue-500
                     focus:border-blue-500 dark:focus:border-blue-400
                     focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                     dark:text-white
                     appearance-none cursor-pointer
                     transition-all duration-200 ease-in-out
                     group-hover:shadow-md
                     backdrop-blur-sm"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              🎯 选择预设指令或新建...
            </option>
            {presetPrompts.map((preset, index) => (
              <option 
                key={index} 
                value={preset.name}
                className="text-gray-700 dark:text-gray-200 py-2"
              >
                {preset.name === '新建' ? '✨ ' : '📊 '}{preset.name}
              </option>
            ))}
          </select>
          
          {/* 自定义下拉箭头 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none
                         transition-transform duration-200 group-hover:scale-110">
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 
                                  group-hover:text-blue-500 dark:group-hover:text-blue-400
                                  transition-colors duration-200" />
          </div>
          
          {/* 装饰性渐变边框 */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -z-10"></div>
        </div>
        
        {/* 提示文字 */}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          💡 <span>快速选择内置模板，或选择"新建"自定义指令</span>
        </p>
      </div>

      {/* Prompt Input */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          处理指令
        </label>
        
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            placeholder="请输入处理指令，或从上方预设中选择模板..."
            className="w-full pl-4 pr-4 py-4 text-sm
                     bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50
                     border-2 border-gray-200 dark:border-gray-600 
                     rounded-xl shadow-sm
                     hover:border-blue-300 dark:hover:border-blue-500
                     focus:border-blue-500 dark:focus:border-blue-400
                     focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30
                     dark:text-white dark:placeholder-gray-400
                     resize-none transition-all duration-200 ease-in-out
                     group-hover:shadow-md
                     backdrop-blur-sm"
            rows={8}
          />
          
          {/* 字符计数 */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
            {prompt.length} 字符
          </div>
          
          {/* 装饰性渐变边框 */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -z-10"></div>
        </div>
      </div>

      {/* 美化的提示区域 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 
                    border border-blue-200 dark:border-gray-600 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">使用提示</p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                明确指定需要提取的数据类型和格式
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                要求返回JSON格式便于后续处理
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                可以指定表格的列名和数据结构
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                每次处理都会创建新的会话，避免上下文混淆
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 