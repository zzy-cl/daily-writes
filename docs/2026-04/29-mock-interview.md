# 04/29 — 全真模拟面试（Day 29）

> **阶段**：第四阶段 工程化 + AI Agent + 综合冲刺
> **今日目标**：通过全真模拟找状态，发现薄弱环节做最后冲刺
> **投入时间**：上午 2h / 下午 2h / 晚上 1h

---

## 🔑 知识点 1：模拟面试流程设计

### 技术一面（45 分钟模板）

```
📋 技术一面流程

├── 0-2min    自我介绍（精炼版，不超过2分钟）
├── 2-15min   JS 八股 + 手写题 × 2
├── 15-30min  框架原理深挖 × 3（Vue3/React 选你擅长的）
├── 30-40min  场景题 × 1（性能优化/架构设计/项目深挖）
└── 40-45min  反问环节（准备 3 个好问题）
```

### 自我介绍模板（2 分钟版）

```
面试官您好，我叫 [姓名]，[X] 年前端开发经验。

技术栈方面，主力是 Vue 3 + TypeScript，React 18 也有实际项目经验。
构建工具用 Vite，状态管理用 Pinia/Zustand，也有 Next.js/Nuxt 3 的 SSR 实践。

在 [上家公司] 主要负责 [核心业务模块]，
其中最有挑战的是 [具体项目]，我主导了 [技术方案]，
最终实现了 [量化成果，如"首屏 LCP 从 3.2s 优化到 1.1s"]。

2026 年我也在深入探索 AI 辅助开发和 Agent 开发方向，
能用 MCP 协议暴露工具给 AI，也做过 RAG 集成。

我对贵司的 [具体业务/技术方向] 很感兴趣，希望能有机会加入。
```

### 反问环节（3 个好问题）

| # | 问题 | 为什么问这个 |
|---|------|-------------|
| 1 | 团队目前的技术栈是什么？有技术演进规划吗？ | 展示你关心技术成长 |
| 2 | 这个岗位日常工作中最有挑战的部分是什么？ | 展示你想解决难题 |
| 3 | 团队的代码 review 和技术分享机制是怎样的？ | 展示你重视协作和学习 |

---

## 🔑 知识点 2：20 道高频八股文速答

### JavaScript（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 1 | 闭包是什么？ | 函数 + 词法环境，让内部函数访问外部作用域的变量 |
| 2 | Event Loop？ | 同步→微任务(Promise.then)→宏任务(setTimeout) |
| 3 | Promise.all vs allSettled？ | all 有一个失败就 reject，allSettled 等全部完成 |
| 4 | 原型链？ | 实例.\_\_proto\_\_ → 构造函数.prototype → Object.prototype → null |
| 5 | 深拷贝？ | JSON.parse(JSON.stringify) 简单场景；递归+WeakMap 处理循环引用 |

### Vue（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 6 | Proxy vs defineProperty？ | Proxy 能检测新增/删除属性、数组变化、支持 Map/Set |
| 7 | ref vs reactive？ | ref 包装任意类型需 .value，reactive 只包装对象 |
| 8 | Pinia vs Vuex？ | Pinia 无 Mutation、去 Module 嵌套、天然 TS 支持 |
| 9 | watch vs watchEffect？ | watch 需指定源可获取新旧值，watchEffect 自动追踪立即执行 |
| 10 | Vue 3 编译优化？ | PatchFlag 标记动态节点 + HoistStatic 静态提升 + Block Tree |

### React（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 11 | Fiber 是什么？ | 链表结构的虚拟 DOM，支持时间切片，渲染可中断 |
| 12 | Hooks 为什么必须顶层？ | 底层用链表存储状态，顺序依赖，条件调用会错位 |
| 13 | useEffect 清理函数？ | 组件卸载时和下次 effect 执行前调用 |
| 14 | useTransition vs useDeferredValue？ | Transition 标记低优先级更新，DeferredValue 延迟某个值 |
| 15 | RSC vs SSR？ | SSR 每次请求渲染 HTML + 水合；RSC 只在服务端运行，不发送 JS |

### CSS + 网络（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 16 | BFC？ | 块级格式化上下文，触发条件：overflow≠visible/flex子项/position:absolute |
| 17 | HTTP/2 vs 1.1？ | 多路复用、头部压缩、服务器推送、二进制分帧 |
| 18 | XSS 防范？ | CSP + 转义输出 + HttpOnly Cookie + 避免 innerHTML |
| 19 | CSRF 防范？ | SameSite Cookie + CSRF Token + 验证 Origin |
| 20 | CORS 预检请求？ | 非简单请求（自定义 Header/PUT/DELETE）会先发 OPTIONS |

