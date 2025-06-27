// 应用介绍组件
export const StyleDemo = () => {
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="text-green-600 dark:text-green-400 text-xl">
          ℹ️
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            功能介绍
          </h3>
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <p>🎯 <strong>功能：</strong>使用Google Gemini 2.5 Pro API，根据自定义指令智能批量提取年报及公告数据，自动解析PDF并生成结构化表格</p>
            <p>👨‍💻 <strong>开发：</strong>By Terence Wang</p>
            <p>🛠️ <strong>技术：</strong>基于 React + TypeScript + Gemini 2.5 Pro API + Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 