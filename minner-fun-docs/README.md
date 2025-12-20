# Minner Documentation Site

> Smart Contract Notes · Protocol Research · Builder Log

A technical documentation site built with Docusaurus, featuring bilingual content (English & Chinese) on smart contract development, DeFi protocols, and blockchain projects.

## 🚀 Quick Start

```bash
cd minner-fun-docs
npm install
npm start
```

Visit `http://localhost:3000` to see the site in action.

## 📚 Structure

The documentation is organized into three main sections:

### 📝 Notes
Technical notes and tutorials on blockchain development tools:
- Foundry basics and cheatcodes
- Smart contract testing patterns
- Development best practices

### 🔬 Protocols
In-depth analysis of DeFi protocols:
- Uniswap V2 architecture and mechanics
- AMM implementations
- Protocol security considerations

### 🚀 Projects
Practical project templates and guides:
- Fuzzing template for smart contracts
- Testing strategies
- Development workflows

## 🌐 Internationalization

The site supports both English and Chinese:
- **English**: Default language at `/`
- **Chinese**: Available at `/zh-Hans/`

Use the language dropdown in the navigation bar to switch between languages.

## 🛠️ Tech Stack

- **Framework**: [Docusaurus 3](https://docusaurus.io/)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Deployment**: Vercel

## 📝 Adding Content

### English Content
Place markdown files in:
```
minner-fun-docs/docs/
├── notes/
├── protocols/
└── projects/
```

### Chinese Content
Place translated markdown files in:
```
minner-fun-docs/i18n/zh-Hans/docusaurus-plugin-content-docs/current/
├── notes/
├── protocols/
└── projects/
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure build settings:
   - **Build Command**: `cd minner-fun-docs && npm install && npm run build`
   - **Output Directory**: `minner-fun-docs/build`
4. Deploy!

The site will automatically deploy on every push to the main branch.

### Manual Build

```bash
cd minner-fun-docs
npm run build
npm run serve
```

## 📖 Documentation Structure

```
minner-fun-docs/
├── docs/                    # English documentation
│   ├── notes/
│   ├── protocols/
│   └── projects/
├── i18n/                    # Internationalization
│   └── zh-Hans/            # Chinese translations
│       └── docusaurus-plugin-content-docs/
│           └── current/
│               ├── notes/
│               ├── protocols/
│               └── projects/
├── src/
│   ├── components/
│   ├── css/
│   └── pages/
│       └── index.tsx       # Homepage
├── static/                  # Static assets
├── docusaurus.config.ts    # Site configuration
├── sidebars.ts             # Sidebar configuration
└── package.json
```

## 🎨 Customization

### Site Configuration
Edit `minner-fun-docs/docusaurus.config.ts` to customize:
- Site title and tagline
- Navigation items
- Footer links
- Theme settings

### Homepage
Modify `minner-fun-docs/src/pages/index.tsx` to customize the landing page.

### Styling
Update `minner-fun-docs/src/css/custom.css` for global styles.

## 📄 License

Copyright © 2025 Minner. Built with Docusaurus.

## 🔗 Links

- **GitHub**: [https://github.com/minner-fun](https://github.com/minner-fun)
- **Deployed Site**: [Your Vercel URL]

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.