### ❌/✅ 八股常见错误对比

| 话题 | ❌ 错误回答 | ✅ 正确回答 |
|------|-----------|-----------|
| 闭包 | "闭包就是函数套函数" | 函数 + 其词法作用域的引用，使内部函数能访问外部变量，即使外部函数已执行完毕 |
| Event Loop | "先执行宏任务再执行微任务" | 同步代码 → 微任务队列清空 → 一个宏任务 → 微任务清空... 微任务优先级更高 |
| Vue 响应式 | "Vue 3 用 Proxy 就没有限制了" | Proxy 不能代理原始值，所以才需要 ref() 做包装；reactive 解构会丢失响应性 |
| React Hooks | "useCallback 就是缓存函数" | useCallback 是缓存引用，真正性能收益在配合 React.memo 防止子组件重渲染时才体现 |
| CSS 居中 | "flex 用 justify-content: center 就行了" | 水平+垂直居中需 justify-content + align-items 双设置，或用 place-items: center |
| HTTP 缓存 | "Cache-Control: no-cache 就是不缓存" | no-cache 是可以缓存但每次必须向服务器验证；no-store 才是完全不缓存 |

### ⚠️ 八股易错提示

> ⚠️ **原型链不是继承**：JS 的原型机制是委托（delegation），不是类继承。说"原型继承"不够精确。
>
> ⚠️ **Promise.all 的 fail-fast**：一个 reject 立即返回，其余 Promise 的结果会被丢弃。如果需要全部结果用 allSettled。
>
> ⚠️ **Vue 3 reactive 的解构陷阱**：`const { count } = reactive({ count: 0 })` 解构后 count 是普通变量，丢失响应性。用 `toRefs()` 或直接用 `ref()`。
>
> ⚠️ **React useEffect 依赖数组**：传空数组 `[]` 不等于"只在挂载时执行一次"——严格模式下会执行两次。对象/数组作为依赖要用 `useMemo`/`useCallback` 稳定引用。
>
> ⚠️ **CSS 选择器权重**：`!important` > 内联样式(1000) > ID(100) > 类/伪类(10) > 元素(1)。面试时写错权重会减分。

---

## 🔑 知识点 3：系统设计题答题框架

### 答题模板

```
1. 需求澄清（1-2分钟）
   - 明确功能边界、用户量级、核心指标

2. 架构设计（5-8分钟）
   - 画出整体架构图（前端→API→后端→数据库）
   - 说明前端职责边界

3. 技术选型（3-5分钟）
   - 框架选择理由
   - 关键技术方案

4. 扩展性考虑（2-3分钟）
   - 性能瓶颈在哪里？怎么扩展？
   - 错误处理和监控

5. 总结（1分钟）
   - 方案优劣对比
   - 如果时间充裕会做什么优化
```

### 示例 A：设计一个权限管理系统

```markdown
需求：RBAC 权限控制，支持角色→权限→资源的层级关系

架构：
├── 前端：路由守卫 + 指令级权限（v-permission）
├── 后端：JWT + 角色权限中间件
└── 数据库：用户表 → 用户角色表 → 角色表 → 角色权限表 → 权限表

技术方案：
- 路由守卫：beforeEach 中检查 meta.roles
- 按钮级权限：自定义指令 v-permission="'user:create'"
- 动态路由：后端返回菜单树，前端 addRoute 动态添加
- 权限缓存：Pinia 存储，localStorage 持久化，登录后刷新
```

### 示例 B：设计一个实时协作编辑器的前端架构

