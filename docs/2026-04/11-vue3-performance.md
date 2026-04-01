# 04/11 — Vue 3 性能优化（Day 11）

> **阶段**：第二阶段 Vue 3
> **今日目标**：掌握 Vue 3 运行时与构建时性能优化手段
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：v-once / v-memo ⭐

### 1.1 v-once — 一次性渲染

`v-once` 让元素/组件只渲染一次，后续更新直接跳过：

```vue
<template>
  <!-- v-once 内容只渲染一次，无论 count 如何变化 -->
  <p v-once>初始值: {{ count }}</p>
  <p>当前值: {{ count }}</p>
  <button @click="count++">+1</button>
</template>

<script setup>
const count = ref(0)
// 点击后：
// "初始值: 0" 永远不变
// "当前值: 1" 正常更新
</script>
```

**底层原理**：编译时标记为静态节点（PatchFlag = -1 HOISTED），Diff 时直接跳过。

### 1.2 v-memo — 条件缓存（Vue 3.2+）⭐

`v-memo` 是 Vue 3.2 新增的指令，比 `v-once` 更灵活——依赖不变才跳过更新：

```vue
<template>
  <!-- 只有当 item.id 或 item.selected 变化时才重新渲染 -->
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    <p>{{ item.name }}</p>
    <p>{{ item.description }}</p>
    <input type="checkbox" :checked="item.selected" />
  </div>
</template>
```

**使用场景**：

```vue
<template>
  <!-- 大列表渲染优化 — 只有选中状态变化时才重新渲染该行 -->
  <div v-for="user in 1000Users" :key="user.id" v-memo="[user.id, selectedIds.includes(user.id)]">
    <UserCard :user="user" :selected="selectedIds.includes(user.id)" />
  </div>

  <!-- 对比不使用 v-memo：任何数据变化都会触发 1000 个 UserCard 重新 diff -->
</template>
```

### 1.3 v-memo vs computed 区别

| 特性 | v-memo | computed |
|------|--------|----------|
| 作用层级 | 模板渲染 | JavaScript 计算 |
| 控制粒度 | 模板块级别 | 单个值级别 |
| 使用场景 | 列表项渲染优化 | 派生状态计算 |
| 语法 | 指令 + 依赖数组 | 函数 |
| 缓存判断 | 依赖数组浅比较 | 标志位 `_dirty` |

```vue
<template>
  <!-- v-memo — 缓存整个模板块的渲染结果 -->
  <div v-memo="[userId]">
    <p>用户名: {{ user.name }}</p>
    <p>邮箱: {{ user.email }}</p>
    <p>注册时间: {{ user.createdAt }}</p>
  </div>

  <!-- computed — 缓存单个计算值 -->
  <p>全名: {{ fullName }}</p>
</template>

<script setup>
// v-memo 适合：模板块内容复杂、依赖项少
// computed 适合：派生值计算，其他地方也需要使用

const fullName = computed(() => `${user.firstName} ${user.lastName}`)
</script>
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| v-once 和 v-memo 的区别？ | v-once 只渲染一次，v-memo 依赖数组变化时才重新渲染 |
| v-memo 的使用场景？ | 大列表中只有少数项会变化的场景，如虚拟列表选中状态 |
| v-memo 会引入内存问题吗？ | 缓存的是 VNode 树，依赖数组变化时旧缓存被替换，不会持续增长 |

---

## 知识点 2：虚拟滚动原理与实现 ⭐

### 2.1 为什么需要虚拟滚动

```
渲染 10000 条数据：
  普通列表 → 创建 10000 个 DOM 节点 → 内存爆炸 + 滚动卡顿
  虚拟滚动 → 只渲染可视区域 ~20 个节点 → 流畅滚动
```

### 2.2 核心原理

```
┌─────────────── 可视区域（viewport）───────┐
│  ┌─────────────────────────────────────┐  │
│  │  buffer（缓冲区，预渲染上下各 N 行）   │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │  │
│  │  │ 6 │ │ 7 │ │ 8 │ │ 9 │ │ 10│    │  │ ← 可见项
│  │  └───┘ └───┘ └───┘ └───┘ └───┘    │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
  paddingTop: 6 × itemHeight              ← 占位撑开滚动
  paddingBottom: (total - 10 - buffer) × itemHeight
