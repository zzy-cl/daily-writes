# 04/21 — ⭐ 第四阶段启动（React 全家桶串讲 + Vue 对比 + 手写题 + 算法）

> 🕐 预计 2-3h | 轻量日，以回顾总结为主

---

## 📌 知识点1：React 全部知识点串讲

### 🔑 核心架构：Fiber 架构

React 16 引入 Fiber 架构，将递归渲染改为**可中断的链表遍历**。

```
// Fiber 节点结构（简化）
{
  type,          // 组件类型（'div'、FunctionComponent 等）
  key,
  props,
  stateNode,     // DOM 节点或组件实例
  child,         // 第一个子 Fiber
  sibling,       // 下一个兄弟 Fiber
  return,        // 父 Fiber
  pendingProps,
  memoizedState, // Hook 链表（函数组件）或 state（类组件）
  effectTag,     // 副作用标记：Placement | Update | Deletion
}
```

**工作循环（Work Loop）**：
1. **render 阶段**（可中断）：`performUnitOfWork` → `beginWork` → `completeWork`
2. **commit 阶段**（同步不可中断）：`commitWork` → 更新 DOM

⚠️ **易错**：render 阶段可能被多次执行，不能在里面写副作用！

### 🔑 Hooks 体系

| Hook | 用途 | ⚠️ 注意 |
|------|------|---------|
| `useState` | 状态管理 | 批量更新，函数式更新防闭包陷阱 |
| `useEffect` | 副作用 | 依赖数组为空只执行一次 |
| `useLayoutEffect` | 同步副作用 | DOM 变更后、浏览器绘制前执行 |
| `useCallback` | 缓存函数 | 配合 React.memo 使用 |
| `useMemo` | 缓存值 | 计算密集型场景使用 |
| `useRef` | 持久引用 | 不触发重渲染 |
| `useContext` | 跨组件传值 | Provider 变化导致所有消费者重渲染 |
| `useReducer` | 复杂状态逻辑 | 类似 Redux 的 reducer 模式 |

**自定义 Hook 规则**：
- ✅ 命名必须以 `use` 开头
- ✅ 只在组件顶层或其他 Hook 中调用
- ❌ 不能在条件/循环中调用（Hook 调用顺序必须稳定）

### 🔑 React 18 新特性

```
// 1. 并发模式（Concurrent Mode）— 自动启用
// startTransition 标记低优先级更新
import { startTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (value) => {
    setQuery(value); // 🔴 高优先级：立即更新输入框
    startTransition(() => {
      setResults(filterItems(value)); // 🟢 低优先级：可被中断
    });
  };
}

// 2. useDeferredValue — 延迟某个值的更新
const deferredQuery = useDeferredValue(query);

// 3. useId — 生成 SSR 安全的唯一 ID
const id = useId(); // "React:1:0"

// 4. Suspense 支持 SSR 流式渲染
<Suspense fallback={<Skeleton />}>
  <Comments /> {/* 服务端流式发送 */}
</Suspense>
```

### 🔑 React Server Components (RSC)

```
// ✅ Server Component（默认）— 不能用 useState/useEffect
// async Server Component
async function ArticleList() {
  const articles = await db.articles.findAll(); // 直接访问数据库
  return (
    <ul>
      {articles.map(a => <ArticleCard key={a.id} article={a} />)}
    </ul>
  );
}

// ✅ Client Component — 用 'use client' 指令
'use client';
import { useState } from 'react';
function LikeButton({ initialCount }) {
  const [count, setCount] = useState(initialCount);
  return <button onClick={() => setCount(c => c + 1)}>👍 {count}</button>;
}
```

| 特性 | Server Component | Client Component |
|------|-----------------|-----------------|
| 可用 Hooks | ❌ | ✅ |
| 可访问数据库 | ✅ | ❌ |
| 打包体积 | 不计入 bundle | 计入 bundle |
| 交互性 | ❌ | ✅ |

### 🔑 状态管理方案