```markdown
需求：多人同时编辑文档，支持光标同步、冲突解决、离线编辑

1. 需求澄清
   - 用户量级：单文档 50 人同时编辑
   - 核心指标：延迟 < 200ms，不丢操作，离线后能自动合并
   - 功能边界：纯文本/富文本协作，不含语音视频

2. 架构设计
   ┌──────────┐     WebSocket      ┌──────────────┐
   │  前端编辑器 │ ◄──────────────► │  协同服务器     │
   │  (CRDT)   │                   │  (Operation   │
   │           │     HTTP/REST     │   Transform)  │
   │  本地存储   │ ◄──────────────► │  持久化存储     │
   └──────────┘                   └──────────────┘

3. 技术选型
   - 编辑器内核：Slate.js / ProseMirror（可定制、插件丰富）
   - 冲突解决：OT（Operational Transformation）或 CRDT
     · OT：Google Docs 方案，中心化仲裁，实现复杂但成熟
     · CRDT：去中心化，每个客户端独立合并，适合 P2P 场景
     · 推荐 CRDT（Y.js 库），天然支持离线编辑
   - 通信层：WebSocket（实时）+ HTTP（持久化/历史版本）
   - 光标同步：独立的消息通道，频率限制 50ms/次，远端光标用不同颜色标识
   - 离线支持：IndexedDB 存储本地操作日志，上线后自动同步合并

4. 关键方案详解
   a) CRDT 合并流程
      - 每个字符有唯一 ID（clientID + clock）
      - 插入/删除都是不可逆操作
      - 任意顺序合并都能得到相同结果
   b) 光标同步
      - 防抖 50ms 发送光标位置
      - 服务端广播给其他客户端
      - 3 秒无更新视为离线，清除光标
   c) 离线编辑
      - 操作记录存 IndexedDB
      - 重连后按 CRDT 规则合并
      - 冲突自动解决，无需用户干预

5. 性能优化
   - 虚拟滚动：大文档只渲染可视区域
   - 操作合并：连续输入合并为批量操作
   - 增量同步：只发送 diff 而非全量文档
   - Web Worker：CRDT 计算放到 Worker 线程，不阻塞 UI

6. 扩展性
   - 多文档支持：每个文档独立 CRDT 实例
   - 权限控制：文档级读写权限 + 区域锁（可选）
   - 版本历史：定期快照 + 操作日志，支持回滚
   - 监控告警：同步延迟 P99、冲突率、离线重连成功率
```

> ⚠️ **系统设计易错**：不要上来就说技术选型，先做需求澄清。面试官想看到你的思考过程，不是背诵答案。
>
> ⚠️ **CRDT vs OT**：面试时如果被追问，OT 需要中心化服务器做操作转换，CRDT 不需要。但 CRDT 内存开销更大，简单场景 OT 更实用。

---

## ✍️ 手写题（高频手写代码）

### 手写题 1：防抖（Debounce）

```javascript
/**
 * 防抖：事件停止触发 delay ms 后才执行
 * 应用场景：搜索框输入、窗口 resize、表单验证
 */
function debounce(fn, delay, immediate = false) {
  let timer = null

  const debounced = function (...args) {
    // 如果已有定时器，清除
    if (timer) clearTimeout(timer)

    // 立即执行模式：第一次调用立即执行，之后等停止触发
    if (immediate && !timer) {
      fn.apply(this, args)
    }

    timer = setTimeout(() => {
      // 非立即模式：在定时器到期时执行
      if (!immediate) {
        fn.apply(this, args)
      }
      timer = null  // 重置，让下一轮 immediate 能再次触发
    }, delay)
  }

  // 添加取消方法
  debounced.cancel = function () {
    clearTimeout(timer)
    timer = null
  }

  return debounced
}

// 用法
const search = debounce((keyword) => {
  console.log('搜索:', keyword)
}, 300)

search('h')  // 不执行
search('he') // 不执行
search('hel') // 300ms 后执行 "搜索: hel"
```

### 手写题 2：节流（Throttle）

```javascript
/**
 * 节流：固定时间间隔最多执行一次
 * 应用场景：滚动事件、拖拽、鼠标移动
 */
function throttle(fn, interval) {
  let lastTime = 0
  let timer = null

  const throttled = function (...args) {
    const now = Date.now()

    // 时间间隔到了，立即执行
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    } else if (!timer) {
      // 时间没到，但确保最后一次能执行（尾部执行）
      timer = setTimeout(() => {
        lastTime = Date.now()
        timer = null
        fn.apply(this, args)
      }, interval - (now - lastTime))
    }
  }

  throttled.cancel = function () {
    clearTimeout(timer)
    timer = null
    lastTime = 0
  }

  return throttled
}

// 用法
const onScroll = throttle(() => {
  console.log('滚动事件处理')
}, 200)
// 每 200ms 最多执行一次，保证头部和尾部都触发
```

### 手写题 3：深拷贝（Deep Clone）

