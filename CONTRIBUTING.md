# 贡献指南

感谢您对PDF智能处理器的关注！我们欢迎所有形式的贡献。

## 开发环境设置

### 前置要求
- Node.js 18.x 或更高版本
- npm 或 yarn
- Git

### 本地开发设置

1. **Fork 这个仓库**
   点击GitHub上的"Fork"按钮来创建您自己的副本。

2. **克隆您的fork**
   ```bash
   git clone https://github.com/your-username/pdf-gemini-processor.git
   cd pdf-gemini-processor
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开 http://localhost:5173

## 贡献类型

### 🐛 Bug 报告
- 使用提供的bug报告模板
- 包含复现步骤
- 提供系统信息和错误截图
- 包含PDF文件信息（大小、类型等）

### 💡 功能请求
- 使用功能请求模板
- 详细描述用例
- 解释为什么这个功能有用
- 考虑现有功能的兼容性

### 🔧 代码贡献

#### 开发流程
1. 创建一个新分支：`git checkout -b feature/your-feature-name`
2. 进行更改
3. 运行测试：`npm run lint` 和 `npm run build`
4. 提交更改：`git commit -m "feat: 添加新功能描述"`
5. 推送到您的fork：`git push origin feature/your-feature-name`
6. 创建Pull Request

#### 代码规范
- 使用TypeScript
- 遵循现有的代码风格
- 添加适当的注释
- 确保所有组件都有适当的类型定义

#### 提交消息规范
我们使用[约定式提交](https://www.conventionalcommits.org/zh-hans/)：

- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

例如：
```
feat: 添加批量处理PDF功能
fix: 修复表格排序问题
docs: 更新API文档
```

### 📝 文档贡献
- 更新README.md
- 改进代码注释
- 添加使用示例
- 翻译文档

## 开发指南

### 项目结构
```
src/
├── components/     # React组件
├── services/      # API服务
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
└── hooks/         # 自定义React Hooks
```

### 关键技术栈
- **前端**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS
- **表格**: TanStack Table
- **AI服务**: Google Gemini API
- **构建**: Vite

### 测试
- 运行linter：`npm run lint`
- 构建项目：`npm run build`
- 预览构建：`npm run preview`

### 调试技巧
1. **API调试**: 在浏览器开发者工具的Console中查看API调用
2. **PDF处理问题**: 检查文件大小和格式
3. **样式问题**: 使用Tailwind CSS类名
4. **类型错误**: 检查TypeScript类型定义

## Pull Request 指南

### 提交前检查
- [ ] 代码符合项目风格
- [ ] 没有TypeScript错误
- [ ] 已测试更改
- [ ] 更新了相关文档
- [ ] 提交消息遵循规范

### PR描述
- 使用提供的PR模板
- 描述更改的目的和方法
- 包含测试说明
- 如果相关，包含截图

## 社区行为准则

### 我们的承诺
为了营造一个开放和欢迎的环境，我们承诺让参与我们项目和社区的每个人都能获得无骚扰的体验。

### 我们的标准
有助于创建积极环境的行为包括：
- 使用欢迎和包容的语言
- 尊重不同的观点和经历
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表现出同理心

## 获得帮助

如果您需要帮助：
1. 查看[README.md](README.md)
2. 搜索现有的Issues
3. 创建新的Issue
4. 在Pull Request中提问

## 许可证

通过贡献，您同意您的贡献将在[MIT许可证](LICENSE)下授权。

---

再次感谢您的贡献！🎉 