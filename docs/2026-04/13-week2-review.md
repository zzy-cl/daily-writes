# 04/13 — 第二周复盘 + Vue 项目实战（Day 13）

> **阶段**：第二阶段 Vue 3 深度精通
> **今日目标**：系统复盘 Day 8-12 知识链，掌握面试高频回答框架
> **投入时间**：上午 1.5h / 下午 1.5h（轻量复习日）

---

## 🔑 知识点 1：Vue 3 全部知识点串讲

> 把第二周的 5 天内容串成一条完整的技术栈链条，每个模块一句话总结 + 面试高频追问。

### 知识链全景图

```
响应式原理(Proxy) → 编译优化(patchFlag/hoist) → Composition API(setup/ref/reactive)
    → 状态管理(Pinia) → 性能优化(懒加载/keep-alive) → SSR(Nuxt 3)
```

### 各模块精要 + 面试追问

| 日期 | 模块 | 一句话总结 | ⭐ 面试高频追问 |
|------|------|-----------|---------------|
| Day 8 | 响应式原理 | Vue 3 用 Proxy 代替 defineProperty，支持数组/新增属性/Map/Set | Proxy vs defineProperty 区别？为什么不需要 Vue.set？ |
| Day 8 | ref vs reactive | ref 包装基本类型需 .value，reactive 包装对象自动解包 | 什么时候用 ref？什么时候用 reactive？toRefs 的作用？ |
| Day 9 | 编译优化 | patchFlag 标记动态节点，hoistStatic 提升静态树，Block Tree 减少 Diff | Vue 3 Diff 和 Vue 2 有什么不同？什么是 Block Tree？ |
| Day 9 | setup 语法糖 | setup() 是 Composition API 入口，\<script setup\> 是语法糖 | setup() 中 this 是什么？怎么 emit/expose？ |
| Day 10 | Composition API | computed/watch/watchEffect 三大副作用工具；生命周期用 onXxx | watch vs watchEffect 区别？什么时候会死循环？ |
| Day 10 | 自定义 Composable | 把逻辑抽象为 useXxx 函数，返回响应式数据和方法 | 封装 Composable 最佳实践？和 Mixin 区别？ |
| Day 10 | 手写响应式 API | ref/computed/watch 底层基于 track/trigger 的响应式调度 | 能手写一个简化版 computed 吗？watch 的回调调度机制？ |
| Day 11 | Pinia 状态管理 | Vue 官方推荐，天然 TS 支持，setup 风格 | Pinia vs Vuex 区别？怎么做持久化？ |
| Day 11 | 插件系统 | app.use(plugin) 注册全局插件 | 自定义插件结构？store.$subscribe 有什么用？ |
| Day 12 | 性能优化 | 路由懒加载、defineAsyncComponent、虚拟滚动、v-once/v-memo | 首屏加载慢怎么排查和优化？ |
| Day 12 | SSR + Nuxt 3 | 服务端渲染提升首屏和 SEO，Nuxt 3 提供全栈框架 | SSR 水合(hydration)是什么？什么时候不该用 SSR？ |

### 🔑 串联记忆口述模板

> 面试时被问到"Vue 3 学得怎么样"，可以这样串：
>
> 1. **原理层**：Vue 3 用 Proxy 实现响应式，配合编译时 patchFlag + hoistStatic 做 Diff 优化
> 2. **API 层**：Composition API（ref/reactive/computed/watch）让逻辑复用更灵活
> 3. **状态层**：Pinia 取代 Vuex，天然 TS 支持，setup 风格更统一
> 4. **性能层**：路由/组件懒加载 + 虚拟滚动 + v-once/v-memo 减少渲染开销
> 5. **架构层**：Nuxt 3 做 SSR，解决首屏和 SEO 问题

---

## 🔑 知识点 2：面试高频问题答题框架

### Q1："Vue 3 相比 Vue 2 有哪些改进？"（满分模板）

