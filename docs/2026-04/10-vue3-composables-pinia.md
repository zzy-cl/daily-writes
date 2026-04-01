# 04/10 — Composition API + Pinia（Day 10）

> **阶段**：第二阶段 Vue 3
> **今日目标**：掌握 Composition API 核心用法、Composables 封装模式、Pinia 状态管理
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：setup 语法糖与 Composition API ⭐

### 1.1 `<script setup>` — 语法糖

`<script setup>` 是编译时语法糖，所有顶层绑定自动暴露给模板：

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

// 顶层变量/函数自动暴露给模板
const count = ref(0)
const double = computed(() => count.value * 2)

function increment() {
  count.value++
}

onMounted(() => {
  console.log('组件挂载')
})
</script>

<template>
  <button @click="increment">{{ count }} x2 = {{ double }}</button>
</template>
```

⚠️ **`<script setup>` 的限制**：

```vue
<!-- ❌ 不能使用 defineComponent + setup 函数返回 -->
<script>
export default {
  setup() {
    // 这种写法与 <script setup> 不兼容
  }
}
</script>

<!-- ✅ 普通 <script> 和 <script setup> 可以共存 -->
<script>
// 用于定义 inheritAttrs、name 等选项
export default {
  name: 'MyComponent',
  inheritAttrs: false
}
</script>
<script setup>
const msg = ref('hello')
</script>
```

### 1.2 组件通信 API

```vue
<script setup>
// ========== Props ==========
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 }
})
console.log(props.title) // 响应式代理，可直接使用

// ========== Emits ==========
const emit = defineEmits(['update', 'submit'])
emit('update', { id: 1 })

// ========== defineProps 的 TS 写法 ⭐ ==========
// interface Props { title: string; count?: number }
// const props = defineProps<Props>()

// ========== Expose ==========
defineExpose({
  publicMethod: () => console.log('父组件可调用')
})

// ========== Slots / Attrs ==========
// import { useSlots, useAttrs } from 'vue'
// const slots = useSlots()
// const attrs = useAttrs()
</script>
```

### 1.3 生命周期钩子对比

| Options API | Composition API | 说明 |
|------------|----------------|------|
| beforeCreate | ❌ 不需要 | setup() 本身替代 |
| created | ❌ 不需要 | setup() 本身替代 |
| beforeMount | onBeforeMount | |
| mounted | onMounted | |
| beforeUpdate | onBeforeUpdate | |
| updated | onUpdated | |
| beforeUnmount | onBeforeUnmount | |
| unmounted | onUnmounted | |
| activated | onActivated | keep-alive |
| deactivated | onDeactivated | keep-alive |
| errorCaptured | onErrorCaptured | |

⚠️ **易错点**：Composition API 钩子必须在 `setup()` 顶层同步调用，不能放在回调或条件中：

```js
// ❌ 错误 — 放在异步回调中
async function fetchData() {
  const data = await api.get()
  onMounted(() => { // 报错：不在 setup 顶层
    console.log(data)
  })
}

// ✅ 正确
onMounted(async () => {
  const data = await api.get()
  console.log(data)
})
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| `<script setup>` 的优势？ | 更少样板代码，自动暴露顶层绑定，更好的 TS 推断，更好的运行时性能 |
| Composition API 解决了 Options API 什么问题？ | Options API 逻辑按类型(data/methods)分散，Composition API 按逻辑功能组织，便于复用和类型推断 |
| `<script setup>` 中 defineProps/defineEmits 为什么不用 import？ | 编译器宏，编译时处理，不需要运行时引入 |
| Props 为什么不能解构？ | 解构会丢失响应式，需用 `toRefs(props)` 或 `computed` |

---

## 知识点 2：Composables 封装模式 vs Mixins ⭐

### 2.1 Composables — 函数式逻辑复用

Composables 是 Vue 3 推荐的逻辑复用方式，本质是一个使用 Composition API 的函数：

```js
// composables/useCounter.js
import { ref, computed } from 'vue'

/**
 * 计数器 composable
 * @param {number} initialValue - 初始值
 * @returns {{ count, double, increment, decrement, reset }}
 */
export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const double = computed(() => count.value * 2)

  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset() { count.value = initialValue }

  return { count, double, increment, decrement, reset }
}
```

```vue
<script setup>
import { useCounter } from '@/composables/useCounter'

const { count, double, increment } = useCounter(10)
</script>
```

### 2.2 Composables vs Mixins 对比