```

### 2.3 定高虚拟滚动实现

```vue
<template>
  <div
    ref="containerRef"
    class="virtual-list"
    @scroll="onScroll"
  >
    <!-- 上方占位 -->
    <div :style="{ height: totalHeight + 'px' }" class="scroll-wrapper">
      <!-- 可视区域内容 -->
      <div
        :style="{ transform: `translateY(${offsetY}px)` }"
        class="content"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id"
          class="item"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 50 },
  containerHeight: { type: Number, default: 400 },
  buffer: { type: Number, default: 5 } // 上下缓冲区
})

const containerRef = ref(null)
const scrollTop = ref(0)

// 1. 总高度 — 撑出滚动条
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 2. 起始索引
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
})

// 3. 结束索引
const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  return Math.min(props.items.length, startIndex.value + visibleCount + props.buffer * 2)
})

// 4. 可见项
const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value)
})

// 5. 偏移量 — 将可见项定位到正确位置
const offsetY = computed(() => startIndex.value * props.itemHeight)

// 6. 滚动事件
function onScroll() {
  scrollTop.value = containerRef.value.scrollTop
}
</script>

<style scoped>
.virtual-list {
  height: v-bind(containerHeight + 'px');
  overflow-y: auto;
}
.scroll-wrapper {
  position: relative;
}
.content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
.item {
  height: v-bind(itemHeight + 'px');
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}
</style>
```

### 2.4 不定高虚拟滚动

当列表项高度不固定时，需要动态测量：

```js
/**
 * 不定高虚拟滚动核心逻辑
 */
function useDynamicVirtualList(items, estimatedHeight = 50) {
  // 1. 记录每个项的位置信息
  // positions = [{ top: 0, bottom: 50, height: 50 }, { top: 50, bottom: 110, height: 60 }, ...]
  const positions = ref([])

  // 2. 初始化位置信息
  function initPositions() {
    positions.value = items.value.map((item, index) => ({
      index,
      height: estimatedHeight,
      top: index * estimatedHeight,
      bottom: (index + 1) * estimatedHeight
    }))
  }

  // 3. 二分查找 — 根据 scrollTop 找起始索引
  function getStartIndex(scrollTop) {
    let left = 0, right = positions.value.length - 1
    while (left <= right) {
      const mid = (left + right) >> 1
      if (positions.value[mid].bottom >= scrollTop) {
        right = mid - 1
      } else {
        left = mid + 1
      }
    }
    return left
  }

  // 4. 更新可见项的高度（DOM 测量后回调）
  function updateItemHeight(index, realHeight) {
    const oldHeight = positions.value[index].height
    const diff = realHeight - oldHeight
    if (diff === 0) return

    positions.value[index].height = realHeight
    positions.value[index].bottom = positions.value[index].top + realHeight

    // 后续项的位置都需要调整
    for (let i = index + 1; i < positions.value.length; i++) {
      positions.value[i].top = positions.value[i - 1].bottom
      positions.value[i].bottom = positions.value[i].top + positions.value[i].height
    }
  }

  return { positions, initPositions, getStartIndex, updateItemHeight }
}
```

### 2.5 可视区域计算公式

```
startIndex = Math.floor(scrollTop / itemHeight)
endIndex = startIndex + Math.ceil(containerHeight / itemHeight)
visibleCount = Math.ceil(containerHeight / itemHeight) + buffer × 2
offsetY = startIndex × itemHeight
totalHeight = items.length × itemHeight
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| 虚拟滚动的原理？ | 只渲染可视区域的 DOM，通过 translateY 定位，上下用占位 div 撑开滚动条 |
| 如何计算可视区域？ | scrollTop / itemHeight = 起始索引，加上可见数量和缓冲区 |
| 不定高列表怎么做？ | 记录每项的位置信息（二叉搜索树或数组+二分），DOM 渲染后测量真实高度并更新后续位置 |
| 缓冲区的作用？ | 避免快速滚动时出现白屏，上下额外渲染 N 行作为缓冲 |

