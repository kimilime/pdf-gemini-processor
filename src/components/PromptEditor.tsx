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

【提取原则】
1. 优先提取准确数据，不确定时保持原始数值
2. 仔细识别年报中的薪酬表格和数据
3. 确保提取的是实际支付的薪酬，而非预算或其他数据

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
- 币种：薪酬计量货币单位（港币/人民币等）
- 固薪：固定薪酬总额，包含董事袍金
- 奖金：变动薪酬，包含现金性酌定奖金
- 长期激励：股权性薪酬，包含股票期权、限制性股票等
- 合计：薪酬总计

【数值处理规则】
请将所有薪酬数值统一转换为万元单位：
- 如果看到"千"单位：除以10。例：2400千 → 240
- 如果看到"元"单位：除以10000。例：2400000元 → 240
- 如果已经是"万"单位：保持数值。例：240万 → 240
- 如果是"百万"单位：乘以100。例：2.4百万 → 240
- 只有在明确显示为0或"无"或"-"时才填写0
- 如果数据缺失或不明确，填写"不适用"而不是0

【重要注意事项】
- 仔细区分"0薪酬"和"数据缺失"
- 新入职或离职的董事可能确实为0薪酬
- 非执行董事通常只有袍金，其他项目可能为0
- 如果表格中显示"-"或空白，且无其他说明，请填写0
- 如果完全找不到某人的薪酬信息，请在该字段填写"数据未披露"

【输出格式】
严格按照JSON数组格式返回：
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

【数据验证】
输出前请检查：
1. 提取的数值是否与PDF中的表格一致？
2. 单位转换是否正确？
3. 0值是否确实代表无薪酬而非数据缺失？
4. JSON格式是否正确？`
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