# Minner's Portfolio Website

A modern, responsive personal portfolio website built with React, TypeScript, and Tailwind CSS. This website showcases my skills, projects, and provides a way for potential employers and collaborators to get in touch.

## 🌟 Features

- **Modern Design**: Clean, professional design with smooth animations
- **Responsive**: Fully responsive design that works on all devices
- **Performance Optimized**: Built with Vite for fast development and optimized builds
- **SEO Friendly**: Proper meta tags and semantic HTML structure
- **Interactive**: Smooth scrolling navigation and engaging animations
- **Contact Form**: Functional contact form for easy communication

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Ready for deployment on Vercel, Netlify, or any static hosting

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/minner-fun-portfolio.git
cd minner-fun-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Navbar.tsx      # Navigation component
│   ├── Hero.tsx        # Hero section
│   ├── About.tsx       # About section
│   ├── Skills.tsx      # Skills showcase
│   ├── Projects.tsx    # Projects portfolio
│   ├── Contact.tsx     # Contact form
│   └── Footer.tsx      # Footer component
├── App.tsx             # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## 🎨 Customization

### Personal Information

Update the following files with your personal information:

1. **src/components/Hero.tsx** - Update name, title, and description
2. **src/components/About.tsx** - Update about section content
3. **src/components/Skills.tsx** - Update your skills and proficiency levels
4. **src/components/Projects.tsx** - Add your projects with descriptions and links
5. **src/components/Contact.tsx** - Update contact information
6. **index.html** - Update meta tags and title

### Styling

- Colors can be customized in `tailwind.config.js`
- Global styles are in `src/index.css`
- Component-specific styles use Tailwind CSS classes

### Adding New Sections

1. Create a new component in `src/components/`
2. Import and add it to `src/App.tsx`
3. Update the navigation in `src/components/Navbar.tsx`

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

### Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure custom domain if needed

### GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts: `"deploy": "gh-pages -d dist"`
3. Run: `npm run build && npm run deploy`

## 📧 Contact

- **Email**: minner@example.com
- **Website**: [minner.fun](https://minner.fun)
- **GitHub**: [github.com/yourusername](https://github.com/yourusername)
- **LinkedIn**: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Design inspiration from modern portfolio websites
- Icons by [Lucide](https://lucide.dev/)
- Images from [Unsplash](https://unsplash.com/)
- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)

---

Made with ❤️ and lots of coffee by Minner