---

## 知识点 3：keep-alive 缓存机制 ⭐

### 3.1 基本用法

```vue
<template>
  <keep-alive :include="['Home', 'About']" :max="10">
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

### 3.2 生命周期

```vue
<script setup>
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log('首次挂载 — 只执行一次')
})

onActivated(() => {
  console.log('进入缓存组件 — 每次显示都执行')
  // 可以在这里刷新数据
})

onDeactivated(() => {
  console.log('离开缓存组件 — 每次隐藏都执行')
})

onUnmounted(() => {
  console.log('组件被销毁 — max 限制或手动清除时')
})
</script>
```

### 3.3 keep-alive 内部实现

```js
// keep-alive 简化源码
const KeepAlive = {
  name: 'KeepAlive',
  props: {
    include: [String, RegExp, Array], // 白名单
    exclude: [String, RegExp, Array], // 黑名单
    max: [String, Number]             // 最大缓存数
  },

  setup(props, { slots }) {
    const cache = new Map()   // 缓存 VNode：key → VNode
    const keys = new Set()    // 缓存 key 的集合（用于 LRU）

    // 匹配组件名
    function matches(pattern, name) {
      if (Array.isArray(pattern)) {
        return pattern.some(p => matches(p, name))
      }
      if (typeof pattern === 'string') {
        return pattern.split(',').includes(name)
      }
      if (pattern instanceof RegExp) {
        return pattern.test(name)
      }
      return false
    }

    // 判断是否缓存
    function shouldCache(name) {
      if (props.include && !matches(props.include, name)) return false
      if (props.exclude && matches(props.exclude, name)) return false
      return true
    }

    // LRU 缓存淘汰
    function pruneCacheEntry(key) {
      const cached = cache.get(key)
      if (cached) {
        // 触发 unmounted 生命周期
        unmount(cached)
        cache.delete(key)
        keys.delete(key)
      }
    }

    // 缓存数量超过 max 时，删除最久未使用的
    function pruneCache() {
      if (props.max && keys.size > parseInt(props.max)) {
        // keys 按使用顺序排列，第一个是最久未用的
        const oldestKey = keys.values().next().value
        pruneCacheEntry(oldestKey)
      }
    }

    return () => {
      const vnode = slots.default()
      const name = vnode.type.name || vnode.type.__name

      if (!shouldCache(name)) {
        return vnode // 不缓存，直接返回
      }

      const key = vnode.key == null ? vnode.type : vnode.key
      const cachedVNode = cache.get(key)

      if (cachedVNode) {
        // 命中缓存 — 复用组件实例
        vnode.component = cachedVNode.component
        // 更新 LRU 顺序
        keys.delete(key)
        keys.add(key)
      } else {
        // 未命中 — 缓存新组件
        cache.set(key, vnode)
        keys.add(key)
        pruneCache() // 超过 max 时淘汰
      }

      // 标记为 keptAlive，避免 unmounted
      vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
      return vnode
    }
  }
}
```

### 3.4 缓存策略对比

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| 全缓存 | 不设置 include/exclude | 所有页面都需要缓存 |
| 白名单 | `:include="['Home']"` | 少数页面需要缓存 |
| 黑名单 | `:exclude="['Login']"` | 大部分页面需要缓存 |
| LRU | `:max="10"` | 内存有限，自动淘汰 |

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| keep-alive 的缓存策略？ | LRU（最近最少使用），超出 max 时淘汰最久未用的组件 |
| include/exclude 匹配的是什么？ | 组件的 name 属性（不是路由名） |
| 缓存的组件什么时候被销毁？ | 超出 max 淘汰、手动 remove、include/exclude 变化导致不匹配时 |
| keep-alive 和 v-if 的区别？ | v-if 切换会销毁/重建组件，keep-alive 切换时保留组件实例和状态 |

---

## 知识点 4：Tree-shaking 与按需导入 ⭐

### 4.1 Vue 3 的 Tree-shaking 支持

Vue 3 所有 API 都支持 ES Module 导入，未使用的 API 会被打包工具移除：

```js
// ✅ Vue 3 — 按需导入，未用的不会打包
import { ref, computed, watch } from 'vue'
// 如果没用 watch，打包时自动移除 watch 相关代码