> Vue 3 的改进可以从五个维度来说：
>
> 1. **响应式系统重写**：Proxy 代替 defineProperty，不再需要 Vue.set/Vue.delete
> 2. **Composition API**：按功能逻辑组织代码，Composable 函数替代 Mixin
> 3. **编译优化**：Patch Flag + Hoist Static + Block Tree，Diff 只比较标记位
> 4. **Tree-shaking**：按需引入 API，核心仅 ~10KB（gzip）
> 5. **生态升级**：Pinia 替代 Vuex，Vite 替代 vue-cli，Nuxt 3 全栈框架

### Q2："你在项目中怎么用 Vue 3 的？"（STAR 法则）

```
S（场景）：在 [项目名] 中，需要开发 [业务场景]，用户量约 [数字]
T（任务）：负责 [具体模块]，需要解决 [具体问题]
A（行动）：用 Composition API 封装 Composable / 用 Pinia 管理状态 / 路由懒加载
R（结果）：首屏 LCP 从 Xs 降到 Ys / 代码复用率提升 Z%
```

⚠️ **易错**：STAR 法则一定要有**具体数字**。

### Q3："Vue vs React 怎么选？"（中立模板）

| 维度 | Vue | React | 选择建议 |
|------|-----|-------|---------|
| 学习曲线 | ✅ 渐进式，中文文档好 | ❌ JSX + Hooks 概念多 | 小团队 → Vue |
| 生态规模 | 中等 | 最大 | 需要丰富生态 → React |
| TypeScript | ✅ 天然 TS | ✅ TS 成熟 | 两者相当 |
| 性能 | Proxy + 编译优化 | Virtual DOM + Fiber | 差距不大 |
| 状态管理 | Pinia（官方推荐） | Redux/Zustand/Jotai（社区多选） | 统一方案 → Vue |
| 模板/语法 | SFC 模板 + `<script setup>` | JSX（JS 内写 HTML） | 偏好声明式 → Vue |
| 响应式 | Proxy 自动追踪依赖 | 手动 `useState`/`useEffect` | 减少心智负担 → Vue |
| SSR | Nuxt 3 | Next.js | 生态成熟度 → React 略优 |
| 移动端 | uni-app / NativeScript | React Native（成熟） | 跨端 → React |

### Hooks vs Composables 详细对比

| 对比项 | React Hooks | Vue Composables |
|--------|------------|-----------------|
| 响应式机制 | 手动声明依赖数组 `deps` | Proxy 自动追踪，无需声明 |
| 调用顺序 | ⚠️ 不能在条件/循环中调用 | ✅ 无顺序限制，随便用 |
| 副作用 | `useEffect` 处理一切副作用 | `watch`/`watchEffect` 各司其职 |
| 状态定义 | `useState` 返回 `[state, setState]` | `ref()` / `reactive()` 直接操作 `.value` |
| 计算属性 | `useMemo` 手动声明依赖 | `computed` 自动追踪 |
| 生命周期 | `useEffect(fn, [])` 模拟 mounted | `onMounted` 直接调用 |
| 可复用逻辑 | 自定义 Hook（useXxx） | 自定义 Composable（useXxx） |
| SSR 风险 | Hooks 在 SSR 中有限制 | Composable 在 SSR 中正常工作 |
| 心智模型 | 函数式（每次渲染重新执行） | 响应式（值变化触发更新） |

❌ **常见误区**：
- "Vue 3 抄袭 React Hooks" → 实际上 Vue Composables 基于响应式系统，和 Hooks 底层机制完全不同
- "React 更流行所以更好" → 流行度 ≠ 适用性，看团队和项目需求
- "Vue 不能做大型项目" → 阿里、字节都有大量 Vue 项目

✅ **正确理解**：
- Vue Composables 不需要 `useEffect` 那样的依赖数组，因为 Proxy 自动追踪
- React Hooks 的闭包陷阱（stale closure）在 Vue 中不存在
- 两者都有各自的适用场景，没有绝对优劣

> 面试回答要点：从**团队能力**、**项目需求**、**长期维护**三个维度考虑。

