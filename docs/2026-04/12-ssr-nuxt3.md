# 04/12 — SSR 与 Nuxt 3（Day 12）

> **阶段**：第二阶段 Vue 3
> **今日目标**：理解 SSR 渲染原理与水合过程，掌握 Nuxt 3 核心用法
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：SSR 水合（Hydration）原理 ⭐

### 1.1 SSR vs CSR 渲染流程

```
CSR (Client-Side Rendering):
  浏览器 → 下载 HTML 空壳 → 下载 JS → 执行 JS → 生成 DOM → 页面可见
  （白屏时间长，首屏慢）

SSR (Server-Side Rendering):
  服务器 → 渲染完整 HTML → 浏览器直接显示 → 下载 JS → 水合 → 页面可交互
  （首屏快，但需等 JS 水合后才能交互）
```

### 1.2 Hydration（水合）过程 ⭐

SSR 返回的 HTML 已经是完整内容，但没有交互能力。**水合**是将 Vue 实例挂载到已有 DOM 上并激活事件监听的过程：

```
步骤 1: 服务器渲染完整 HTML
  <div id="app">
    <p>Count: 0</p>
    <button>+1</button>  ← 有 DOM，但没有事件
  </div>

步骤 2: 浏览器展示 HTML（用户看到内容，但按钮点不动）

步骤 3: 下载 JS bundle
  <script src="/client.js"></script>

步骤 4: Vue 在客户端创建 Virtual DOM，与现有 DOM 做匹配
  createApp(App).mount('#app')
  → 不会替换已有 DOM
  → 只是"附着"事件和响应式数据

步骤 5: 水合完成 → 页面可交互
```

```js
// 服务端 — 渲染 HTML
import { renderToString } from 'vue/server-renderer'
const html = await renderToString(app)

// 客户端 — 水合
import { createSSRApp } from 'vue'
import App from './App.vue'
const app = createSSRApp(App)
app.mount('#app') // mount 到已有 DOM 上 → hydration
```

### 1.3 ⚠️ 水合不匹配问题

如果服务端渲染的 HTML 与客户端生成的 Virtual DOM 不一致，会导致水合警告：

```vue
<!-- ❌ 水合不匹配 -->
<template>
  <p>{{ Date.now() }}</p> <!-- 服务端和客户端时间不同 -->
</template>

<!-- ✅ 正确做法：只在客户端渲染 -->
<template>
  <ClientOnly>
    <p>{{ Date.now() }}</p>
  </ClientOnly>
</template>

<!-- 或者用 onMounted -->
<script setup>
const time = ref('')
onMounted(() => {
  time.value = Date.now().toString() // 只在客户端设置
})
</script>
```

### 1.4 常见水合不匹配原因

| 原因 | 示例 | 解决方案 |
|------|------|---------|
| 时间/随机数 | `Date.now()`, `Math.random()` | `onMounted` 中设置 |
| 浏览器 API | `window`, `localStorage` | `onMounted` 中访问 |
| 非确定性渲染 | `new Set()` 遍历顺序 | 排序后遍历 |
| HTML 结构不一致 | 空格/换行差异 | 规范模板格式 |
| 条件渲染差异 | 服务端/客户端判断不同 | 统一判断逻辑 |

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| SSR 的水合过程？ | 客户端将 Vue 实例挂载到已有 DOM 上，匹配 Virtual DOM 并附着事件和响应式，不替换已有 DOM |
| SSR 的优缺点？ | 首屏快、SEO 友好；服务器压力大、需处理水合不匹配、不能用浏览器 API |
| 水合不匹配怎么办？ | ClientOnly 包裹、onMounted 延迟设置、确保服务端/客户端渲染结果一致 |

---

## 知识点 2：SSR vs SSG vs ISR ⭐

### 2.1 三种渲染模式对比

| 特性 | SSR | SSG | ISR |
|------|-----|-----|-----|
| 全称 | Server-Side Rendering | Static Site Generation | Incremental Static Regeneration |
| 渲染时机 | 每次请求 | 构建时 | 构建时 + 定时重新生成 |
| HTML 生成 | 服务器实时渲染 | 构建时预渲染 | 首次构建 + 后台重新生成 |
| 数据新鲜度 | 最新 | 构建时的快照 | 可配置过期时间 |
| 服务器压力 | 高 | 无（CDN 静态文件） | 低 |
| 适用场景 | 动态内容、个性化页面 | 博客、文档、营销页 | 电商产品页、新闻列表 |