// ❌ Vue 2 — 全量引入
import Vue from 'vue'
// Vue.nextTick, Vue.directive 等全部打包，即使没用
```

### 4.2 组件按需导入

```vue
<template>
  <!-- ✅ 自动按需导入（unplugin-vue-components） -->
  <ElButton>Click</ElButton>
  <ElInput v-model="value" />
</template>

<!-- 不需要手动 import，插件自动处理 -->
```

配置 `unplugin-vue-components`：

```js
// vite.config.js
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ]
}
```

### 4.3 按需导入对比

| 方式 | 代码示例 | 打包体积 | 维护成本 |
|------|---------|---------|---------|
| 全量引入 | `import ElementPlus from 'element-plus'` | 最大 | 最低 |
| 手动按需 | `import { ElButton } from 'element-plus'` | 较小 | 高 |
| 插件自动 | unplugin-vue-components | 最小 | 低 |

### 4.4 路由懒加载

```js
// router/index.js
const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue') // ✅ 懒加载
  },
  {
    path: '/about',
    component: () => import('@/views/About.vue')
  }
]

// 打包后会生成独立的 chunk：
// Home.xxx.js — 用户访问 / 时才加载
// About.xxx.js — 用户访问 /about 时才加载
```

### 4.5 首屏加载优化清单

当 Vue 项目首屏加载 > 3s 时，排查和优化方向：

```
1. 路由懒加载 — 首屏不需要的页面不打包
2. 组件按需导入 — UI 库按需引入
3. 代码分割 — splitChunks 拆分 vendor
4. CDN 外链 — vue/react 等大库用 CDN
5. Gzip/Brotli — 服务端压缩
6. 图片优化 — WebP 格式 + 懒加载
7. 骨架屏 — 提升感知加载速度
8. SSR/SSG — 服务端渲染首屏 HTML
9. 预加载 — <link rel="preload"> 关键资源
10. Tree-shaking — 确保 sideEffects 配置正确
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Vue 3 如何支持 Tree-shaking？ | 所有 API 是 ES Module 的具名导出，打包工具可以静态分析移除未使用代码 |
| Vue 项目首屏加载 > 3s，你会怎么优化？ | 路由懒加载、组件按需导入、代码分割、CDN、Gzip、图片优化、骨架屏、SSR |
| 路由懒加载的原理？ | import() 返回 Promise，Webpack/Vite 自动代码分割为独立 chunk |
| sideEffects 配置的作用？ | 告诉打包工具哪些文件有副作用不能移除，如 CSS 文件 |

---

## 🔧 手写题（2 道）

### 手写题 1：虚拟滚动组件