---

## 🔑 知识点 3：Vue 常见面试场景题

### 场景 1：首屏加载慢怎么优化？

| 优先级 | 优化手段 | 实现方式 | 预期效果 |
|--------|---------|---------|---------|
| 🔴 高 | 路由懒加载 | `() => import('./Page.vue')` | 首屏 JS 减少 50%+ |
| 🔴 高 | Gzip/Brotli | `vite-plugin-compression` | 体积减少 70% |
| 🔴 高 | CDN 引入公共库 | `build.rollupOptions.external` | 主包减少 200KB+ |
| 🟡 中 | 组件异步加载 | `defineAsyncComponent` | 按需加载非关键组件 |
| 🟡 中 | 图片懒加载 | `IntersectionObserver` | 首屏请求数减少 |
| 🟢 低 | 虚拟滚动 | `@tanstack/vue-virtual` | 大列表性能提升 10x |

### 场景 2：组件间通信方案对比

| 方案 | 适用场景 | 推荐指数 |
|------|---------|---------|
| `props` / `emit` | 父子组件 | ⭐⭐⭐⭐⭐ |
| `v-model` | 表单组件双向绑定 | ⭐⭐⭐⭐⭐ |
| `provide` / `inject` | 深层嵌套 | ⭐⭐⭐⭐ |
| Pinia Store | 全局/跨组件状态 | ⭐⭐⭐⭐ |
| `mitt` / `emitter` | 兄弟/跨层级事件 | ⭐⭐⭐ |

⚠️ **易错提示**：
- `provide`/`inject` 不是响应式的（除非传 `ref` 或 `reactive` 对象）
- `$emit` 在 `<script setup>` 中需要 `defineEmits` 声明
- 兄弟组件通信不要用 `$parent`/`$children`（Vue 3 已移除 `$children`）
- Pinia 中直接解构会丢失响应式，必须用 `storeToRefs()`

### 场景 3：怎么设计一个表单生成器？（JSON Schema 驱动）

> 业务背景：后台管理系统中，不同模块的表单结构不同，但渲染逻辑重复。需要一套通用的表单生成方案。

**核心思路：JSON Schema → 动态组件渲染**

```javascript
// 1. 定义 Schema（JSON 格式描述表单结构）
const formSchema = [
  { field: 'name', label: '姓名', type: 'input', rules: [{ required: true, message: '请输入姓名' }] },
  { field: 'age', label: '年龄', type: 'number', min: 0, max: 120 },
  { field: 'gender', label: '性别', type: 'select', options: [{ label: '男', value: 1 }, { label: '女', value: 2 }] },
  { field: 'avatar', label: '头像', type: 'upload', accept: 'image/*' },
  { field: 'bio', label: '简介', type: 'textarea', maxlength: 200 }
]

// 2. 封装 FormGenerator 组件
// FormGenerator.vue
const props = defineProps({
  schema: { type: Array, required: true },
  modelValue: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue', 'submit'])

// 3. 组件映射表
const componentMap = {
  input: 'ElInput',
  number: 'ElInputNumber',
  select: 'ElSelect',
  upload: 'ElUpload',
  textarea: 'ElInput',
  date: 'ElDatePicker',
  switch: 'ElSwitch',
  radio: 'ElRadioGroup'
}
```

**模板部分：**

```vue
<template>
  <el-form :model="formData" v-bind="$attrs">
    <el-form-item
      v-for="item in schema"
      :key="item.field"
      :label="item.label"
      :prop="item.field"
      :rules="item.rules"
    >
      <component
        :is="componentMap[item.type]"
        v-model="formData[item.field]"
        v-bind="getComponentProps(item)"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </el-form-item>
  </el-form>
</template>
```

**设计要点：**

