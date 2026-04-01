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
          text: '第一阶段：JS/TS 核心（Day 1-7）',
          items: [
            { text: '📅 学习总览', link: '/2026-04/' },
            { text: '04/01 - JS 执行机制与闭包', link: '/2026-04/01-javascript-basics' },
            { text: '04/02 - JS 异步与 Promise', link: '/2026-04/02-async-promise' },
            { text: '04/03 - JS 进阶与内存管理', link: '/2026-04/03-js-advanced-memory' },
            { text: '04/04 - TypeScript 核心', link: '/2026-04/04-typescript-core' },
            { text: '04/05 - TypeScript 进阶与类型体操', link: '/2026-04/05-typescript-advanced' },
            { text: '04/06 - 算法专项 + 数据结构', link: '/2026-04/06-algorithm-datastructures' },
            { text: '04/07 - ⭐ 第一周复盘', link: '/2026-04/07-week1-review' },
          ],
        },
        {
          text: '第二阶段：Vue 3 深度（Day 8-13）',
          items: [
            { text: '04/08 - Vue 3 响应式原理', link: '/2026-04/08-vue3-reactivity' },
            { text: '04/09 - 编译优化与虚拟 DOM', link: '/2026-04/09-vue3-compiler-vdom' },
            { text: '04/10 - Composition API + Pinia', link: '/2026-04/10-vue3-composables-pinia' },
            { text: '04/11 - Vue 3 性能优化', link: '/2026-04/11-vue3-performance' },
            { text: '04/12 - SSR 与 Nuxt 3', link: '/2026-04/12-ssr-nuxt3' },
            { text: '04/13 - ⭐ 第二周复盘', link: '/2026-04/13-week2-review' },
          ],
        },
        {
          text: '第三阶段：React 18+（Day 14-20）',
          items: [
            { text: '04/14 - ⭐ 第三阶段启动', link: '/2026-04/14-week3-kickoff' },
            { text: '04/15 - React 核心：Fiber 与 Hooks', link: '/2026-04/15-react-fiber-hooks' },
            { text: '04/16 - React 18 新特性', link: '/2026-04/16-react18-features' },
            { text: '04/17 - RSC + AI Agent 入门', link: '/2026-04/17-rsc-ai-agent' },
            { text: '04/18 - 状态管理与数据获取', link: '/2026-04/18-state-management' },
            { text: '04/19 - React 性能优化', link: '/2026-04/19-react-performance' },
            { text: '04/20 - Next.js 与系统设计', link: '/2026-04/20-nextjs-system-design' },
          ],
        },
        {
          text: '第四阶段：工程化 + 冲刺（Day 21-30）',
          items: [
            { text: '04/21 - ⭐ 第四阶段启动', link: '/2026-04/21-week4-kickoff' },
            { text: '04/22 - 构建工具与工程化', link: '/2026-04/22-build-tools-engineering' },
            { text: '04/23 - 网络协议与安全', link: '/2026-04/23-network-security' },
            { text: '04/24 - 性能优化全链路', link: '/2026-04/24-performance-full-stack' },
            { text: '04/25 - 前端测试 + AI Agent 进阶', link: '/2026-04/25-testing-ai-agent-advanced' },
            { text: '04/26 - 微前端与架构设计', link: '/2026-04/26-micro-frontend-architecture' },
            { text: '04/27 - AI Agent 实战深入', link: '/2026-04/27-ai-agent-practical' },
            { text: '04/28 - 算法冲刺 + 简历优化', link: '/2026-04/28-algorithm-resume-behavior' },
            { text: '04/29 - 全真模拟面试', link: '/2026-04/29-mock-interview' },
            { text: '04/30 - 查漏补缺 + 心态调整', link: '/2026-04/30-final-review' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zzy-cl/daily-writes' },
    ],

    outline: false,

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
