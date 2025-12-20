# Minner Documentation Site - Project README

> For the GitHub Profile README, see the main [README.md](./README.md)

---

## 🌐 Live Site

**🔗 [minner-fun.vercel.app](https://minner-fun.vercel.app)**

A technical documentation site built with Docusaurus, featuring bilingual content (English & Chinese) on smart contract development, DeFi protocols, and blockchain projects.

## ✨ Features

- ✅ **Bilingual Support** - Full internationalization (English & 简体中文)
- ✅ **Three Main Sections** - Notes / Protocols / Projects
- ✅ **Example Documentation** - Foundry, Uniswap V2, Fuzzing templates
- ✅ **Clean Homepage** - Tech card style with quick access buttons
- ✅ **Auto-generated Sidebars** - Based on file structure
- ✅ **Dark Mode** - Respects system preferences

## 🚀 Quick Start

```bash
cd minner-fun-docs
npm install
npm start
```

Visit http://localhost:3000

## 📚 Content Structure

### 📝 Notes
Technical guides and tutorials:
- Foundry introduction and usage
- Cheatcodes reference
- Testing patterns

### 🔬 Protocols
In-depth protocol analysis:
- Uniswap V2 architecture
- AMM mechanics
- Security considerations

### 🚀 Projects
Practical templates:
- Smart contract fuzzing template
- Development workflows
- Best practices

## 🌐 Language Switching

- **English**: `/`
- **Chinese**: `/zh-Hans/`

Use the language dropdown in the navigation bar (globe icon)

## 📁 Project Structure

```
Minner-fun/
├── minner-fun-docs/           # Main Docusaurus project
│   ├── docs/                  # English documentation
│   │   ├── notes/
│   │   ├── protocols/
│   │   └── projects/
│   ├── i18n/                  # Internationalization
│   │   └── zh-Hans/           # Chinese translations
│   │       └── docusaurus-plugin-content-docs/
│   │           └── current/   # Chinese docs
│   ├── src/
│   │   ├── pages/             # Homepage
│   │   └── css/               # Styling
│   ├── docusaurus.config.ts   # Site configuration
│   └── sidebars.ts            # Sidebar configuration
├── vercel.json                # Vercel deployment config
├── DEPLOYMENT.md              # Detailed deployment guide
├── PROJECT_SUMMARY.md         # Project overview
└── README.md                  # GitHub profile README
```

## 🛠️ Tech Stack

- **Framework**: [Docusaurus 3](https://docusaurus.io/)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Deployment**: Vercel

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Auto-detect configuration (vercel.json included)
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Manual Build

```bash
cd minner-fun-docs
npm run build
npm run serve
```

## 📝 Adding New Documentation

### English Content
Create `.md` files in `minner-fun-docs/docs/` directories

### Chinese Translation
Create corresponding files in `minner-fun-docs/i18n/zh-Hans/docusaurus-plugin-content-docs/current/`

Sidebars update automatically!

## 🎨 Customization

- **Site Config**: Edit `docusaurus.config.ts`
- **Homepage**: Modify `src/pages/index.tsx`
- **Styling**: Update `src/css/custom.css`

## 📚 Documentation

- [Project Overview](./PROJECT_SUMMARY.md) - Quick project summary
- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment
- [Docusaurus Docs](https://docusaurus.io) - Official documentation

## 🔗 Links

- **Live Site**: https://minner-fun.vercel.app
- **GitHub**: https://github.com/Minner-fun
- **Docusaurus**: https://docusaurus.io
- **Vercel**: https://vercel.com

## ⚙️ Available Scripts

```bash
# Development server
cd minner-fun-docs && npm start

# Production build
cd minner-fun-docs && npm run build

# Serve built site locally
cd minner-fun-docs && npm run serve

# Type checking
cd minner-fun-docs && npm run typecheck
```

## ✅ Build Status

- [x] Build successful (`npm run build`)
- [x] English version accessible
- [x] Chinese version accessible (`/zh-Hans/`)
- [x] Language switching works
- [x] All documentation links valid
- [x] Deployed to Vercel

## 📄 License

Copyright © 2025 Minner. Built with Docusaurus.

## 🙏 Acknowledgments

- [Docusaurus](https://docusaurus.io) - Amazing documentation framework
- [Vercel](https://vercel.com) - Seamless deployment platform

---

**Note**: This is the project documentation README. For the GitHub profile README, see [README.md](./README.md)