| 设计点 | 方案 | 说明 |
|--------|------|------|
| 数据绑定 | `v-model` 双向绑定整个表单 | 用 `update:modelValue` 实现 |
| 校验规则 | Schema 中内联 rules | 支持自定义 validator |
| 条件渲染 | Schema 增加 `visible` 字段 | 支持 `v-if` 动态显示/隐藏 |
| 联动逻辑 | Composable `useFormLinkage` | 监听字段变化，联动修改其他字段 |
| 自定义组件 | componentMap 支持注册自定义组件 | 扩展性好 |

**进阶：表单联动 Composable：**

```javascript
// useFormLinkage.js
export function useFormLinkage(schema, formData) {
  // 监听某个字段变化，联动修改其他字段
  function watchField(field, callback) {
    watch(() => formData.value[field], (newVal, oldVal) => {
      callback(newVal, formData.value)
    })
  }
  
  // 示例：选择"其他"时，显示自定义输入框
  watchField('gender', (val, data) => {
    if (val === 'other') {
      schema.value.find(s => s.field === 'customGender').visible = true
    }
  })
  
  return { watchField }
}
```

❌ **常见误区**：
- ❌ 直接用 `v-for` 渲染但不绑定 `key`，导致输入框状态错乱
- ❌ Schema 定义在组件内部，失去动态能力
- ❌ 忘记用 `computed` 包裹 schema，导致响应式丢失

✅ **正确做法**：
- ✅ Schema 通过 props 传入，支持外部动态配置
- ✅ 用 `component :is` 动态渲染组件
- ✅ 校验规则在 Schema 中声明，与组件解耦

### 面试 Q&A 汇总

| # | 面试题 | 频率 |
|---|--------|------|
| 1 | Vue 3 相比 Vue 2 有哪些改进？ | ⭐⭐⭐⭐⭐ |
| 2 | ref 和 reactive 区别？ | ⭐⭐⭐⭐⭐ |
| 3 | watch vs watchEffect？ | ⭐⭐⭐⭐ |
| 4 | Pinia vs Vuex？ | ⭐⭐⭐⭐⭐ |
| 5 | Vue 3 编译优化有哪些？ | ⭐⭐⭐⭐ |
| 6 | 首屏加载慢怎么优化？ | ⭐⭐⭐⭐⭐ |
| 7 | SSR 的优缺点？ | ⭐⭐⭐⭐ |
| 8 | Composable vs Mixin？ | ⭐⭐⭐⭐ |
| 9 | 手写一个简易版 computed | ⭐⭐⭐⭐ |
| 10 | watch 和 watchEffect 的执行时机？ | ⭐⭐⭐ |

---

## 💻 算法题

### #98 验证二叉搜索树

> 给定二叉树根节点 root，判断是否是有效 BST。

**递归传递范围 — O(n) 时间 / O(h) 空间：**

```javascript
/**
 * 每个节点的值必须在 (min, max) 范围内
 * 左子树 max 更新为当前节点值，右子树 min 更新为当前节点值
 */
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (!root) return true
  if (root.val <= min || root.val >= max) return false
  return isValidBST(root.left, min, root.val)
      && isValidBST(root.right, root.val, max)
}

// 测试
const tree = {
  val: 5,
  left: { val: 3, left: { val: 1 }, right: { val: 4 } },
  right: { val: 7, left: { val: 6 }, right: { val: 9 } }
}
console.log(isValidBST(tree)) // ✅ true
```

⚠️ **易错**：`node.val <= max` 而不是 `< max`（题目要求严格不等）。

### #230 二叉搜索树中第 K 小的元素

> 给定 BST root 和整数 k，返回第 k 小元素。

**中序遍历 — O(h+k) 时间 / O(h) 空间：**

```javascript
/**
 * BST 中序遍历就是有序序列，第 k 个即答案
 */
function kthSmallest(root, k) {
  let count = 0, result = null
  function inorder(node) {
    if (!node || result !== null) return
    inorder(node.left)
    count++
    if (count === k) { result = node.val; return }
    inorder(node.right)
  }
  inorder(root)
  return result
}

const bst = {
  val: 5,
  left: { val: 3, left: { val: 2, left: { val: 1 } }, right: { val: 4 } },
  right: { val: 7 }
}
console.log(kthSmallest(bst, 1)) // 1
console.log(kthSmallest(bst, 3)) // 3
```