| 方案 | 核心思想 | 适用场景 |
|------|---------|---------|
| Context + useReducer | 内置方案 | 小型全局状态 |
| Redux Toolkit | 单一 Store + Immer | 中大型应用 |
| Zustand | 轻量 Store | 快速开发 |
| Jotai / Recoil | 原子化状态 | 精细粒度控制 |
| React Query / SWR | 服务端状态缓存 | API 数据管理 |

### 🔑 性能优化清单

- ✅ `React.memo` — 浅比较 props，避免不必要的重渲染
- ✅ `useMemo` / `useCallback` — 缓存计算值和回调函数
- ✅ `lazy` + `Suspense` — 路由级别代码分割
- ✅ 虚拟列表（`react-window`）— 长列表优化
- ✅ `startTransition` — 标记低优先级更新
- ❌ 不要在 render 中创建新对象/函数（每次引用不同）

---

## 📌 知识点2：Vue vs React 对比总结表

| 维度 | React | Vue 3 |
|------|-------|-------|
| **响应式原理** | 手动触发 `setState`/`dispatch` | Proxy 自动追踪依赖 |
| **模板语法** | JSX（JavaScript 表达式） | Template（指令式语法） |
| **状态变更** | 不可变更新（新引用） | 直接修改（Proxy 拦截） |
| **组件通信** | Props + Context + 状态库 | Props + Emit + Provide/Inject |
| **组合逻辑** | Hooks（函数） | Composables（函数） |
| **编译优化** | JSX Runtime、自动 memo | 静态提升、PatchFlag、Block Tree |
| **SSR** | Next.js / RSC | Nuxt 3 |
| **生态** | React Native、Remix、Expo | Vite（原生）、Pinia、VueUse |
| **学习曲线** | 中等（JSX + Hooks 规则） | 较低（模板更直观） |
| **TypeScript** | 需要额外配置 | 一等公民（`defineComponent`） |

### 🔑 响应式对比

```
// React — 需要显式触发更新
const [count, setCount] = useState(0);
setCount(count + 1); // ✅ 必须调用 setCount

// Vue 3 — Proxy 自动追踪
const count = ref(0);
count.value++; // ✅ 直接修改，自动触发更新

const state = reactive({ name: 'Penny' });
state.name = 'Dalia'; // ✅ 直接赋值，自动触发更新
```

### 🔑 虚拟 DOM Diff 算法差异

| 维度 | React | Vue 3 |
|------|-------|-------|
| **Diff 策略** | 仅同层比较（Tree Diff） | 同层比较 + 静态标记 |
| **列表 Diff** | key 匹配 + 双端指针 | 最长递增子序列（LIS）优化 |
| **静态分析** | 无（运行时全量 Diff） | 编译时标记静态节点（hoistStatic） |
| **Patch 粒度** | 组件级（整个子树重渲染） | 元素级（PatchFlag 精确到属性） |

```
// React Diff — 简化逻辑
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    // 1. 类型不同 → 删除旧节点，创建新节点
    // 2. 类型相同 key 相同 → 复用，更新 props
    // 3. 列表用 key 匹配位置
  }
}

// Vue 3 Diff — 最长递增子序列
// 对比新旧 children，找到需要移动的最小节点集
// 通过 LIS 算法确定哪些节点位置不变，只移动必要的
```

⚠️ **面试高频**：为什么 Vue 3 列表性能通常优于 React？
→ Vue 3 的 Diff 使用**最长递增子序列**（LIS）算法，能精确定位哪些节点不需要移动，最小化 DOM 操作。React 的 Diff 虽然也是 O(n)，但移动策略更保守（双端指针），在大规模列表重排序场景下可能产生更多 DOM 操作。

### 🔑 HMR（热模块替换）差异

| 维度 | React（Fast Refresh） | Vue（Vite HMR） |
|------|----------------------|-----------------|
| **实现方式** | 组件级替换，状态尽量保留 | SFC 编译后精确替换 |
| **状态保留** | 函数组件状态保留；Hook 变化可能重置 | `<script>` 变化重置，`<template>` / `<style>` 热替换 |
| **配置成本** | CRA/Vite 内置，需额外配置 react-refresh | Vite 原生支持，零配置 |
| **错误恢复** | 运行时错误自动回退到上一版本 | 编译错误直接在 overlay 显示 |

### 🔑 组件设计思想差异

