# 部署故障排除指南

## 🎨 样式问题修复

### 问题现象
- 界面显示为纯文本，没有样式
- 弹窗无法正确显示
- 缺少颜色、圆角、阴影等视觉效果

### 已修复的问题

#### 1. Tailwind CSS 配置
✅ **修复前**: 使用了Tailwind CSS v4 (alpha版本)，PostCSS配置不正确
✅ **修复后**: 降级到稳定的Tailwind CSS v3.4.0，正确配置PostCSS

#### 2. CSS 样式覆盖
✅ **修复前**: 默认Vite CSS样式覆盖了Tailwind样式
✅ **修复后**: 清理了index.css，只保留Tailwind指令和必要样式

#### 3. 弹窗显示问题
✅ **修复前**: z-index不够高，弹窗被其他元素遮挡
✅ **修复后**: 设置z-index: 9999，添加专用modal-overlay类

#### 4. Vercel 部署配置
✅ **修复前**: 缺少Vercel部署配置
✅ **修复后**: 添加vercel.json配置文件

## 🚀 部署步骤

### GitHub 推送
```bash
# 确保所有修复已提交
git push origin main
```

### Vercel 部署
1. 在Vercel中连接GitHub仓库
2. 构建设置会自动检测（使用vercel.json配置）
3. 环境变量：无需设置（API密钥在客户端输入）

### 验证部署
访问部署的URL，检查：
- [ ] 页面有正确的蓝色渐变背景
- [ ] 卡片有白色背景和圆角阴影
- [ ] 按钮有正确的颜色和悬停效果
- [ ] 点击"API设置"能正确显示弹窗
- [ ] 弹窗有半透明黑色背景
- [ ] 文件上传区域有虚线边框

### 样式测试组件
临时添加了`StyleDemo`组件来验证Tailwind是否正确加载：
- 应该显示一个蓝紫色渐变的卡片
- 包含三个彩色圆点（红、绿、蓝）

## 🔧 技术细节

### 关键配置文件

#### `tailwind.config.js`
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
```

#### `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### CSS 构建验证
构建后的CSS文件大小应该约为20KB，包含所有Tailwind样式。

## 📋 部署后检查清单

- [ ] 首页加载正常
- [ ] 所有样式正确显示
- [ ] 文件上传功能正常
- [ ] API设置弹窗正常显示
- [ ] 表格组件样式正确
- [ ] 响应式设计在移动端正常

## 🔍 常见问题

### Q: 样式仍然不显示
A: 检查浏览器开发者工具Network标签，确认CSS文件正确加载

### Q: 弹窗仍然不显示
A: 检查浏览器控制台是否有JavaScript错误

### Q: 构建失败
A: 运行 `npm run build` 检查具体错误信息

### Q: Vercel部署失败
A: 检查vercel.json配置和package.json中的构建脚本

---

**最后更新**: 修复了Tailwind CSS配置和弹窗显示问题，现在应该能正确显示所有样式了！ 🎉 