### #199 二叉树的右视图

> 给定二叉树 root，返回从右侧看每层最后一个节点。

**BFS 层序遍历 — O(n) 时间 / O(w) 空间：**

```javascript
/**
 * BFS 每层最后一个节点加入结果
 */
function rightSideView(root) {
  if (!root) return []
  const result = [], queue = [root]
  while (queue.length) {
    const size = queue.length
    for (let i = 0; i < size; i++) {
      const node = queue.shift()
      if (i === size - 1) result.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
  }
  return result
}

const tree = {
  val: 1,
  left: { val: 2, right: { val: 5 } },
  right: { val: 3, right: { val: 4 } }
}
console.log(rightSideView(tree)) // [1, 3, 4]
```

---

## 🖐️ 手写题

### 手写 1：实现简化版 `computed`

> 考察：响应式原理核心（依赖收集 + 惰性求值 + 缓存）

```javascript
/**
 * 简化版 computed 实现
 * 核心思路：用 effect 的 lazy + scheduler 机制
 * - lazy: 不立即执行，返回值
 * - 缓存: dirty 标记，依赖变化时才重新计算
 */
function myComputed(getter) {
  let value         // 缓存值
  let dirty = true  // 脏标记：是否需要重新计算

  // 创建一个 effect，但不立即执行（lazy）
  const runner = effect(getter, {
    lazy: true,
    // 当依赖变化时，scheduler 只标记 dirty，不立即重算
    scheduler() {
      if (!dirty) {
        dirty = true
        // 通知依赖了这个 computed 的 effect 重新执行
        trigger(obj, 'value')
      }
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        value = runner()  // 执行 getter，触发依赖收集
        dirty = false
      }
      // 在读取时收集依赖
      track(obj, 'value')
      return value
    }
  }
  return obj
}

// 使用示例
const count = ref(0)
const doubled = myComputed(() => count.value * 2)
console.log(doubled.value) // 0
count.value = 5
console.log(doubled.value) // 10（dirty=true 时重算）
```

⚠️ **易错点**：
- computed 是**惰性求值**的，只有读取 `.value` 时才执行 getter
- 依赖变化时不是立即重算，而是标记 `dirty = true`
- computed 本身也是响应式的，其他 effect 可以依赖它

❌ **常见错误**：
- ❌ 在 `scheduler` 里直接重新计算 → 应该只标记 dirty
- ❌ 忘记 `track` → computed 不会被其他 effect 收集
- ❌ 每次访问都重新计算 → 没有利用缓存

### 手写 2：实现简化版 `watch`

> 考察：effect 的调度机制 + 新旧值对比 + 清理副作用

```javascript
/**
 * 简化版 watch 实现
 * 核心思路：
 * 1. 用 effect + scheduler 监听 source 变化
 * 2. 保存旧值，变化时对比
 * 3. 支持 flush: 'post'（DOM 更新后执行）
 */
function myWatch(source, cb, options = {}) {
  const { immediate = false, flush = 'post' } = options

  // 处理 source：可以是 ref、reactive 对象、或 getter 函数
  let getter
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source  // 遍历读取所有属性以收集依赖
  } else if (typeof source === 'function') {
    getter = source
  }

  let oldValue, newValue

  // 调度函数：依赖变化时执行
  const job = () => {
    newValue = runner()  // 重新执行 getter 得到新值
    cb(newValue, oldValue)
    oldValue = newValue  // 更新旧值
  }

  // 创建 effect
  const runner = effect(getter, {
    lazy: true,
    scheduler: flush === 'sync' ? job : () => queueJob(job)
  })

  // immediate: 立即执行一次回调
  if (immediate) {
    job()
  } else {
    oldValue = runner()  // 首次求值，但不触发回调
  }

  // 返回停止监听函数
  return () => stop(runner)
}

// 使用示例
const count = ref(0)

// 基本用法
myWatch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`)
})
count.value = 1  // "count: 0 → 1"