| 维度 | React | Vue 3 |
|------|-------|-------|
| **哲学** | "Just JavaScript" — 最小 API 表面 | "渐进式框架" — 提供更多内置方案 |
| **状态** | 状态外置（Hooks 管理） | 状态内聚（`<script setup>` + ref/reactive） |
| **模板 vs JSX** | JSX 里写逻辑（全 JavaScript） | Template 里声明式，逻辑在 `<script>` |
| **作用域样式** | CSS-in-JS / CSS Modules | `<style scoped>` 原生支持 |
| **动画** | 需第三方库（framer-motion） | `<Transition>` 内置组件 |
| **表单** | 需库（react-hook-form） | `v-model` 内置双向绑定 |
| **指令** | 无指令概念 | `v-if` / `v-for` / `v-model` 等 |

⚠️ **面试高频**：什么时候选 React？什么时候选 Vue？
→ **选 React**：需要 React Native 跨端、团队已有 React 经验、需要极致灵活的生态组合。**选 Vue**：快速原型、需要大量内置能力减少三方依赖、团队偏传统前端背景、中小项目快速交付。

---

## 📌 知识点2.5：⚠️ React 常见陷阱与易错点

### ❌/✅ 对比速查表

#### 陷阱 1：useEffect 闭包陷阱

```
// ❌ 闭包捕获了旧的 count 值
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 永远是 0！闭包捕获了初始值
      setCount(count + 1); // 永远设为 1
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 依赖数组为空，count 被"冻结"

  return <span>{count}</span>;
}

// ✅ 使用函数式更新避免闭包陷阱
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1); // ✅ 用 prev 获取最新值
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

#### 陷阱 2：useEffect 依赖数组遗漏

```
// ❌ 依赖数组缺失 query，query 变化时不会重新请求
function Search({ query }) {
  useEffect(() => {
    fetch(`/api/search?q=${query}`);
  }, []); // ⚠️ ESLint exhaustive-deps 会警告！
}

// ✅ 正确添加依赖
useEffect(() => {
  fetch(`/api/search?q=${query}`);
}, [query]); // ✅ query 变化时重新请求
```

#### 陷阱 3：在 render 中创建昂贵对象

```
// ❌ 每次渲染都创建新对象，导致子组件无意义重渲染
function Parent() {
  const options = { theme: 'dark' }; // 每次渲染新引用
  return <Child options={options} />; // React.memo 也无法阻止重渲染
}

// ✅ 用 useMemo 缓存
function Parent() {
  const options = useMemo(() => ({ theme: 'dark' }), []);
  return <Child options={options} />;
}
```

#### 陷阱 4：key 的误用

```
// ❌ 用 index 作为 key（列表增删时导致状态错乱）
{items.map((item, index) => (
  <TodoItem key={index} item={item} />
))}

// ✅ 用唯一标识作为 key
{items.map(item => (
  <TodoItem key={item.id} item={item} />
))}
```

#### 陷阱 5：状态更新是异步的

```
// ❌ 连续 setState 不会累加
function handleClick() {
  setCount(count + 1); // count = 0 → 1
  setCount(count + 1); // count 仍然是 0 → 1（不是 2！）
  console.log(count); // 还是 0！
}

// ✅ 函数式更新 + useEffect 监听
function handleClick() {
  setCount(prev => prev + 1); // 1
  setCount(prev => prev + 1); // 2 ✅
}
```

#### 陷阱 6：条件渲染中使用 Hooks

```
// ❌ Hook 调用顺序不稳定，React 会报错
function Bad({ isLoggedIn }) {
  if (isLoggedIn) {
    useEffect(() => { ... }, []); // ❌ 有条件地调用 Hook
  }
}

// ✅ 始终在顶层调用 Hook
function Good({ isLoggedIn }) {
  useEffect(() => {
    if (!isLoggedIn) return; // ✅ 在 Hook 内部处理条件
    // ...
  }, [isLoggedIn]);
}
```

> 💡 **记忆口诀**：Hooks 三原则 — 顶层调用、纯函数中、不在循环/条件/嵌套函数中使用。

---

## 📌 知识点3：React 面试高频场景题

### ⭐ 场景1：Hydration Mismatch

**问题**：SSR 输出的 HTML 与客户端 hydration 时的虚拟 DOM 不一致。

```
// ❌ 常见原因
function CurrentTime() {
  return <span>{new Date().toLocaleString()}</span>; // 服务端和客户端时间不同！
}

