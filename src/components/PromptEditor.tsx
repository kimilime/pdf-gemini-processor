// No React import needed with new JSX Transform
import { MessageSquare } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onChange }) => {
  const presetPrompts = [
    {
      name: '高管薪酬提取',
      prompt: '请提取PDF文件中高管薪酬相关的表格数据，包括姓名、职位、基本薪酬、奖金、股权激励等信息。请以JSON格式返回结构化数据。'
    },
    {
      name: '财务数据提取',
      prompt: '请提取PDF文件中的主要财务数据，包括营收、利润、资产负债等核心财务指标。请以JSON格式返回结构化数据。'
    },
    {
      name: '股东信息提取',
      prompt: '请提取PDF文件中的股东信息，包括股东名称、持股比例、股权变动等信息。请以JSON格式返回结构化数据。'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Preset Prompts */}
      <div className="flex flex-wrap gap-2">
        {presetPrompts.map((preset, index) => (
          <button
            key={index}
            onClick={() => onChange(preset.prompt)}
            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Prompt Input */}
      <div className="relative">
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