```vue
<!-- VirtualList.vue -->
<template>
  <div
    ref="container"
    class="virtual-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll.passive="onScroll"
  >
    <div class="phantom" :style="{ height: totalHeight + 'px' }">
      <div
        class="content"
        :style="{ transform: `translateY(${offset}px)` }"
      >
        <div
          v-for="item in visibleData"
          :key="item.id"
          ref="itemRefs"
          class="item"
        >
          <slot :item="item" :index="item._index">
            {{ item.text }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 50 },
  containerHeight: { type: Number, default: 400 },
  buffer: { type: Number, default: 5 }
})

const container = ref(null)
const itemRefs = ref([])
const scrollTop = ref(0)

// 实际高度缓存（支持不定高）
const heightCache = new Map()

const getItemHeight = (index) => {
  return heightCache.get(index) || props.itemHeight
}

// 1. 总高度
const totalHeight = computed(() => {
  let total = 0
  for (let i = 0; i < props.items.length; i++) {
    total += getItemHeight(i)
  }
  return total
})

// 2. 二分查找起始索引
function findStartIndex(scrollTop) {
  let total = 0
  for (let i = 0; i < props.items.length; i++) {
    total += getItemHeight(i)
    if (total >= scrollTop) return i
  }
  return 0
}

// 3. 起始/结束索引
const startIndex = computed(() => {
  return Math.max(0, findStartIndex(scrollTop.value) - props.buffer)
})

const endIndex = computed(() => {
  let count = 0
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  return Math.min(props.items.length, startIndex.value + visibleCount + props.buffer * 2)
})

// 4. 可见数据
const visibleData = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    ...item,
    _index: startIndex.value + i
  }))
})

// 5. 偏移量
const offset = computed(() => {
  let total = 0
  for (let i = 0; i < startIndex.value; i++) {
    total += getItemHeight(i)
  }
  return total
})

// 6. 滚动处理
function onScroll() {
  scrollTop.value = container.value.scrollTop
}

// 7. 测量真实高度（不定高支持）
onMounted(() => {
  nextTick(() => {
    itemRefs.value?.forEach((el, i) => {
      if (el) {
        heightCache.set(startIndex.value + i, el.offsetHeight)
      }
    })
  })
})

// ====== 测试用例 ======
// const items = Array.from({ length: 10000 }, (_, i) => ({
//   id: i,
//   text: `Item ${i}`
// }))
// <VirtualList :items="items" :item-height="50" :container-height="500">
//   <template #default="{ item }">
//     <div>{{ item.text }}</div>
//   </template>
// </VirtualList>
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  overflow-anchor: none;
}
.phantom {
  position: relative;
}
.content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
.item {
  box-sizing: border-box;
}
</style>
```

### 手写题 2：LRU 缓存（keep-alive 核心）

```js
/**
 * LRU (Least Recently Used) 缓存
 * 用于 keep-alive 的缓存淘汰策略
 */
class LRUCache {
  /**
   * @param {number} capacity - 最大缓存数量
   */
  constructor(capacity) {
    this.capacity = capacity
    this.cache = new Map() // Map 保持插入顺序
  }

  /**
   * 获取缓存值
   * @param {*} key
   * @returns {*} 缓存值，不存在返回 -1
   * 时间复杂度 O(1)
   */
  get(key) {
    if (!this.cache.has(key)) return -1

    // 1. 移除旧位置
    const value = this.cache.get(key)
    this.cache.delete(key)
    // 2. 重新插入到末尾（标记为最近使用）
    this.cache.set(key, value)
    return value
  }

  /**
   * 设置缓存值
   * @param {*} key
   * @param {*} value
   * 时间复杂度 O(1)
   */
  put(key, value) {
    // 1. 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // 2. 插入到末尾
    this.cache.set(key, value)
    // 3. 超出容量，删除最久未使用的（Map 的第一个）
    if (this.cache.size > this.capacity) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 检查是否包含 key
   */
  has(key) {
    return this.cache.has(key)
  }

  /**
   * 删除指定缓存
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear()
  }

  /**
   * 当前缓存数量
   */
  get size() {
    return this.cache.size
  }
}

// ====== 测试用例 ======
const lru = new LRUCache(3)

lru.put('a', 1)
lru.put('b', 2)
lru.put('c', 3)
console.log(lru.get('a')) // 1 — 命中，a 移到末尾

lru.put('d', 4) // 容量已满，淘汰最久未用的 'b'
console.log(lru.has('b')) // false — b 已被淘汰
console.log(lru.get('b')) // -1
console.log(lru.get('c')) // 3
console.log(lru.get('d')) // 4
console.log(lru.size)     // 3

// 模拟 keep-alive 的使用
function createKeepAliveCache(max = 10) {
  const lru = new LRUCache(max)

  return {
    get(key) {
      return lru.get(key)
    },
    set(key, vnode) {
      if (lru.size >= lru.capacity && !lru.has(key)) {
        // 即将淘汰最旧的 → 触发 unmounted
        const oldestKey = lru.cache.keys().next().value
        console.log(`淘汰组件: ${oldestKey}`)
      }
      lru.put(key, vnode)
    },
    has: (key) => lru.has(key),
    delete: (key) => lru.delete(key),
    size: () => lru.size
  }
}

const keepAlive = createKeepAliveCache(2)
keepAlive.set('Home', { component: 'home-vnode' })
keepAlive.set('About', { component: 'about-vnode' })
keepAlive.set('Contact', { component: 'contact-vnode' })
// 输出: 淘汰组件: Home
console.log(keepAlive.has('Home')) // false
```