```javascript
/**
 * 深拷贝：处理循环引用、特殊对象类型
 */
function deepClone(obj, map = new WeakMap()) {
  // 基本类型直接返回
  if (obj === null || typeof obj !== 'object') return obj

  // 处理循环引用
  if (map.has(obj)) return map.get(obj)

  // 处理特殊对象类型
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags)
  if (obj instanceof Map) {
    const cloned = new Map()
    map.set(obj, cloned)
    obj.forEach((val, key) => cloned.set(deepClone(key, map), deepClone(val, map)))
    return cloned
  }
  if (obj instanceof Set) {
    const cloned = new Set()
    map.set(obj, cloned)
    obj.forEach(val => cloned.add(deepClone(val, map)))
    return cloned
  }

  // 处理数组和普通对象
  const cloned = Array.isArray(obj) ? [] : {}
  map.set(obj, cloned)

  // 拷贝自身属性 + Symbol 属性
  Reflect.ownKeys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key], map)
  })

  return cloned
}

// 测试
const original = {
  date: new Date(),
  regex: /test/gi,
  map: new Map([['key', { nested: true }]]),
  set: new Set([1, 2, 3]),
  arr: [1, [2, 3]],
}
original.self = original  // 循环引用

const copy = deepClone(original)
console.log(copy.self === copy)       // true — 循环引用正确
console.log(copy.date !== original.date) // true — 独立副本
console.log(copy.map.get('key') !== original.map.get('key')) // true
```

### 手写题 4：发布订阅（EventEmitter）

```javascript
/**
 * 发布订阅模式：面试手写高频题
 */
class EventEmitter {
  constructor() {
    this.events = {}
  }

  // 订阅
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
    // 返回取消函数
    return () => this.off(event, callback)
  }

  // 一次性订阅
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      callback.apply(this, args)
    }
    this.on(event, wrapper)
  }

  // 发布
  emit(event, ...args) {
    const callbacks = this.events[event]
    if (callbacks) {
      callbacks.forEach(cb => cb.apply(this, args))
    }
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  // 获取所有事件名
  eventNames() {
    return Object.keys(this.events)
  }

  // 获取某个事件的订阅数
  listenerCount(event) {
    return (this.events[event] || []).length
  }
}

// 测试
const bus = new EventEmitter()
const unsub = bus.on('msg', (data) => console.log('收到:', data))
bus.emit('msg', 'hello')  // 收到: hello
unsub()  // 取消订阅
bus.emit('msg', 'world')  // 无输出
```

### ⚠️ 手写题易错提示

> ⚠️ **防抖 vs 节流搞混**：防抖是"等停下来再执行"，节流是"固定频率执行"。搜索框用防抖，滚动事件用节流。
>
> ⚠️ **深拷贝的 WeakMap 用途**：不是为了性能，而是为了处理循环引用。没有 WeakMap 会无限递归爆栈。
>
> ⚠️ **EventEmitter 内存泄漏**：如果组件销毁时忘了 off 所有事件，回调函数会一直被引用无法 GC。实际项目中要用 Vue 的 onUnmounted / React 的 useEffect cleanup 来取消订阅。
>
> ⚠️ **apply vs call**：手写题中常用 `fn.apply(this, args)`，面试官可能追问为什么不用 call。答案：apply 接受数组参数，适合展开 rest args。

---

## 💻 算法题（限时 30 分钟 × 3）

> 模拟面试推荐顺序：中等 → 中等 → 中等偏难。

### 算法题 1：#15 三数之和（中等）

```javascript
/**
 * 双指针法 — O(n²) 时间 / O(1) 空间（不含输出）
 * 1. 排序数组
 * 2. 固定一个数，用双指针找另外两个数
 * 3. 注意去重
 */
function threeSum(nums) {
  nums.sort((a, b) => a - b)
  const result = []

  for (let i = 0; i < nums.length - 2; i++) {
    // 去重：相同的第一个数跳过
    if (i > 0 && nums[i] === nums[i - 1]) continue

    let left = i + 1, right = nums.length - 1

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right]

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]])
        // 去重：跳过相同的 left 和 right
        while (left < right && nums[left] === nums[left + 1]) left++
        while (left < right && nums[right] === nums[right - 1]) right--
        left++
        right--
      } else if (sum < 0) {
        left++
      } else {
        right--
      }
    }
  }

  return result
}

console.log(threeSum([-1, 0, 1, 2, -1, -4])) // [[-1,-1,2],[-1,0,1]]
console.log(threeSum([0, 0, 0])) // [[0,0,0]]
```

