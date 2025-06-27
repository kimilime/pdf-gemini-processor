// No React import needed with new JSX Transform
import { MessageSquare, ChevronDown } from 'lucide-react';
import { presetPrompts } from '../data/presetPrompts';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onChange }) => {
  return (
    <div className="space-y-4">
      {/* 预设选择下拉框 */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          选择预设指令
        </label>
        <div className="relative">
          <select
            onChange={(e) => {
              const selectedPrompt = presetPrompts.find(preset => preset.name === e.target.value);
              if (selectedPrompt) {
                onChange(selectedPrompt.prompt);
              }
            }}
            defaultValue=""
            className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700"
          >
            <option value="">请选择预设指令...</option>
            {presetPrompts.map((preset, index) => (
              <option key={index} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Prompt Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          处理指令
        </label>
        <MessageSquare className="absolute top-3 left-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <textarea
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入处理指令..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          rows={6}
        />
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>💡 提示：</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>明确指定需要提取的数据类型和格式</li>
          <li>要求返回JSON格式便于后续处理</li>
          <li>可以指定表格的列名和数据结构</li>
          <li>每次处理都会创建新的会话，避免上下文混淆</li>
        </ul>
      </div>
    </div>
  );
}; 