| 特性 | Mixins (Vue 2) | Composables (Vue 3) |
|------|---------------|-------------------|
| 命名冲突 | ❌ 容易冲突，没有命名空间 | ✅ 返回值可重命名 |
| 数据来源 | ❌ 不清楚来自哪个 mixin | ✅ 返回值明确来源 |
| 多实例 | ❌ 数据共享（有副作用） | ✅ 每次调用创建独立实例 |
| TS 支持 | ❌ 差 | ✅ 优秀 |
| 逻辑组织 | ❌ 按类型分散（data/methods） | ✅ 按功能内聚 |
| 嵌套复用 | ❌ 困难 | ✅ 可以调用其他 composable |

```js
// ❌ Mixin — 命名冲突、来源不清
// mixinA.js
export default {
  data() { return { count: 0 } },
  methods: { increment() {} }
}
// mixinB.js
export default {
  data() { return { count: 0 } }, // 冲突！
  methods: { increment() {} }     // 冲突！
}

// ✅ Composable — 来源清晰，无冲突
const { count: countA, increment: incA } = useCounter()
const { count: countB, increment: incB } = useCounter()
```

### 2.3 实战：封装 useRequest ⭐

```js
// composables/useRequest.js
import { ref, shallowRef, onUnmounted } from 'vue'

/**
 * 通用请求 composable
 * @param {Function} fetcher - 请求函数，返回 Promise
 * @param {Object} options - { immediate, onSuccess, onError }
 * @returns {{ data, loading, error, execute }
 */
export function useRequest(fetcher, options = {}) {
  const { immediate = true, onSuccess, onError } = options

  const data = shallowRef(null)  // ⚠️ 用 shallowRef 避免深层响应式开销
  const loading = ref(false)
  const error = ref(null)

  let abortController = null

  async function execute(...args) {
    // 取消上一次请求
    abortController?.abort()
    abortController = new AbortController()

    loading.value = true
    error.value = null

    try {
      const result = await fetcher(...args, {
        signal: abortController.signal
      })
      data.value = result
      onSuccess?.(result)
      return result
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err
        onError?.(err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // 组件卸载时取消请求
  onUnmounted(() => {
    abortController?.abort()
  })

  if (immediate) {
    execute()
  }

  return { data, loading, error, execute }
}
```

使用示例：

```vue
<script setup>
import { useRequest } from '@/composables/useRequest'

const { data: users, loading, error, execute: refetch } = useRequest(
  () => fetch('/api/users').then(r => r.json()),
  {
    immediate: true,
    onSuccess(data) {
      console.log('加载成功:', data.length, '个用户')
    }
  }
)
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">错误: {{ error.message }}</div>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
  <button @click="refetch">刷新</button>
</template>
```

### 2.4 Composable 最佳实践

```js
// ✅ 命名约定：use 前缀
export function useMouse() { /* ... */ }
export function useDebounce() { /* ... */ }

// ✅ 组合其他 composable
export function useSearch() {
  const { data, loading, error, execute } = useRequest(/* ... */)
  const debouncedExecute = useDebounce(execute, 300)
  return { data, loading, error, search: debouncedExecute }
}

// ⚠️ 避免在 composable 中使用 onMounted 等钩子
// 如果必须用，文档说明只能在 setup 中调用

// ✅ 接受 ref 作为参数，保持响应式
export function useTitle(newTitle) {
  // 如果传入 ref，watch 可以正确追踪
  watch(newTitle, (val) => {
    document.title = val
  })
}
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Composition API 解决了 Options API 的什么问题？ | 逻辑按功能组织而非按类型组织，解决了代码碎片化和复用困难 |
| Composables 和 Mixins 的优劣对比？ | Composables 命名空间清晰、TS 友好、多实例独立；Mixins 命名冲突、来源不清 |
| useRequest 中为什么用 shallowRef？ | API 返回数据通常是新对象，shallowRef 只追踪引用变化，减少不必要的深层代理开销 |
| 如何让 Composable 只在 setup 中使用？ | 依赖 `onUnmounted` 等钩子，不在 setup 中调用会报错 |

---

## 知识点 3：Pinia 状态管理 ⭐

### 3.1 Pinia vs Vuex 对比

| 特性 | Vuex 4 (Vue 3) | Pinia |
|------|----------------|-------|
| API 设计 | mutations + actions + getters | 只有 state + actions + getters |
| TS 支持 | ❌ 需要额外类型声明 | ✅ 完整类型推断 |
| DevTools | ✅ | ✅ |
| 模块化 | 嵌套模块 + 命名空间 | 扁平化，每个 store 独立 |
| 代码分割 | 需要手动配置 | 自动支持 |
| 体积 | ~3kb | ~1kb |
| 可组合性 | ❌ | ✅ store 之间可互相调用 |
| SSR 支持 | ✅ | ✅ |

```js
// ❌ Vuex — 需要 mutations，代码冗长
const store = createStore({
  state() { return { count: 0 } },
  mutations: {
    INCREMENT(state) { state.count++ },
    SET_COUNT(state, value) { state.count = value }
  },
  actions: {
    increment({ commit }) { commit('INCREMENT') },
    async fetchCount({ commit }) {
      const res = await api.getCount()
      commit('SET_COUNT', res.data)
    }
  },
  getters: {
    double: (state) => state.count * 2
  }
})

