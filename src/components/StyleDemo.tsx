// 应用介绍组件
export const StyleDemo = () => {
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-green-600 dark:text-green-400 text-lg">ℹ️</span>
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
          功能介绍
        </h3>
      </div>
      
      <div className="grid gap-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-base">🎯</span>
          <div>
            <span className="font-medium text-green-800 dark:text-green-200">功能：</span>
            <span className="text-green-700 dark:text-green-300">使用Google Gemini 2.5 Pro API，根据自定义指令智能批量提取年报及公告数据，自动解析PDF并生成结构化表格</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-base">👨‍💻</span>
          <div>
            <span className="font-medium text-green-800 dark:text-green-200">开发：</span>
            <span className="text-green-700 dark:text-green-300">By Terence Wang</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <span className="text-base">🛠️</span>
          <div>
            <span className="font-medium text-green-800 dark:text-green-200">技术：</span>
            <span className="text-green-700 dark:text-green-300">基于 React + TypeScript + Gemini 2.5 Pro API + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 