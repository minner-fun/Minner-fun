# Minner 技术文档站

## 🎉 项目已完成！

这是一个使用 **Docusaurus** 构建的现代化技术文档站点，支持中英文双语切换。

## ✨ 功能特性

- ✅ **中英文双语支持** - 完整的国际化配置
- ✅ **三大内容栏目** - Notes（笔记）/ Protocols（协议）/ Projects（项目）
- ✅ **示例文档** - 包含 Foundry、Uniswap V2、Fuzzing 等内容
- ✅ **简洁首页** - 技术名片风格，三个入口按钮
- ✅ **自动侧边栏** - 基于文件结构自动生成
- ✅ **构建成功** - 已通过完整构建测试

## 🚀 快速开始

```bash
cd minner-fun-docs
npm install
npm start
```

访问 http://localhost:3000 查看效果

## 📚 文档内容

### Notes 笔记
- Foundry 介绍和使用指南
- Cheatcodes 详细说明

### Protocols 协议
- Uniswap V2 架构分析

### Projects 项目
- 智能合约模糊测试模板

## 🌐 语言切换

- 英文版：`/`
- 中文版：`/zh-Hans/`

导航栏右上角有语言切换按钮（地球图标）

## 📦 部署到 Vercel

### 方法一：GitHub + Vercel Dashboard

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 自动检测配置（已包含 vercel.json）
4. 一键部署

### 方法二：Vercel CLI

```bash
npm i -g vercel
vercel
```

详细部署指南请查看 `DEPLOYMENT.md`

## 📁 项目结构

```
minner-fun-docs/
├── docs/                  # 英文文档
│   ├── notes/
│   ├── protocols/
│   └── projects/
├── i18n/zh-Hans/         # 中文文档
│   └── docusaurus-plugin-content-docs/
│       └── current/
├── src/pages/            # 首页
├── docusaurus.config.ts  # 配置文件
└── sidebars.ts          # 侧边栏配置
```

## 🎨 自定义

- **站点配置**：编辑 `docusaurus.config.ts`
- **首页样式**：编辑 `src/pages/index.tsx`
- **主题颜色**：编辑 `src/css/custom.css`

## 📝 添加新文档

1. 在 `docs/` 对应目录创建 `.md` 文件（英文）
2. 在 `i18n/zh-Hans/.../current/` 创建对应翻译（中文）
3. 侧边栏会自动更新

## 🔗 相关链接

- [Docusaurus 官方文档](https://docusaurus.io)
- [部署指南](./DEPLOYMENT.md)
- GitHub: https://github.com/minner-fun

## ✅ 已验证

- [x] 构建成功（`npm run build`）
- [x] 中英文版本都可访问
- [x] 语言切换功能正常
- [x] 所有文档链接有效
- [x] 导航和 Footer 配置正确
- [x] 响应式设计

## 🎯 下一步

1. 将项目推送到 GitHub
2. 在 Vercel 部署（使用已配置的 vercel.json）
3. 开始添加您自己的技术笔记和文档！

---

**技术栈**: Docusaurus 3 · TypeScript · React · Vercel

**特点**: 🌐 双语 · 📝 Markdown · 🎨 现代化 · 🚀 快速部署