// immediate
myWatch(count, (newVal) => {
  console.log('immediate:', newVal)
}, { immediate: true })  // "immediate: 0"

// 监听 getter
myWatch(() => count.value * 2, (newVal) => {
  console.log('doubled:', newVal)
})
```

⚠️ **易错点**：
- `watch` 默认是**惰性**的（首次不执行回调），`watchEffect` 是立即执行的
- `watch` 的回调拿到的是**新值和旧值**，`watchEffect` 没有
- `flush: 'pre'`（默认）在组件更新前执行，`'post'` 在 DOM 更新后执行

❌ **常见错误**：
- ❌ `watch` 监听 reactive 对象时只拿到新值 → 需要 `{ deep: true }` 或用 getter 返回具体属性
- ❌ 忘记返回的 `stop` 函数 → 无法在组件卸载时停止监听（应在 `onUnmounted` 中调用）
- ❌ `scheduler` 里直接调用 job → 应该用 `queueJob` 做异步调度避免重复执行

---

## 💻 算法题（补充）

### #300 最长递增子序列（LIS）— 动态规划

> 给定整数数组 `nums`，返回最长严格递增子序列的长度。

**DP 解法 — O(n²) 时间 / O(n) 空间：**

```javascript
/**
 * dp[i] = 以 nums[i] 结尾的最长递增子序列长度
 * 状态转移：对于每个 i，遍历 j < i，如果 nums[j] < nums[i]，则 dp[i] = max(dp[i], dp[j] + 1)
 */
function lengthOfLIS(nums) {
  const n = nums.length
  if (n === 0) return 0
  
  const dp = new Array(n).fill(1) // 每个元素自身至少长度为 1
  
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1)
      }
    }
  }
  
  return Math.max(...dp)
}

// 测试
console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])) // 4（[2,3,7,101]）
console.log(lengthOfLIS([0, 1, 0, 3, 2, 3]))             // 4（[0,1,2,3]）
console.log(lengthOfLIS([7, 7, 7, 7, 7]))                 // 1
```

**进阶：贪心 + 二分 — O(n log n)：**

```javascript
/**
 * 贪心思路：维护一个 tails 数组，tails[i] 表示长度为 i+1 的递增子序列的最小末尾
 * 用二分查找找到插入位置，保持 tails 递增
 */
function lengthOfLISBinary(nums) {
  const tails = []
  
  for (const num of nums) {
    let left = 0, right = tails.length
    // 二分查找第一个 >= num 的位置
    while (left < right) {
      const mid = (left + right) >> 1
      if (tails[mid] < num) left = mid + 1
      else right = mid
    }
    tails[left] = num  // 替换或追加
  }
  
  return tails.length
}

console.log(lengthOfLISBinary([10, 9, 2, 5, 3, 7, 101, 18])) // 4
```

⚠️ **易错点**：
- ❌ dp 数组初始化为 0 而不是 1 → 每个元素自身至少长度为 1
- ❌ 混淆"子序列"和"子数组" → 子序列不要求连续
- ❌ 二分法中 `right = tails.length` 而不是 `tails.length - 1` → 因为可能需要追加

### #438 找到字符串中所有字母异位词 — 滑动窗口

> 给定两个字符串 `s` 和 `p`，找到 `s` 中所有 `p` 的字母异位词的起始索引。

**滑动窗口 — O(n) 时间 / O(1) 空间：**

```javascript
/**
 * 滑动窗口思路：
 * 1. 维护一个固定长度为 p.length 的窗口
 * 2. 用两个数组记录窗口内和 p 中每个字符的频次
 * 3. 每次滑动比较两个频次数组是否相等
 */
