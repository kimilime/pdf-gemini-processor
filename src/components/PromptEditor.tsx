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
      prompt: `请从港股企业年报PDF文件中提取董事薪酬相关信息，并按以下规范返回结构化JSON数据：

【重要提示】
本任务要求提取董事薪酬数据并转换为统一的万元单位。请仔细阅读以下格式要求。

【提取要求】
1. 目标数据源：董事薪酬披露章节、董事酬金表、高管薪酬明细等
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
- 固薪：固定薪酬总额，包含董事袍金（统一转换为万元）
- 奖金：变动薪酬，包含现金性酌定奖金（统一转换为万元）
- 长期激励：股权性薪酬，包含股票期权、限制性股票等（统一转换为万元）
- 合计：薪酬总计（统一转换为万元）

【数值转换规则 - 非常重要】
无论PDF中原始数据是什么单位，都必须统一转换为万元：
- 如果原数据是"千元"或"千"：除以10后输出。例：2400千 → 240.0万
- 如果原数据是"元"：除以10000后输出。例：2400000元 → 240.0万  
- 如果原数据已经是"万元"：直接输出数值。例：240万 → 240.0万
- 如果原数据是"百万"：乘以100后输出。例：2.4百万 → 240.0万

【转换示例】
原始数据 → 输出结果：
- 2,400千港币 → 240.0
- 240万人民币 → 240.0
- 2,400,000元 → 240.0
- 24万 → 24.0
- 0.24百万 → 24.0

【输出格式】
严格按照JSON数组格式返回，数值必须是数字类型（不是字符串）：
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

【质量检查】
输出前请自检：
1. 所有薪酬数值是否已正确转换为万元单位？
2. 数值字段是否为数字类型（不是字符串）？
3. JSON格式是否正确？
4. 是否有遗漏的董事/高管？

请严格按照以上要求处理，确保数值转换准确无误。`
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