---

## 💻 算法题

### LeetCode #94 — 二叉树的中序遍历

**思路**：递归最简单；迭代用栈模拟——先压入所有左节点，弹出时访问，再转向右子树。

```js
/**
 * 二叉树中序遍历（左 → 根 → 右）
 * @param {TreeNode} root
 * @return {number[]}
 * 时间复杂度 O(n)，空间复杂度 O(h) h 为树高
 */

// 方法 1：递归
function inorderTraversal(root) {
  const result = []
  function dfs(node) {
    if (!node) return
    dfs(node.left)
    result.push(node.val)
    dfs(node.right)
  }
  dfs(root)
  return result
}

// 方法 2：迭代（栈模拟）
function inorderTraversalIterative(root) {
  const result = []
  const stack = []
  let curr = root

  while (curr || stack.length) {
    // 1. 先把所有左节点压栈
    while (curr) {
      stack.push(curr)
      curr = curr.left
    }
    // 2. 弹出栈顶（最左节点）并访问
    curr = stack.pop()
    result.push(curr.val)
    // 3. 转向右子树
    curr = curr.right
  }

  return result
}

// 测试：    1
//          / \
//         2   3
//        / \
//       4   5
// 中序遍历: [4, 2, 5, 1, 3]
```

### LeetCode #104 — 二叉树的最大深度

```js
/**
 * 二叉树的最大深度
 * @param {TreeNode} root
 * @return {number}
 * 时间复杂度 O(n)，空间复杂度 O(h)
 */
function maxDepth(root) {
  if (!root) return 0
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1
}

// BFS 解法
function maxDepthBFS(root) {
  if (!root) return 0
  const queue = [root]
  let depth = 0

  while (queue.length) {
    const size = queue.length
    for (let i = 0; i < size; i++) {
      const node = queue.shift()
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
    depth++
  }

  return depth
}

// 测试
// maxDepth([3,9,20,null,null,15,7]) → 3
```

### LeetCode #226 — 翻转二叉树

```js
/**
 * 翻转二叉树 — 递归交换左右子树
 * @param {TreeNode} root
 * @return {TreeNode}
 * 时间复杂度 O(n)，空间复杂度 O(h)
 */
function invertTree(root) {
  if (!root) return null

  // 交换左右子树
  const temp = root.left
  root.left = root.right
  root.right = temp

  // 递归翻转子树
  invertTree(root.left)
  invertTree(root.right)

  return root
}

// 迭代解法（BFS）
function invertTreeBFS(root) {
  if (!root) return null
  const queue = [root]

  while (queue.length) {
    const node = queue.shift()
    // 交换
    [node.left, node.right] = [node.right, node.left]

    if (node.left) queue.push(node.left)
    if (node.right) queue.push(node.right)
  }

  return root
}
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| v-once | 一次性渲染，标记为静态节点 | ⭐⭐⭐ |
| v-memo | 依赖数组不变则跳过更新，适合大列表优化 | ⭐⭐⭐⭐ |
| 虚拟滚动原理 | 只渲染可视区域 DOM + 缓冲区，占位 div 撑开滚动条 | ⭐⭐⭐⭐⭐ |
| keep-alive | LRU 缓存策略，include/exclude 白黑名单，max 限制 | ⭐⭐⭐⭐⭐ |
| Tree-shaking | ES Module 具名导出，打包工具静态分析移除未使用代码 | ⭐⭐⭐⭐ |
| 首屏优化 | 懒加载 + 按需导入 + 代码分割 + CDN + 压缩 + 骨架屏 | ⭐⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 12）

明天学习 **SSR 与 Nuxt 3**：理解 SSR 水合过程、SSR vs SSG vs ISR 区别、Nuxt 3 核心功能。SSR 是中高级前端的必备知识 🚀
