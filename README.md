# Minner Documentation Site

> Smart Contract Notes · Protocol Research · Builder Log

一个基于 Docusaurus 构建的现代化技术文档站点，支持中英文双语切换。

## 📁 项目结构

```
Minner-fun/
├── minner-fun-docs/          # Docusaurus 文档站项目
├── vercel.json                # Vercel 部署配置
├── DEPLOYMENT.md              # 详细部署指南
├── PROJECT_SUMMARY.md         # 项目概览
└── 改造文档.md                # 原始需求文档
```

## 🚀 快速开始

```bash
cd minner-fun-docs
npm install
npm start
```

访问 http://localhost:3000 查看站点

## 📚 功能特性

- ✅ **中英文双语** - 完整的国际化支持
- ✅ **三大栏目** - Notes（笔记）/ Protocols（协议）/ Projects（项目）
- ✅ **示例文档** - Foundry、Uniswap V2、Fuzzing 等
- ✅ **自动侧边栏** - 基于目录结构自动生成
- ✅ **简洁首页** - 技术名片风格

## 📖 文档内容

### 📝 Notes - 笔记
- Foundry 介绍和使用指南
- Cheatcodes 详细说明

### 🔬 Protocols - 协议
- Uniswap V2 架构分析和实现细节

### 🚀 Projects - 项目
- 智能合约模糊测试模板
- 开发工具和最佳实践

## 🌐 语言切换

- **英文版**: `/`
- **中文版**: `/zh-Hans/`

导航栏右上角有语言切换按钮

## 🚢 部署到 Vercel

### 方法一：GitHub + Vercel（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 自动检测配置（已包含 vercel.json）
4. 一键部署

### 方法二：Vercel CLI

```bash
npm i -g vercel
vercel
```

详细步骤请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📝 添加新文档

### 英文文档
在 `minner-fun-docs/docs/` 对应目录创建 `.md` 文件

### 中文翻译
在 `minner-fun-docs/i18n/zh-Hans/docusaurus-plugin-content-docs/current/` 对应路径创建同名文件

侧边栏会自动更新！

## 🛠️ 技术栈

- **框架**: Docusaurus 3
- **语言**: TypeScript
- **样式**: CSS Modules
- **部署**: Vercel

## 📚 文档参考

- [项目概览](./PROJECT_SUMMARY.md) - 快速了解项目
- [部署指南](./DEPLOYMENT.md) - 详细部署步骤
- [Docusaurus 文档](https://docusaurus.io) - 官方文档

## 🔗 相关链接

- **GitHub**: https://github.com/minner-fun
- **Docusaurus**: https://docusaurus.io
- **Vercel**: https://vercel.com

## ⚙️ 构建命令

```bash
# 开发
cd minner-fun-docs && npm start

# 构建
cd minner-fun-docs && npm run build

# 预览构建结果
cd minner-fun-docs && npm run serve
```

## 📞 支持

有问题或建议？欢迎提 Issue！

---

**注意**: 主项目位于 `minner-fun-docs/` 目录下。所有开发和构建命令都需要在该目录下执行。

Copyright © 2025 Minner. Built with ❤️ and Docusaurus.