function findAnagrams(s, p) {
  const sLen = s.length, pLen = p.length
  if (sLen < pLen) return []
  
  const result = []
  const sCount = new Array(26).fill(0)
  const pCount = new Array(26).fill(0)
  
  // 辅助函数：字符 → 数组索引
  const idx = (ch) => ch.charCodeAt(0) - 97
  
  // 初始化：统计 p 的频次 + 第一个窗口的频次
  for (let i = 0; i < pLen; i++) {
    pCount[idx(p[i])]++
    sCount[idx(s[i])]++
  }
  
  // 检查第一个窗口
  if (arraysEqual(sCount, pCount)) result.push(0)
  
  // 滑动窗口
  for (let i = pLen; i < sLen; i++) {
    sCount[idx(s[i])]++           // 加入右边新字符
    sCount[idx(s[i - pLen])]--    // 移除左边旧字符
    if (arraysEqual(sCount, pCount)) result.push(i - pLen + 1)
  }
  
  return result
}

function arraysEqual(a, b) {
  for (let i = 0; i < 26; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// 测试
console.log(findAnagrams('cbaebabacd', 'abc'))  // [0, 6]
console.log(findAnagrams('abab', 'ab'))          // [0, 1, 2]
```

**优化版：用 match 计数避免逐字符比较：**

```javascript
function findAnagramsOptimized(s, p) {
  const sLen = s.length, pLen = p.length
  if (sLen < pLen) return []
  
  const result = []
  const count = new Array(26).fill(0)
  const idx = (ch) => ch.charCodeAt(0) - 97
  
  // 统计 p 中每个字符的频次（作为基准）
  for (const ch of p) count[idx(ch)]++
  
  let left = 0, match = 0  // match 记录窗口内满足频次的字符种类数
  
  for (let right = 0; right < sLen; right++) {
    const rIdx = idx(s[right])
    count[rIdx]--
    if (count[rIdx] === 0) match++  // 该字符频次刚好满足
    
    // 窗口超过 p 长度时，移除左边字符
    if (right >= pLen) {
      const lIdx = idx(s[left])
      if (count[lIdx] === 0) match-- // 移除前它是满足的
      count[lIdx]++
      left++
    }
    
    // 所有 26 个字符的频次都满足时，找到一个异位词
    if (match === 26) result.push(left)
  }
  
  return result
}

console.log(findAnagramsOptimized('cbaebabacd', 'abc')) // [0, 6]
```

⚠️ **易错点**：
- ❌ 滑动窗口忘记更新 left 指针 → 窗口长度不对
- ❌ 优化版中 `match === 26` 判断 → 注意 count 数组是相对于 p 的差值，不是绝对频次
- ❌ 返回的是**起始索引**，不是结束索引

✅ **滑动窗口模板（通用）：**

```javascript
// 滑动窗口通用模板
function slidingWindow(s, condition) {
  let left = 0, result = 0
  const window = {}  // 窗口内的数据
  
  for (let right = 0; right < s.length; right++) {
    // 1. 扩大窗口，更新 window 数据
    window[s[right]] = (window[s[right]] || 0) + 1
    
    // 2. 判断是否需要收缩窗口（满足某个条件）
    while (condition(window)) {
      // 3. 更新结果
      result = Math.max(result, right - left + 1)
      // 4. 收缩窗口
      window[s[left]]--
      left++
    }
  }
  return result
}
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|----------|---------|
| Vue3 知识链 | 响应式→编译→API→状态→性能→SSR | ⭐⭐⭐⭐⭐ |
| Vue3 vs Vue2 | Proxy + Composition API + PatchFlag + Tree-shaking + Pinia | ⭐⭐⭐⭐⭐ |
| STAR 项目描述 | 场景→任务→行动→结果，必须有数字 | ⭐⭐⭐⭐⭐ |
| 首屏优化 | 路由懒加载+Gzip+CDN+异步组件+虚拟滚动 | ⭐⭐⭐⭐⭐ |
| 组件通信 | props/emit > v-model > provide/inject > Pinia > mitt | ⭐⭐⭐⭐ |
| BST 验证 | 递归传递范围 (min, max) | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 14）

第三阶段启动！React 18+ 从"用过"升级到"精通"——先回顾第二周错题，再预习 React 基础。