// ✅ Pinia — 简洁直观
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() { this.count++ }, // 直接修改！
    async fetchCount() {
      this.count = await api.getCount()
    }
  }
})

// ✅ Pinia Setup 写法（推荐，更像 Composable）
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})
```

### 3.2 Pinia 核心用法

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

// 直接访问 state
console.log(counter.count) // 0

// 直接修改 state — 不需要 mutations！
counter.count++

// 调用 action
counter.increment()

// 使用 getter
console.log(counter.double) // 2

// ⚠️ 解构会丢失响应式
// const { count, double } = counter // ❌

// ✅ 用 storeToRefs 保持响应式
import { storeToRefs } from 'pinia'
const { count, double } = storeToRefs(counter)
```

### 3.3 storeToRefs 原理 ⭐

`storeToRefs` 将 store 中的每个 state 和 getter 转为 ref，保持响应式：

```js
// storeToRefs 源码（简化）
export function storeToRefs(store) {
  const refs = {}
  const rawStore = toRaw(store) // 获取原始对象

  for (const key in rawStore) {
    const value = rawStore[key]
    if (isRef(value) || isReactive(value)) {
      // state → 用 toRef 保持引用
      // getter（computed）→ 直接赋值
      refs[key] = toRef(store, key)
    }
  }

  return refs
}
```

```js
// 为什么不直接 toRefs？
// toRefs 要求参数是 reactive 对象
// Pinia store 本质是 reactive 包装，但内部结构不同
// storeToRefs 专门处理 Pinia 的 getter（computed）属性

const store = useCounterStore()
const { count, double } = storeToRefs(store)
// count 是 ref → count.value 可读写
// double 是 computed ref → double.value 只读
```

### 3.4 Store 间互相调用

```js
// stores/user.js
export const useUserStore = defineStore('user', {
  state: () => ({ name: 'penny', role: 'admin' })
})

// stores/permission.js
import { useUserStore } from './user'

export const usePermissionStore = defineStore('permission', {
  getters: {
    canDelete() {
      const user = useUserStore() // 直接调用其他 store
      return user.role === 'admin'
    }
  }
})
```

### 3.5 Pinia 插件

```js
// 简易持久化插件
const persistPlugin = ({ store }) => {
  const saved = localStorage.getItem(store.$id)
  if (saved) {
    store.$patch(JSON.parse(saved))
  }

  store.$subscribe((mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

// 使用
const pinia = createPinia()
pinia.use(persistPlugin)
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Pinia 为什么比 Vuex 更适合 Vue 3？ | 去掉 mutations 简化 API、完美 TS 支持、扁平化模块设计、更小体积 |
| Pinia 可以直接修改 state，为什么不需要 mutations？ | Pinia 可以追踪所有 state 变化（DevTools 用 `$subscribe`），mutations 不再必要 |
| storeToRefs 做了什么？ | 将 store 的 state 和 getter 转为 ref，解构后保持响应式 |
| Pinia 的 Setup 写法和 Options 写法怎么选？ | Setup 写法更灵活（可使用任意 Composable），推荐新项目使用 |

---

## 🔧 手写题（2 道）

### 手写题 1：简易 Pinia

```js
/**
 * 手写简易版 Pinia — 支持 state/getters/actions
 * 支持 $subscribe、$patch、$reset
 */
import { ref, computed, reactive, watch, toRaw } from 'vue'

// 1. 全局 store 注册表
const stores = new Map()

/**
 * 创建 Pinia 实例
 */
function createPinia() {
  return {
    install(app) {
      app.config.globalProperties.$pinia = this
      app.provide('pinia', this)
    }
  }
}

/**
 * 定义 store
 * @param {string} id - store 唯一标识
 * @param {Object|Function} setup - Options 对象或 Setup 函数
 * @returns {Function} - 获取 store 的函数
 */