// ✅ 修复方案
function CurrentTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);
  return <span>{time || 'Loading...'}</span>;
}
```

**其他常见原因**：
- 浏览器扩展注入 DOM 节点
- 随机数/UUID 在服务端和客户端不同
- CSS 导致的 DOM 结构差异（如 `<p>` 内嵌 `<div>`）

### ⭐ 场景2：性能排查流程

1. **React DevTools Profiler** — 录制，查看哪些组件渲染耗时长
2. **检查重渲染** — 使用 `why-did-you-render` 检测不必要的渲染
3. **查看瀑布图** — Chrome DevTools → Network → 查看请求串行
4. **Lighthouse** — 检测 LCP/CLS/FID 等 Web Vitals
5. **Memory 面板** — 排查内存泄漏（未清理的定时器、事件监听）

### ⭐ 场景3：受控组件 vs 非受控组件

```
// ✅ 受控组件 — React 管理表单状态
function ControlledInput() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}

// ✅ 非受控组件 — DOM 自己管理状态
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleSubmit = () => console.log(inputRef.current.value);
  return <input ref={inputRef} defaultValue="" />;
}
```

| | 受控 | 非受控 |
|---|---|---|
| 状态管理 | React state | DOM |
| 实时验证 | ✅ 容易 | ❌ 需额外处理 |
| 性能 | 每次输入都重渲染 | 更好 |
| 适用场景 | 复杂表单 | 简单表单/集成第三方 |

---

## 📌 手写题：React 经典实现

### ✍️ 手写题1：手写简易版 useEffect

> 面试要求：不依赖 React，模拟 useEffect 的核心机制（依赖比较 + 清理函数）。

```
// 手写 useEffect 核心原理
// 核心：闭包保存上一次的依赖，比较后决定是否执行

function createUseEffect() {
  let lastDeps = null;    // 上一次的依赖数组
  let cleanup = null;     // 上一次的清理函数

  function useEffect(callback, deps) {
    // 1. 首次调用（lastDeps 为 null）
    // 2. 无依赖数组（每次都执行）
    // 3. 依赖变化
    const hasChanged = !lastDeps ||
      deps.length !== lastDeps.length ||
      deps.some((dep, i) => !Object.is(dep, lastDeps[i]));

    if (hasChanged) {
      // 先执行上一次的清理函数
      if (cleanup) cleanup();
      // 执行副作用，保存返回的清理函数
      cleanup = callback();
      // 保存当前依赖
      lastDeps = deps ? [...deps] : null;
    }
  }

  // 模拟组件卸载时调用清理
  useEffect.cleanup = () => {
    if (cleanup) cleanup();
    lastDeps = null;
    cleanup = null;
  };

  return useEffect;
}

// 测试
const useEffect = createUseEffect();

// 第一次调用 — 执行副作用
useEffect(() => {
  console.log('effect ran');
  return () => console.log('cleanup');
}, [1, 2]); // 输出: "effect ran"

// 依赖不变 — 跳过
useEffect(() => {
  console.log('effect ran');
  return () => console.log('cleanup');
}, [1, 2]); // 无输出