### 2.2 使用场景选择

```
问：你的页面需要怎么做渲染？

                    ┌─ 是 → SSG（静态站）
                    │
内容在构建时确定？ ──┤
                    │
                    └─ 否 → 内容个性化？── 是 → SSR
                              │
                              └─ 否 → 内容变化频率？
                                        │
                                        ├─ 低频 → SSG + 定时重建
                                        └─ 高频 → ISR 或 SSR
```

```js
// Nuxt 3 中配置渲染模式

// SSG — 构建时生成所有页面
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/about', '/contact']
    }
  }
})

// SSR — 每次请求实时渲染（默认模式）
export default defineNuxtConfig({
  ssr: true // 默认就是 true
})

// ISR — 静态生成 + 定时重新验证
// 在页面中设置
definePageMeta({
  experimental: {
    isr: 60 // 60 秒后重新生成
  }
})
```

### 2.3 Nuxt 3 的混合渲染

Nuxt 3 支持路由级别的渲染模式配置：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },           // SSG
    '/products/**': { swr: 3600 },      // ISR — 1小时重新验证
    '/admin/**': { ssr: false },        // CSR — 纯客户端渲染
    '/api/**': { cors: true },          // API 路由配置
  }
})
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| 什么时候用 SSG 比 SSR 好？ | 内容不经常变化时（博客、文档），SSG 无需服务器、直接 CDN 分发、性能最优 |
| ISR 是什么？ | 增量静态再生成：首次构建静态页面，内容过期后在后台重新生成，兼顾性能和新鲜度 |
| Nuxt 3 如何混合使用不同渲染模式？ | routeRules 配置路由级别的 prerender/swr/ssr 策略 |

---

## 知识点 3：Nuxt 3 核心功能 ⭐

### 3.1 目录结构

```
my-nuxt-app/
├── pages/              # 文件系统路由
│   ├── index.vue       # → /
│   ├── about.vue       # → /about
│   └── users/
│       ├── index.vue   # → /users
│       └── [id].vue    # → /users/:id
├── components/         # 自动导入的组件
├── composables/        # 自动导入的 composables
├── layouts/            # 布局组件
├── middleware/         # 路由中间件
├── plugins/            # 插件
├── public/             # 静态资源
├── server/             # 服务端 API
│   └── api/
│       └── hello.ts    # → /api/hello
├── stores/             # Pinia stores
├── app.vue             # 根组件
└── nuxt.config.ts      # 配置文件
```

### 3.2 自动导入

Nuxt 3 自动导入以下内容，无需手动 `import`：

```vue
<script setup>
// ✅ Vue API 自动导入（无需 import）
const count = ref(0)
const double = computed(() => count.value * 2)
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))

// ✅ 组件自动导入（components/ 目录下的组件）
// <MyComponent /> 可以直接使用，不需要 import

// ✅ Composables 自动导入（composables/ 目录下）
const { data, loading } = useMyComposable()

// ✅ Nuxt 内置 API
const route = useRoute()
const router = useRouter()
const { data } = await useFetch('/api/users')
</script>
```

⚠️ **注意**：自动导入可能导致命名冲突，遵循命名约定：

```ts
// composables/useCounter.ts — 必须 use 前缀
export function useCounter() { /* ... */ }

// utils/format.ts — 工具函数无前缀要求
export function formatDate(date) { /* ... */ }
```

### 3.3 useFetch — 数据获取 ⭐

```vue
<script setup>
// 基本用法 — 服务端执行，客户端水合后不重复请求
const { data: users, pending, error, refresh } = await useFetch('/api/users', {
  // 选项
  key: 'users',          // 缓存 key（默认自动生成）
  lazy: false,           // true → 阻塞导航，false → 非阻塞
  server: true,          // 是否在服务端执行
  default: () => [],     // data 的默认值
  transform: (data) => data.users, // 转换响应数据

  // 响应式参数
  query: { page: 1 },    // URL 查询参数
  watch: [page],          // 监听变化自动重新请求
})

console.log(users.value) // 数据自动解包
</script>
```

### 3.4 useFetch vs 原生 fetch 对比