function defineStore(id, setup) {
  return () => {
    // 2. 如果已存在，直接返回（单例）
    if (stores.has(id)) {
      return stores.get(id)
    }

    const store = {}

    if (typeof setup === 'function') {
      // Setup 写法
      const setupResult = setup()

      // 3. 将 setup 返回值挂载到 store
      for (const key in setupResult) {
        store[key] = setupResult[key]
      }
    } else {
      // Options 写法
      const { state, getters = {}, actions = {} } = setup

      // 4. 创建 state — 用 reactive 包装
      const rawState = state()
      const reactiveState = reactive({ ...rawState })

      // 5. 将 state 属性代理到 store
      for (const key in rawState) {
        Object.defineProperty(store, key, {
          get: () => reactiveState[key],
          set: (val) => { reactiveState[key] = val }
        })
      }

      // 6. 创建 getters — 用 computed 包装
      for (const key in getters) {
        const getter = computed(() => getters[key].call(store, reactiveState))
        Object.defineProperty(store, key, {
          get: () => getter.value
        })
      }

      // 7. 绑定 actions
      for (const key in actions) {
        store[key] = actions[key].bind(store)
      }

      // 8. $patch — 批量更新
      store.$patch = (partial) => {
        if (typeof partial === 'function') {
          partial(reactiveState)
        } else {
          Object.assign(reactiveState, partial)
        }
      }

      // 9. $reset — 重置 state（仅 Options 写法）
      store.$reset = () => {
        const fresh = state()
        for (const key in fresh) {
          reactiveState[key] = fresh[key]
        }
      }

      // 10. $subscribe — 监听 state 变化
      store.$subscribe = (callback) => {
        return watch(reactiveState, (newState) => {
          callback({ type: 'direct' }, toRaw(newState))
        }, { deep: true })
      }

      // 11. $state — 获取/设置全部 state
      Object.defineProperty(store, '$state', {
        get: () => reactiveState,
        set: (val) => { Object.assign(reactiveState, val) }
      })
    }

    store.$id = id
    stores.set(id, store)
    return store
  }
}

// ====== 测试用例 ======
console.log('===== 测试 Options 写法 =====')
const useCounter = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() { this.count++ },
    asyncFetch() {
      setTimeout(() => { this.count = 100 }, 10)
    }
  }
})

const counter = useCounter()
console.log(counter.count)   // 0
console.log(counter.double)  // 0

counter.increment()
console.log(counter.count)   // 1
console.log(counter.double)  // 2

// 测试 $patch
counter.$patch({ count: 50 })
console.log(counter.count)   // 50

// 测试 $patch 函数形式
counter.$patch((state) => { state.count = 75 })
console.log(counter.count)   // 75

// 测试 $reset
counter.$reset()
console.log(counter.count)   // 0

// 测试 $subscribe
const unwatch = counter.$subscribe((mutation, state) => {
  console.log('state 变化:', state.count)
})
counter.count = 42 // 输出: state 变化: 42
unwatch()

// 测试单例
const counter2 = useCounter()
console.log(counter === counter2) // true

console.log('===== 测试 Setup 写法 =====')
const useSetup = defineStore('setup', () => {
  const name = ref('penny')
  const greeting = computed(() => `hi ${name.value}`)
  function setName(val) { name.value = val }
  return { name, greeting, setName }
})

const setupStore = useSetup()
console.log(setupStore.greeting) // hi penny
setupStore.setName('nova')
console.log(setupStore.greeting) // hi nova
```

### 手写题 2：storeToRefs

```js
/**
 * 将 store 的 state 和 getter 转为 ref
 * @param {Object} store - Pinia store 实例
 * @returns {Object} - 每个属性都是 ref
 */
import { toRef, isRef, isReactive, toRaw } from 'vue'

function storeToRefs(store) {
  const result = {}
  const rawStore = toRaw(store)

  for (const key in rawStore) {
    const value = rawStore[key]
    // 只处理 state（ref/reactive）和 getter（computed 也是 ref）
    if (isRef(value)) {
      result[key] = toRef(store, key)
    } else if (isReactive(value)) {
      result[key] = toRef(store, key)
    }
    // 跳过函数（actions）
  }

  return result
}

// ====== 测试用例 ======
const useTestStore = defineStore('test', {
  state: () => ({ count: 0, items: [] }),
  getters: {
    total: (state) => state.items.length,
    double: (state) => state.count * 2
  },
  actions: {
    increment() { this.count++ }
  }
})