// 依赖变化 — 先清理再执行
useEffect(() => {
  console.log('effect ran again');
  return () => console.log('cleanup');
}, [1, 3]); // 输出: "cleanup" → "effect ran again"
```

⚠️ **面试追问**：
- Q：为什么用 `Object.is` 而不是 `===`？
  A：`Object.is(NaN, NaN)` 返回 `true`，而 `NaN === NaN` 返回 `false`。`Object.is(+0, -0)` 返回 `false`，更精确。
- Q：React 真实的 useEffect 用链表还是数组存储？
  A：**链表**。每个 Hook（包括 useEffect）是 `fiber.memoizedState` 链表上的一个节点，通过 `next` 指针串联，保证调用顺序一致。

### ✍️ 手写题2：手写简易版 Redux Store

> 面试要求：实现 `createStore` 的核心功能（getState / dispatch / subscribe）。

```
// 手写 Redux createStore
function createStore(reducer, preloadedState) {
  let state = preloadedState;
  let listeners = [];
  let isDispatching = false; // 防止在 reducer 中 dispatch

  // 获取当前状态
  function getState() {
    return state;
  }

  // 派发 action — 核心方法
  function dispatch(action) {
    // 1. 校验 action 格式
    if (typeof action !== 'object' || action === null) {
      throw new Error('Action must be a plain object');
    }
    if (typeof action.type === 'undefined') {
      throw new Error('Action must have a "type" property');
    }

    // 2. 防止在 reducer 中 dispatch（Redux 三大原则之一）
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions');
    }

    try {
      isDispatching = true;
      // 3. 调用 reducer 得到新状态（纯函数）
      state = reducer(state, action);
    } finally {
      isDispatching = false;
    }

    // 4. 通知所有订阅者
    listeners.forEach(listener => listener());

    return action;
  }

  // 订阅状态变化
  function subscribe(listener) {
    listeners.push(listener);

    // 返回取消订阅函数
    let isSubscribed = true;
    return function unsubscribe() {
      if (!isSubscribed) return;
      isSubscribed = false;
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  // 初始化 — 派发一个随机 type 来获取初始状态
  dispatch({ type: '@@redux/INIT' + Math.random().toString(36).slice(2) });

  return { getState, dispatch, subscribe };
}

// 测试
const initialState = { count: 0 };

function counterReducer(state = initialState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'ADD':
      return { ...state, count: state.count + action.payload };
    default:
      return state;
  }
}

const store = createStore(counterReducer);
console.log(store.getState()); // { count: 0 }

const unsubscribe = store.subscribe(() => {
  console.log('State changed:', store.getState());
});

store.dispatch({ type: 'INCREMENT' });       // { count: 1 }
store.dispatch({ type: 'ADD', payload: 5 }); // { count: 6 }
unsubscribe(); // 取消订阅
store.dispatch({ type: 'DECREMENT' });       // { count: 5 }（不再打印）
```

⚠️ **面试追问**：
- Q：Redux 为什么要求 reducer 是纯函数？
  A：保证可预测性 — 相同的 `(state, action)` 必须返回相同的 `newState`，这样才能实现时间旅行调试、撤销/重做等功能。
- Q：Redux 中间件的原理是什么？
  A：**函数柯里化 + 洋葱模型**。中间件签名 `(store) => (next) => (action) => {}`，`next` 是下一个中间件（或真正的 `dispatch`），形成调用链。本质是对 `dispatch` 方法的增强/包装。

---

## 📌 算法题：React/前端场景常考

### 🧮 算法题1：合并区间（LeetCode #56）

> **前端场景**：日历组件中合并重叠的时间段、CSS 样式规则合并重叠的选择器范围。

```
/**
 * 合并所有重叠的区间
 * 输入: [[1,3],[2,6],[8,10],[15,18]]
 * 输出: [[1,6],[8,10],[15,18]]
 *
 * 时间复杂度: O(n log n)  空间复杂度: O(n)
 */
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // 1. 按起始时间排序（关键！）
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const curr = intervals[i];

    if (curr[0] <= last[1]) {
      // 2. 重叠 → 合并：取结束时间的最大值
      last[1] = Math.max(last[1], curr[1]);
    } else {
      // 3. 不重叠 → 直接加入
      merged.push(curr);
    }
  }

  return merged;
}

// 测试
console.log(merge([[1,3],[2,6],[8,10],[15,18]]));
// [[1,6],[8,10],[15,18]]

console.log(merge([[1,4],[4,5]]));
// [[1,5]]
```

⚠️ **易错点**：
- ❌ 忘记排序！不排序直接遍历会漏掉非相邻的重叠区间
- ❌ 合并时只取 `last[1] = curr[1]`，忽略了 `[1,10]` 和 `[2,5]` 的情况（应取 `max`）
- ✅ 排序后只需一次遍历，O(n log n)

### 🧮 算法题2：无重复字符的最长子串（LeetCode #3）

> **前端场景**：输入框实时校验（检查输入中是否有重复字符）、文本编辑器去重逻辑。

```
/**
 * 滑动窗口法
 * 输入: "abcabcbb"
 * 输出: 3 ("abc")
 *
 * 时间复杂度: O(n)  空间复杂度: O(min(m,n)) m=字符集大小
 */
