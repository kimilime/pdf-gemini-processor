// 样式测试组件 - 用于验证Tailwind CSS是否正确加载
export const StyleDemo = () => {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-2">样式测试</h3>
      <p className="text-sm opacity-90">如果您能看到这个彩色卡片，说明Tailwind CSS已正确加载</p>
      <div className="mt-4 flex space-x-2">
        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
}; 