| 特性 | useFetch | 原生 fetch |
|------|----------|-----------|
| SSR 兼容 | ✅ 服务端执行 + 客户端水合 | ❌ 只在客户端执行 |
| 重复请求避免 | ✅ 自动去重（同一 key） | ❌ 可能重复请求 |
| 缓存 | ✅ key 级别缓存 | ❌ 无 |
| 类型推断 | ✅ 自动推断响应类型 | ❌ 需手动断言 |
| 加载状态 | ✅ pending | ❌ 需手动管理 |
| 错误处理 | ✅ error 响应式 | ❌ try/catch |
| 自动刷新 | ✅ watch 选项 | ❌ 需手动 watch |
| 响应式参数 | ✅ query/body 自动追踪 | ❌ 需手动处理 |

```js
// ❌ 原生 fetch — SSR 不兼容、重复请求、手动管理状态
const users = ref([])
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch('/api/users')
    users.value = await res.json()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

// ✅ useFetch — 一行搞定
const { data: users, pending } = await useFetch('/api/users')
```

### 3.5 路由与中间件

```vue
<!-- pages/users/[id].vue -->
<template>
  <div>用户ID: {{ route.params.id }}</div>
</template>

<script setup>
const route = useRoute()
console.log(route.params.id) // 动态路由参数

// 获取路由参数的另一种方式
const { id } = useRoute().params
</script>
```

```ts
// middleware/auth.ts — 路由中间件
export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie('token')

  if (!token.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})

// 页面中使用
definePageMeta({
  middleware: 'auth'
})
```

### 3.6 服务端 API

```ts
// server/api/users.get.ts — GET /api/users
export default defineEventHandler(async (event) => {
  const query = getQuery(event) // 获取查询参数
  return {
    users: await db.users.findMany({
      page: query.page || 1
    })
  }
})

// server/api/users.post.ts — POST /api/users
export default defineEventHandler(async (event) => {
  const body = await readBody(event) // 获取请求体
  return await db.users.create(body)
})
```

### 3.7 敏感数据处理 ⚠️

SSR 中需要特别注意敏感数据泄露：

```ts
// ❌ 错误 — 服务端请求中携带的敏感信息会暴露给客户端
const { data } = await useFetch('/api/internal', {
  headers: { Authorization: 'Bearer secret-token' }
})
// 这个请求会在客户端 hydration 时重复执行，token 暴露

// ✅ 正确 — 在服务端 API 路由中处理敏感请求
// server/api/proxy.ts
export default defineEventHandler(async (event) => {
  const token = process.env.API_SECRET // 只在服务端存在
  return await $fetch('https://internal-api.com/data', {
    headers: { Authorization: `Bearer ${token}` }
  })
})

// 客户端调用 /api/proxy，不会暴露内部 token
const { data } = await useFetch('/api/proxy')
```

```ts
// ✅ 使用 useFetch 的 server 选项控制执行环境
const { data } = await useFetch('/api/user', {
  server: true,    // 只在服务端执行（不会在客户端重复请求）
  headers: useRequestHeaders(['cookie']) // 传递 cookie 到服务端
})
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Nuxt 3 的 useFetch 和原生 fetch 区别？ | SSR 兼容、自动去重、内置缓存/pending/error、响应式参数、类型推断 |
| Nuxt 3 自动导入的范围？ | Vue API、components/、composables/、Nuxt 内置 API（useRoute, useFetch 等） |
| 如何处理 SSR 中的敏感数据泄露？ | 通过 server/api 路由代理、useFetch 的 server 选项、环境变量只在服务端可用 |
| Nuxt 3 的文件系统路由？ | pages/ 目录结构自动映射路由，[id].vue 是动态参数，[...slug].vue 是通配 |

---

## 🔧 手写题（2 道）

### 手写题 1：简易 SSR 渲染器

```js
/**
 * 手写简易 SSR 渲染器
 * 理解 SSR 的核心流程
 */
import { createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

// 1. 定义应用组件
const App = {
  setup() {
    const count = ref(0)
    return { count }
  },
  template: `
    <div>
      <h1>SSR Demo</h1>
      <p>Count: {{ count }}</p>
      <button @click="count++">+1</button>
    </div>
  `
}

// 2. 服务端渲染函数
async function renderServerSide() {
  const app = createSSRApp(App)
  const html = await renderToString(app)
  return html
}

// 3. 生成完整 HTML 模板
function wrapHTML(appHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>SSR Demo</title>
</head>
<body>
  <div id="app">${appHtml}</div>
  <!-- 客户端 JS 进行水合 -->
  <script type="module">
    import { createSSRApp } from 'vue'
    import App from './App.vue'

    const app = createSSRApp(App)
    app.mount('#app') // 水合：附着到已有 DOM
  </script>
</body>
</html>
  `
}

// 4. 运行
async function main() {
  const appHtml = await renderServerSide()
  const fullHTML = wrapHTML(appHtml)

  console.log('=== 服务端渲染结果 ===')
  console.log(appHtml)
  // 输出:
  // <div>
  //   <h1>SSR Demo</h1>
  //   <p>Count: 0</p>
  //   <button>+1</button> ← 注意：此时没有 @click 事件
  // </div>

  console.log('=== 完整 HTML ===')
  console.log(fullHTML)
}

main()

// ====== 流程说明 ======
// 1. 服务端执行 renderToString → 生成静态 HTML
// 2. 浏览器接收 HTML → 立即显示内容（无白屏）
// 3. 浏览器下载 JS → createSSRApp().mount('#app')
// 4. Vue 创建 VNode → 与已有 DOM 匹配 → 附着事件和响应式
// 5. 水合完成 → 按钮可点击
```

### 手写题 2：简易数据请求 Composable

```js
/**
 * 手写类似 useFetch 的 composable
 * 支持 SSR 安全检测、缓存、去重
 */
import { ref, watch, onMounted, getCurrentInstance } from 'vue'

/**
 * @param {string|Function} url - 请求 URL 或返回 URL 的函数
 * @param {Object} options
 * @returns {{ data, pending, error, refresh }}
 */
function useMyFetch(url, options = {}) {
  const {
    key,
    default: defaultValue = null,
    server = true,
    lazy = false,
    transform,
    watch: watchDeps = [],
    immediate = true
  } = options

  // 1. 响应式状态
  const data = ref(defaultValue)
  const pending = ref(!lazy)
  const error = ref(null)

  // 2. 判断是否在服务端
  const isServer = typeof window === 'undefined'

  // 3. 缓存（简化版）
  const cacheKey = key || (typeof url === 'function' ? url() : url)
  if (!globalThis.__fetchCache) {
    globalThis.__fetchCache = new Map()
  }

  // 4. 请求函数
  async function execute() {
    const fetchUrl = typeof url === 'function' ? url() : url

    // 去重：同一 key 正在请求时不重复发
    if (globalThis.__fetchCache.has(cacheKey)) {
      const cached = globalThis.__fetchCache.get(cacheKey)
      if (cached.pending) {
        await cached.promise
        data.value = cached.data
        return
      }
    }

    pending.value = true
    error.value = null

    const fetchPromise = doFetch(fetchUrl)
    globalThis.__fetchCache.set(cacheKey, {
      pending: true,
      promise: fetchPromise
    })

    try {
      const result = await fetchPromise
      data.value = transform ? transform(result) : result
      globalThis.__fetchCache.set(cacheKey, {
        pending: false,
        data: data.value
      })
    } catch (err) {
      error.value = err
      globalThis.__fetchCache.set(cacheKey, {
        pending: false,
        error: err
      })
    } finally {
      pending.value = false
    }
  }

  async function doFetch(fetchUrl) {
    const res = await fetch(fetchUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  // 5. 执行时机
  if (immediate) {
    if (isServer && server) {
      // 服务端：同步执行（Nuxt 内部会 await）
    } else if (!isServer) {
      if (lazy) {
        onMounted(execute)
      } else {
        // 客户端非 lazy：在 hydration 后检查缓存
        onMounted(() => {
          if (!globalThis.__fetchCache.get(cacheKey)?.data) {
            execute()
          }
        })
      }
    }
  }

  // 6. 监听依赖变化
  if (watchDeps.length > 0) {
    watch(watchDeps, () => {
      globalThis.__fetchCache.delete(cacheKey) // 清除缓存
      execute()
    })
  }

  return {
    data,
    pending,
    error,
    refresh: execute
  }
}

// ====== 测试用例 ======
// 模拟 SSR 环境
async function testSSR() {
  console.log('=== 测试 useMyFetch ===')

  // 模拟客户端调用
  globalThis.window = {} // 模拟浏览器环境

  // 注意：实际使用中需要在 Vue setup 中调用
  // const { data, pending, error, refresh } = useMyFetch('/api/users')
  // console.log('pending:', pending.value)  // true
  // console.log('data:', data.value)        // null（加载中）
  // await refresh()
  // console.log('data:', data.value)        // [{ id: 1, name: 'penny' }]
}

testSSR()
```

---

## 💻 算法题

### LeetCode #101 — 对称二叉树

**思路**：递归判断左子树的左孩子和右子树的右孩子是否相等，左子树的右孩子和右子树的左孩子是否相等。

```js
/**
 * 对称二叉树
 * @param {TreeNode} root
 * @return {boolean}
 * 时间复杂度 O(n)，空间复杂度 O(h)
 */
function isSymmetric(root) {
  if (!root) return true

  function isMirror(left, right) {
    if (!left && !right) return true
    if (!left || !right) return false
    return left.val === right.val
      && isMirror(left.left, right.right)
      && isMirror(left.right, right.left)
  }

  return isMirror(root.left, root.right)
}

// 迭代解法（BFS — 双队列）
function isSymmetricBFS(root) {
  if (!root) return true
  const queue = [root.left, root.right]

  while (queue.length) {
    const left = queue.shift()
    const right = queue.shift()

    if (!left && !right) continue
    if (!left || !right || left.val !== right.val) return false

    queue.push(left.left, right.right)
    queue.push(left.right, right.left)
  }

  return true
}
```

### LeetCode #102 — 二叉树的层序遍历

```js
/**
 * 二叉树层序遍历
 * @param {TreeNode} root
 * @return {number[][]}
 * 时间复杂度 O(n)，空间复杂度 O(n)
 */
function levelOrder(root) {
  if (!root) return []

  const result = []
  const queue = [root]

  while (queue.length) {
    const level = []
    const size = queue.length

    for (let i = 0; i < size; i++) {
      const node = queue.shift()
      level.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }

    result.push(level)
  }

  return result
}

// 测试：    3
//          / \
//         9  20
//           /  \
//          15   7
// 输出: [[3], [9, 20], [15, 7]]
```

### LeetCode #105 — 从前序与中序遍历构造二叉树

**思路**：前序第一个是根节点，在中序中找到根的位置，左边是左子树，右边是右子树。递归构建。

```js
/**
 * 从前序与中序遍历构造二叉树
 * @param {number[]} preorder
 * @param {number[]} inorder
 * @return {TreeNode}
 * 时间复杂度 O(n)，空间复杂度 O(n)
 */
function buildTree(preorder, inorder) {
  // 1. 用 Map 存储中序值→索引，避免每次线性查找
  const inorderMap = new Map()
  inorder.forEach((val, i) => inorderMap.set(val, i))

  let preIdx = 0

  // 2. 递归构建
  function build(inLeft, inRight) {
    if (inLeft > inRight) return null

    // 3. 前序当前元素是根节点
    const rootVal = preorder[preIdx++]
    const root = new TreeNode(rootVal)

    // 4. 在中序中找到根的位置
    const inIdx = inorderMap.get(rootVal)

    // 5. ⚠️ 先构建左子树，再构建右子树（因为 preIdx 按前序递增）
    root.left = build(inLeft, inIdx - 1)
    root.right = build(inIdx + 1, inRight)

    return root
  }

  return build(0, inorder.length - 1)
}

// 测试
// preorder = [3, 9, 20, 15, 7]
// inorder  = [9, 3, 15, 20, 7]
//        3
//       / \
//      9  20
//        /  \
//       15   7
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| SSR Hydration | 服务端渲染 HTML → 客户端挂载 Vue 实例附着事件和响应式 | ⭐⭐⭐⭐⭐ |
| SSR vs SSG vs ISR | SSR 实时渲染、SSG 构建时生成、ISR 增量静态再生成 | ⭐⭐⭐⭐⭐ |
| useFetch | SSR 兼容、自动去重、缓存、响应式参数、类型推断 | ⭐⭐⭐⭐ |
| Nuxt 3 自动导入 | Vue API、components/、composables/、Nuxt 内置 API | ⭐⭐⭐⭐ |
| 敏感数据处理 | 服务端 API 代理、环境变量不暴露给客户端 | ⭐⭐⭐⭐ |
| 路由中间件 | defineNuxtRouteMiddleware + definePageMeta | ⭐⭐⭐ |

---

## 📌 明天预告（Day 13）

明天是**第二周复盘日**，轻量学习 2-3h。Vue 全部知识点串讲、面试答题框架整理、"项目中 Vue vs React 怎么选"。复习为主，冲刺 🎯
