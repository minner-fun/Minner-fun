import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Minner',
  tagline: 'Smart Contract Notes · Protocol Research · Builder Log',
  favicon: 'img/myLogo.jpg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://www.minner.fun',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'minner-fun', // Usually your GitHub org/user name.
  projectName: 'Minner-fun', // Usually your repo name.

  onBrokenLinks: 'warn',

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha384-odtC+0UnitXhyN9sj2JKfAMrBGdTsNSFqRPqFiXxI94yt6mzAiJCb/qRcjPAIAz',
      crossorigin: 'anonymous',
    },
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/myLogo.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Minner',
      logo: {
        alt: 'Minner Logo',
        src: 'img/myLogo.jpg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'notesSidebar',
          position: 'left',
          label: '笔记',
        },
        {
          type: 'docSidebar',
          sidebarId: 'protocolsSidebar',
          position: 'left',
          label: '协议',
        },
        {
          type: 'docSidebar',
          sidebarId: 'projectsSidebar',
          position: 'left',
          label: '项目',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/minner-fun',
          label: 'GitHub',
          position: 'right',
          className: 'navbar-github',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '笔记',
              to: '/docs/notes/foundry/updraft',
            },
            {
              label: '协议研究',
              to: '/docs/protocols/Uniswap/V2/overview',
            },
            {
              label: '项目',
              to: '/docs/projects/LpManager/data-crawl',
            },
          ],
        },
        {
          title: '链接',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/minner-fun',
            },
          ],
        },
        {
          title: '站点',
          items: [
            {
              label: '中文 / EN',
              to: '/',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Minner · Built with an on-chain mindset.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
