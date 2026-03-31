import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Daily Writes',
  description: '每日学习笔记 — 前端进阶之路',
  lang: 'zh-CN',
  base: '/daily-writes/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '4月学习计划', link: '/2026-04/' },
    ],

    sidebar: {
      '/2026-04/': [
        {
          text: '2026年4月 — 前端进阶',
          items: [
            { text: '📅 学习总览', link: '/2026-04/' },
            { text: '04/01 - JavaScript 基础', link: '/2026-04/01-javascript-basics' },
            { text: '04/02 - 类型转换与作用域', link: '/2026-04/02-type-coercion-scope' },
            { text: '04/03 - 闭包与高阶函数', link: '/2026-04/03-closures-hof' },
            { text: '04/04 - 原型链与继承', link: '/2026-04/04-prototypes-inheritance' },
            { text: '04/05 - ES6+ 核心特性', link: '/2026-04/05-es6-features' },
            { text: '04/06 - 异步编程 Promise', link: '/2026-04/06-async-promise' },
            { text: '04/07 - async/await 与事件循环', link: '/2026-04/07-async-await-eventloop' },
            { text: '04/08 - DOM 操作与事件', link: '/2026-04/08-dom-events' },
            { text: '04/09 - BOM 与浏览器 API', link: '/2026-04/09-bom-browser-api' },
            { text: '04/10 - CSS 基础与选择器', link: '/2026-04/10-css-selectors' },
            { text: '04/11 - 盒模型与定位', link: '/2026-04/11-box-model-positioning' },
            { text: '04/12 - Flexbox 布局', link: '/2026-04/12-flexbox' },
            { text: '04/13 - Grid 布局', link: '/2026-04/13-css-grid' },
            { text: '04/14 - 响应式设计与媒体查询', link: '/2026-04/14-responsive-design' },
            { text: '04/15 - CSS 动画与过渡', link: '/2026-04/15-css-animations' },
            { text: '04/16 - HTML5 语义化', link: '/2026-04/16-html5-semantics' },
            { text: '04/17 - 表单与验证', link: '/2026-04/17-forms-validation' },
            { text: '04/18 - Web 存储与通信', link: '/2026-04/18-web-storage-communication' },
            { text: '04/19 - 性能优化基础', link: '/2026-04/19-performance-basics' },
            { text: '04/20 - 网络协议与安全', link: '/2026-04/20-network-security' },
            { text: '04/21 - 模块化与打包工具', link: '/2026-04/21-modules-bundlers' },
            { text: '04/22 - Vue 3 基础', link: '/2026-04/22-vue3-basics' },
            { text: '04/23 - Vue 3 组合式 API', link: '/2026-04/23-vue3-composables' },
            { text: '04/24 - React 基础', link: '/2026-04/24-react-basics' },
            { text: '04/25 - React Hooks', link: '/2026-04/25-react-hooks' },
            { text: '04/26 - TypeScript 基础', link: '/2026-04/26-typescript-basics' },
            { text: '04/27 - TypeScript 进阶', link: '/2026-04/27-typescript-advanced' },
            { text: '04/28 - Node.js 基础', link: '/2026-04/28-nodejs-basics' },
            { text: '04/29 - SSR 与 Nuxt/Next', link: '/2026-04/29-ssr-frameworks' },
            { text: '04/30 - 综合项目与总结', link: '/2026-04/30-review-project' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zzy-cl/daily-writes' },
    ],

    outline: {
      label: '页面导航',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索笔记' },
          modal: {
            noResultsText: '没有找到相关笔记',
            resetButtonTitle: '清除搜索',
            footer: { selectText: '选择', navigateText: '切换' },
          },
        },
      },
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdated: {
      text: '最后更新于',
    },
  },
})