### 算法题 2：#200 岛屿数量（中等）

```javascript
/**
 * BFS/DFS 遍历网格 — O(m×n) 时间 / O(m×n) 空间
 * 面试高频：网格类 DFS/BFS
 *
 * 思路：遍历网格，遇到 '1' 就 BFS 把整个岛标记为已访问，计数+1
 */
function numIslands(grid) {
  if (!grid.length) return 0

  const rows = grid.length
  const cols = grid[0].length
  let count = 0

  function bfs(r, c) {
    const queue = [[r, c]]
    grid[r][c] = '0'  // 标记已访问

    while (queue.length) {
      const [cr, cc] = queue.shift()
      // 四个方向
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]

      for (const [dr, dc] of dirs) {
        const nr = cr + dr
        const nc = cc + dc

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1') {
          grid[nr][nc] = '0'  // 标记
          queue.push([nr, nc])
        }
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++
        bfs(r, c)
      }
    }
  }

  return count
}

// 测试
const grid = [
  ['1', '1', '0', '0', '0'],
  ['1', '1', '0', '0', '0'],
  ['0', '0', '1', '0', '0'],
  ['0', '0', '0', '1', '1'],
]
console.log(numIslands(grid)) // 3
```

> ⚠️ **BFS vs DFS 选择**：面试时问你为什么选 BFS，可以说"BFS 在大网格中不会栈溢出"。实际两者复杂度一样。
>
> ⚠️ **修改原数组**：把 '1' 改成 '0' 是在原数组上标记。如果面试官要求不修改原数组，用一个 `visited` Set 来记录。

### 算法题 3：#3 无重复字符的最长子串（中等）

```javascript
/**
 * 滑动窗口 — O(n) 时间 / O(min(m,n)) 空间
 * m = 字符集大小，n = 字符串长度
 *
 * 思路：右指针扩张窗口，遇到重复字符时左指针收缩
 */
function lengthOfLongestSubstring(s) {
  const seen = new Map()  // char -> 最近出现的索引
  let maxLen = 0
  let left = 0

  for (let right = 0; right < s.length; right++) {
    const char = s[right]

    // 如果字符已在窗口内，移动左指针到重复字符的下一个位置
    if (seen.has(char) && seen.get(char) >= left) {
      left = seen.get(char) + 1
    }

    seen.set(char, right)
    maxLen = Math.max(maxLen, right - left + 1)
  }

  return maxLen
}

console.log(lengthOfLongestSubstring('abcabcbb')) // 3 ("abc")
console.log(lengthOfLongestSubstring('bbbbb'))    // 1 ("b")
console.log(lengthOfLongestSubstring('pwwkew'))   // 3 ("wke")
```

> ⚠️ **滑动窗口模板**：很多子串/子数组题都用滑动窗口。关键是搞清楚什么时候移动左指针。
>
> ⚠️ **seen.get(char) >= left**：这个条件容易漏。如果字符虽然在 Map 中但位置已经在 left 左边，说明不在当前窗口内，不应该触发收缩。

### ❌/✅ 算法题常见错误对比

| 题目 | ❌ 常见错误 | ✅ 正确做法 |
|------|-----------|-----------|
| 三数之和 | 不排序直接三层循环 O(n³) | 先排序 + 固定一个数用双指针 O(n²) |
| 三数之和 | 去重逻辑写在内层循环外 | 先跳过相同元素再进入循环，三处去重缺一不可 |
| 岛屿数量 | 用 Set 存坐标去重但没标记原数组 | 直接改 '1'→'0' 最简洁；或用 visited 二维数组 |
| 最长子串 | 用 Set 判断重复，遇到重复时一个个移除 | 用 Map 存索引，直接跳到重复字符的下一个位置 |
| 最长子串 | left 只移动一位 (left++) | 应该跳到 seen.get(char) + 1，跳过整个重复区间 |

---

## 🎤 行为面试 STAR 示例（前端岗位）

### 什么是 STAR？

```
S — Situation（情境）：当时的情况是什么？
T — Task（任务）：你的职责是什么？
A — Action（行动）：你具体做了什么？
R — Result（结果）：最终结果如何？（最好量化）
```

### 示例 1：性能优化

