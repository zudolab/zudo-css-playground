import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'zudo-css-playground',
  tagline: 'Interactive CSS playground with design tokens and AI-powered pattern generation',
  favicon: 'img/favicon.ico',

  // Future flags
  future: {
    v4: true,
  },

  // Set the production url of your site here
  url: 'https://example.com',
  baseUrl: '/',

  // Don't add trailing slash
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // English locale
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined,
          // Show last update time and author from git history
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          // Add remark plugin to inject creation dates
          beforeDefaultRemarkPlugins: [[require('./plugins/remark-creation-date.js'), {}]],
        },
        // Disable blog feature
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Force dark mode and disable theme switching
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'zudo-css-playground',
      logo: {
        alt: '',
        src: 'img/favicon.ico',
        href: '/',
      },
      items: [
        {
          type: 'doc',
          docId: 'overview/index',
          position: 'left',
          label: 'Overview',
        },
        {
          type: 'doc',
          docId: 'architecture/index',
          position: 'left',
          label: 'Architecture',
        },
        {
          type: 'doc',
          docId: 'specs/index',
          position: 'left',
          label: 'Specs',
        },
        {
          type: 'doc',
          docId: 'changelog/index',
          position: 'left',
          label: 'Changelog',
        },
        {
          type: 'doc',
          docId: 'inbox/index',
          position: 'left',
          label: 'INBOX',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Takazudo. Documentation built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.oneDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
