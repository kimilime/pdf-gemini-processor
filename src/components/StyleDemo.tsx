// 应用介绍组件
export const StyleDemo = () => {
  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-3">年报分析提取工具</h3>
      <div className="space-y-2 text-sm opacity-90">
        <p>🎯 <strong>功能：</strong>智能提取港股企业年报中的高管薪酬数据，自动解析PDF并生成结构化表格</p>
        <p>👨‍💻 <strong>开发：</strong>By Terence Wang</p>
        <p>🛠️ <strong>技术：</strong>基于 React + TypeScript + Gemini 2.5 Pro API + Tailwind CSS</p>
      </div>
      <div className="mt-4 flex space-x-2">
        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
}; 