```
S：我们电商首页在促销期间 LCP 达到 4.8 秒，用户跳出率很高。
T：作为前端负责人，我需要把 LCP 降到 2.5 秒以内。
A：
  1. 用 Lighthouse 分析发现 Hero Image 和首屏接口是瓶颈
  2. 图片方案：WebP + 响应式 srcset + preload 关键图片
  3. 接口方案：SSR 首屏数据 + SWR 客户端缓存策略
  4. 构建优化：代码分割 + 动态 import + Tree Shaking
R：LCP 从 4.8s 降到 1.3s，跳出率降低 18%，转化率提升 7%。
```

### 示例 2：跨团队协作

```
S：后端 API 改版导致前端大面积报错，需要在 2 周内完成迁移。
T：协调前端 3 人 + 后端 2 人完成接口迁移，同时保证业务不中断。
A：
  1. 建立 API Diff 文档，标记所有 breaking changes
  2. 在前端封装 Adapter 层，新旧接口都能工作
  3. 每天 15 分钟站会同步进度，用 Jira 跟踪
  4. 写了一套接口 Mock，让前端可以并行开发
R：提前 3 天完成迁移，零线上事故。Adapter 模式后来成为团队标准方案。
```

### 示例 3：技术难题攻克

```
S：富文本编辑器在 Safari 上出现光标跳动和内容丢失的 Bug，用户投诉率高。
T：定位并修复跨浏览器兼容性问题。
A：
  1. 复现问题后发现 Safari 对 contenteditable 的 Selection API 行为不同
  2. 研究了 ProseMirror 源码，发现是 DOM mutation 观察时序问题
  3. 给 Selection 的更新加了 requestAnimationFrame 延迟
  4. 提了 PR 到 ProseMirror 社区，被合并
R：Safari 崩溃率从 12% 降到 0.3%，PR 被社区采纳，获得 200+ star。
```

### ⚠️ 行为面试易错提示

> ⚠️ **不要只说"我们"**：面试官想听你个人做了什么。多用"我负责..."、"我主导..."，少用"我们团队..."。
>
> ⚠️ **Result 要量化**：不要说"性能变好了"，要说"LCP 从 4.8s 降到 1.3s"。没有具体数据会让回答缺乏说服力。
>
> ⚠️ **准备失败案例**：面试官常会问"说一个你失败的经历"。提前准备一个真实的失败案例，重点放在你学到了什么。
>
> ⚠️ **别编故事**：行为面试追问细节很深入，编的故事经不起追问。用自己的真实经历，哪怕是小项目也可以讲出亮点。

---

## 📝 今日总结

| 模块 | 核心要点 | 重要程度 |
|------|---------|---------|
| 自我介绍 | 2分钟精炼版，含技术栈+项目亮点+AI方向 | ⭐⭐⭐⭐⭐ |
| 技术一面流程 | 自我介绍→八股→框架→场景→反问 | ⭐⭐⭐⭐ |
| 八股速答 | JS/Vue/React/CSS/网络各5题，能秒答 | ⭐⭐⭐⭐⭐ |
| 八股易错 | 6 组 ❌/✅ 对比，纠正常见误区 | ⭐⭐⭐⭐ |
| 手写题 | 防抖、节流、深拷贝、EventEmitter 四道必刷 | ⭐⭐⭐⭐⭐ |
| 算法题 | 三数之和、岛屿数量、最长子串 | ⭐⭐⭐⭐⭐ |
| 系统设计 | 权限管理 + 实时协作编辑器，需求→架构→选型→优化 | ⭐⭐⭐⭐ |
| 行为面试 | STAR 方法论 + 3 个前端场景示例 | ⭐⭐⭐⭐ |
| 反问环节 | 准备3个好问题，展示技术追求 | ⭐⭐⭐ |

### 🔥 模拟面试 Checklist

- [ ] 自我介绍能流利说 2 分钟以内
- [ ] 20 道八股能秒答（不超过 10 秒/题）
- [ ] 防抖/节流/深拷贝/EventEmitter 能闭眼写
- [ ] 三数之和 15 分钟内写完并处理去重
- [ ] 岛屿数量能讲清 BFS 和 DFS 的区别
- [ ] 最长子串能解释滑动窗口的核心逻辑
- [ ] 系统设计能画出架构图并说明技术选型理由
- [ ] 准备 3 个 STAR 故事（性能优化/协作/技术难题）
- [ ] 反问环节准备 3 个好问题

---

## 📌 明天预告（Day 30）

最后一天！查漏补缺 + 心态调整，全月知识体系总回顾，然后——你已经准备好了 🔥