const store = useTestStore()
const { count, total, double, increment } = storeToRefs(store)

// count 是 ref
console.log(count.value)   // 0
count.value = 5
console.log(store.count)   // 5 — 双向同步

// double 是 computed ref
console.log(double.value)  // 10

// increment 不在 storeToRefs 结果中 — actions 被跳过
console.log(increment)     // undefined
```

---

## 💻 算法题

### LeetCode #20 — 有效的括号

**思路**：用栈模拟。遇到左括号入栈，遇到右括号检查栈顶是否匹配。

```js
/**
 * 有效的括号
 * @param {string} s
 * @return {boolean}
 * 时间复杂度 O(n)，空间复杂度 O(n)
 */
function isValid(s) {
  const stack = []
  const map = { ')': '(', ']': '[', '}': '{' }

  for (const ch of s) {
    if (!map[ch]) {
      // 左括号 → 入栈
      stack.push(ch)
    } else {
      // 右括号 → 检查栈顶
      if (stack.pop() !== map[ch]) return false
    }
  }

  return stack.length === 0
}

// 测试
console.log(isValid('()[]{}')) // true
console.log(isValid('(]'))     // false
console.log(isValid('([)]'))   // false
console.log(isValid('{[]}'))   // true
```

### LeetCode #155 — 最小栈

**思路**：辅助栈同步记录当前最小值。

```js
/**
 * 最小栈 — 支持 O(1) 获取最小值
 * 时间复杂度 O(1) 所有操作，空间复杂度 O(n)
 */
class MinStack {
  constructor() {
    this.stack = []
    this.minStack = [] // 辅助栈，栈顶始终是当前最小值
  }

  push(val) {
    this.stack.push(val)
    // 辅助栈压入当前最小值
    const min = this.minStack.length === 0
      ? val
      : Math.min(val, this.minStack[this.minStack.length - 1])
    this.minStack.push(min)
  }

  pop() {
    this.stack.pop()
    this.minStack.pop()
  }

  top() {
    return this.stack[this.stack.length - 1]
  }

  getMin() {
    return this.minStack[this.minStack.length - 1]
  }
}

// 测试
const ms = new MinStack()
ms.push(-2); ms.push(0); ms.push(-3)
console.log(ms.getMin()) // -3
ms.pop()
console.log(ms.top())    // 0
console.log(ms.getMin()) // -2
```

### LeetCode #394 — 字符串解码

**思路**：用两个栈分别存储数字和字符串，遇到 `[` 入栈，遇到 `]` 出栈拼接。

```js
/**
 * 字符串解码 — "3[a2[c]]" → "accaccacc"
 * @param {string} s
 * @return {string}
 * 时间复杂度 O(n)，空间复杂度 O(n)
 */
function decodeString(s) {
  const numStack = []  // 数字栈
  const strStack = []  // 字符串栈
  let num = 0
  let str = ''

  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      num = num * 10 + parseInt(ch)
    } else if (ch === '[') {
      numStack.push(num)
      strStack.push(str)
      num = 0
      str = ''
    } else if (ch === ']') {
      const repeat = numStack.pop()
      str = strStack.pop() + str.repeat(repeat)
    } else {
      str += ch
    }
  }

  return str
}

// 测试
console.log(decodeString('3[a2[c]]'))     // "accaccacc"
console.log(decodeString('2[abc]3[cd]ef')) // "abcabccdcdcdef"
console.log(decodeString('abc3[cd]xyz'))   // "abccdcdcdxyz"
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| `<script setup>` | 编译时语法糖，顶层绑定自动暴露 | ⭐⭐⭐⭐⭐ |
| Composition API | 按逻辑功能组织代码，替代 Options API 按类型组织 | ⭐⭐⭐⭐⭐ |
| Composables vs Mixins | Composables 命名空间清晰、TS 友好、多实例独立 | ⭐⭐⭐⭐⭐ |
| Pinia | 去掉 mutations、完美 TS、扁平模块、store 间可互相调用 | ⭐⭐⭐⭐⭐ |
| storeToRefs | 将 store 的 state/getter 转为 ref 保持响应式 | ⭐⭐⭐⭐ |
| useRequest 封装 | shallowRef + AbortController + onUnmounted 清理 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 11）

明天学习 **Vue 3 性能优化**：v-once/v-memo、虚拟滚动原理与实现、keep-alive 缓存机制、Tree-shaking 实践。优化相关题目在面试中非常常见 🎯