function lengthOfLongestSubstring(s) {
  const window = new Map(); // char → 最近出现的 index
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // 如果字符已在窗口中，移动 left 到重复字符的下一个位置
    if (window.has(char) && window.get(char) >= left) {
      left = window.get(char) + 1;
    }

    window.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

// 测试
console.log(lengthOfLongestSubstring('abcabcbb')); // 3 ("abc")
console.log(lengthOfLongestSubstring('bbbbb'));    // 1 ("b")
console.log(lengthOfLongestSubstring('pwwkew'));   // 3 ("wke")
console.log(lengthOfLongestSubstring(''));          // 0
```

⚠️ **易错点**：
- ❌ `window.get(char) >= left` 的判断漏掉 — 如果重复字符已经在窗口外（left 之后），不需要移动 left
- ❌ 用 `Set` 实现时，移除元素要用 `while` 逐个移除直到重复字符被移出
- ✅ 用 `Map` 记录 index 可以直接跳转 left，更高效
- ✅ 滑动窗口模板：**右指针扩张 → 不满足条件时左指针收缩 → 更新答案**

> 💡 **滑动窗口通用模板**：
> ```
> function slidingWindow(s) {
>   let left = 0, result = 0;
>   const window = new Map();
>
>   for (let right = 0; right < s.length; right++) {
>     // 1. 扩张窗口：加入 s[right]
>     window.set(s[right], (window.get(s[right]) || 0) + 1);
>
>     // 2. 收缩窗口：条件不满足时
>     while (/* 窗口不满足条件 */) {
>       window.set(s[left], window.get(s[left]) - 1);
>       left++;
>     }
>
>     // 3. 更新答案
>     result = Math.max(result, right - left + 1);
>   }
>   return result;
> }
> ```

---

## 📌 算法：Day 15-20 错题回顾清单

> 📝 复盘日不做新题，整理之前的错题。以下为常见易错题型：

| 题号 | 题目 | 易错点 | 正确思路 |
|------|------|--------|---------|
| #25 | K 个一组翻转链表 | 递归 vs 迭代的边界处理 | 先数 k 个，再翻转，递归处理剩余 |
| #23 | 合并K个有序链表 | 最小堆实现 | 优先队列，O(N log K) |
| #76 | 最小覆盖子串 | 滑动窗口的收缩条件 | need/has 双哈希表 |
| #394 | 字符串解码 | 嵌套括号的递归/栈处理 | 栈存 [str, num] 对 |
| #207 | 课程表 | 拓扑排序的入度数组 | BFS + 入度为 0 入队 |

**错题复盘方法**：
1. 📌 重新独立写一遍（不看答案）
2. 🔑 总结这类题的通用模板
3. ⚠️ 标注自己的易错点
4. 🔧 举一反三：同类变形题

---

## 📋 总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Fiber 架构 | 可中断渲染、链表结构、双阶段 | ⭐⭐⭐⭐ |
| Hooks 体系 | 闭包 + 链表、调用顺序规则 | ⭐⭐⭐⭐⭐ |
| React 18 | 并发模式、startTransition、Suspense SSR | ⭐⭐⭐⭐ |
| RSC | 服务端/客户端组件区别、零 bundle | ⭐⭐⭐⭐ |
| Vue vs React | 响应式 vs 手动更新、模板 vs JSX | ⭐⭐⭐⭐ |
| Hydration | SSR/CSR 不一致的原因和修复 | ⭐⭐⭐⭐ |
| 性能排查 | Profiler → why-did-you-render → Lighthouse | ⭐⭐⭐ |

---

## 🔮 明日预告

**Day 22 — 构建工具与工程化**
- Vite 原理（为什么这么快？）
- Webpack 5 核心配置
- Monorepo 方案选型
- 手写 Vite 插件
