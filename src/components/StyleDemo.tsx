// 应用介绍组件
export const StyleDemo = () => {
  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-3">功能介绍</h3>
      <div className="space-y-2 text-sm opacity-90">
        <p>🎯 <strong>功能：</strong>支持多种AI模型(Gemini/GPT/Claude/通义千问/DeepSeek/豆包),根据自定义指令智能批量提取年报数据，自动解析PDF并生成结构化表格</p>
        <p>👨‍💻 <strong>开发：</strong>By Terence Wang</p>
        <p>🛠️ <strong>技术：</strong>基于 React + TypeScript + 多AI模型支持 + Tailwind CSS</p>
        <p>✨ <strong>推荐：</strong>默认使用 Gemini 2.5 Pro，经过深度优化测试，支持最新PDF处理能力</p>
        <p>🔧 <strong>API格式：</strong>各厂商均采用OpenAI兼容格式，确保调用的一致性和稳定性</p>
      </div>
      <div className="mt-4 flex space-x-2">
        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
}; 