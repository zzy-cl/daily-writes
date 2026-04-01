# 04/15 — React 核心：Fiber 与 Hooks（Day 15）

> **阶段**：第三阶段 React 18+
> **今日目标**：深入理解 Fiber 架构原理与 Hooks 底层实现机制
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：Fiber 架构 ⭐⭐⭐

### 1.1 为什么需要 Fiber？

React 15 的 Stack Reconciler 使用递归遍历组件树，**不可中断**。当组件树很大时，一次更新可能阻塞主线程几十毫秒，导致动画卡顿、输入延迟。

```text
React 15 (Stack Reconciler)          React 16+ (Fiber Reconciler)
┌─────────────────────────┐          ┌─────────────────────────┐
│ 递归 diff，一次完成       │          │ 链表遍历，可分片执行       │
│ 主线程被长时间占用 ❌      │          │ 每帧让出主线程 ✅          │
│ UI 卡顿 ❌                │          │ 60fps 流畅 ✅             │
└─────────────────────────┘          └─────────────────────────┘
```

🔑 **Fiber 解决的核心问题**：将 Reconciliation（diff）阶段的工作拆分成小单元（Fiber 节点），利用浏览器的 `requestIdleCallback`（React 内部用 `MessageChannel` 模拟）实现**时间切片**，让高优先级更新（用户输入、动画）优先执行。

### 1.2 Fiber 节点结构

每个 React 元素对应一个 Fiber 节点，Fiber 节点通过链表连接形成 Fiber 树。

```js
// Fiber 节点简化结构（react-reconciler/src/ReactFiber.js）
function FiberNode(tag, pendingProps, key) {
  // —— 链表结构（核心）——
  this.return = null;     // 父 Fiber
  this.child = null;      // 第一个子 Fiber
  this.sibling = null;    // 下一个兄弟 Fiber

  // —— 状态相关 ——
  this.tag = tag;         // 组件类型标记（FunctionComponent, ClassComponent, HostComponent...）
  this.type = null;       // 组件类型（函数/类/DOM 标签名）
  this.stateNode = null;  // 对应的真实 DOM 或组件实例

  // —— 双缓冲（alternate 指针）——
  this.alternate = null;  // 指向另一棵树的对应 Fiber

  // —— 副作用 ——
  this.effectTag = null;  // Placement, Update, Deletion...
  this.firstEffect = null;
  this.lastEffect = null;
  this.nextEffect = null;

  // —— 更新队列 ——
  this.updateQueue = null; // 存储 setState/setHook 的更新队列

  // —— 优先级（React 18 Lane 模型）——
  this.lanes = 0;         // 本次更新的优先级
  this.childLanes = 0;    // 子树中所有待处理的优先级
}
```

### 1.3 双缓冲（Double Buffering）⭐

🔑 React 维护两棵 Fiber 树：
- **current 树**：当前屏幕上显示的树
- **workInProgress 树**：正在构建的新树

两棵树通过 `alternate` 指针互相引用。更新完成后，workInProgress 变成新的 current。

```text
       current                    workInProgress
    ┌──────────┐                ┌──────────┐
    │  App     │◄──alternate───►│  App     │
    │ alternate│                │ alternate│
    └────┬─────┘                └────┬─────┘
         │                           │
    ┌────┴─────┐                ┌────┴─────┐
    │  Div     │◄──alternate───►│  Div     │
    └────┬─────┘                └────┬─────┘
         │                           │
    ┌────┴─────┐                ┌────┴─────┐
    │  Span    │◄──alternate───►│  Span    │
    └──────────┘                └──────────┘
         │
         ▼
    实际 DOM 节点
```

### 1.4 工作循环（Work Loop）

React 的工作循环有两个阶段：

```text
┌─────────────────────────────────────────────────────┐
│                   Render 阶段（可中断）               │
│  ┌─────────────────────────────────────────────┐    │
│  │  beginWork → 调用组件，生成子 Fiber          │    │
│  │  completeWork → 收集副作用，创建 DOM 节点    │    │
│  │  时间片用完？→ 记住位置，让出主线程          │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│                   Commit 阶段（不可中断）             │
│  ┌─────────────────────────────────────────────┐    │
│  │  beforeMutation → getSnapshotBeforeUpdate   │    │
│  │  mutation → 执行 DOM 操作                     │    │
│  │  layout → componentDidMount/Update 等        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 1.5 Lane 优先级调度模型（React 18）

React 18 使用 **Lane**（二进制位掩码）来表示优先级，替代了 React 16-17 的 ExpirationTime。

```js
// Lane 优先级示意（简化版）
const SyncLane           = 0b0000000000000000000000000000001; // 同步（用户点击）
const InputContinuousLane = 0b0000000000000000000000000000100; // 连续输入（拖拽）
const DefaultLane         = 0b0000000000000000000000000010000; // 默认（setState）
const TransitionLane     = 0b0000000000000000000000001000000; // useTransition
const IdleLane           = 0b0100000000000000000000000000000; // 空闲

// 优先级越高，位越靠右（数值越小）
// 调度时：pickArbitraryLane(root.pendingLanes) 取最低位的 1
```

```text
优先级排序（从高到低）：
SyncLane > InputContinuousLane > DefaultLane > TransitionLane > IdleLane

用户点击按钮  →  SyncLane（立即响应）
拖拽移动鼠标  →  InputContinuousLane
普通 setState  →  DefaultLane
useTransition →  TransitionLane（可延迟）
离屏预渲染    →  IdleLane
```

---

## 知识点 2：Hooks 底层原理 ⭐⭐⭐

### 2.1 Hooks 链表结构

🔑 **Hooks 存储在 Fiber 节点的 `memoizedState` 上，以单链表形式组织。** 每次组件渲染时，React 按调用顺序遍历这个链表。

```js
// Hook 节点简化结构
function Hook() {
  this.memoizedState = null;  // 当前 hook 的状态值
  this.baseState = null;      // 基准状态（用于计算更新后的值）
  this.queue = null;          // 更新队列（仅 useState/useReducer 有）
  this.baseQueue = null;      // 基准更新队列
  this.next = null;           // 下一个 hook
}

// Fiber 节点上的 hook 链表
// fiber.memoizedState → hook1 → hook2 → hook3 → null
```

```text
函数组件每次渲染时 Hooks 的执行流程：

组件函数被调用
    │
    ▼
按顺序执行每个 Hook（useState, useEffect, useMemo...）
    │
    ├── 首次渲染：创建 Hook 节点，挂到链表
    │
    └── 后续渲染：沿链表遍历，读取/更新 memoizedState
```

### 2.2 useState 底层实现

```js
// useState 简化实现（理解原理用）
function useState(initialState) {
  const hook = mountWorkInProgressHook(); // 获取/创建 hook 节点

  if (isMountPhase) {
    // 首次渲染
    hook.memoizedState = typeof initialState === 'function'
      ? initialState()
      : initialState;
    hook.queue = { pending: null }; // 更新队列
  }

  const dispatch = (action) => {
    // 创建更新对象，入队
    const update = { action };
    hook.queue.pending = update;
    // 触发调度
    scheduleUpdateOnFiber(fiber, SyncLane);
  };

  // 处理更新队列，计算新状态
  hook.memoizedState = processQueue(hook.queue, hook.memoizedState);

  return [hook.memoizedState, dispatch];
}
```

### 2.3 ⚠️ 为什么 Hooks 不能放在条件语句中？

```jsx
// ❌ 严重错误！这会导致状态错乱
function App() {
  const [count, setCount] = useState(0);

  if (count > 0) {
    const [name, setName] = useState('Penny'); // ⚠️ 条件 hook
  }

  const [flag, setFlag] = useState(true); // ⚠️ 链表顺序被打乱！
}
```

原因：**Hooks 依赖调用顺序来匹配链表节点。** 如果某个 hook 有条件地出现，后续所有 hook 的链表位置都会偏移，导致读取到错误的状态。

```text
首次渲染链表：
  hook1(count) → hook2(name) → hook3(flag)

count 变成 1 后渲染链表：
  hook1(count) → hook2(flag) ← 错误！flag 读到了 name 的位置
```

🔑 **React 要求**：Hooks 必须在组件顶层、每次渲染都以相同顺序调用。这就是 **Rules of Hooks**。

### 2.4 useEffect 底层原理

```js
// useEffect 简化逻辑
function useEffect(create, deps) {
  const hook = mountWorkInProgressHook();

  if (isMountPhase) {
    // 首次渲染：调度副作用
    pushEffect(hookEffectTag, create, deps);
  } else {
    // 后续渲染：比较 deps
    if (areDepsEqual(hook.deps, deps)) {
      return; // 依赖没变，跳过
    }
    // 依赖变了：先执行上一次的清理函数，再调度新的副作用
    scheduleEffectCleanup(hook);
    pushEffect(hookEffectTag, create, deps);
  }

  hook.deps = deps;
}
```

useEffect 执行时机：

```text
组件渲染（Render 阶段）
    │
    ▼
DOM 更新（Commit 阶段 - mutation）
    │
    ▼
浏览器绘制完成
    │
    ▼
useEffect 回调异步执行 ← 注意：是绘制之后！
```

### 2.5 清理函数执行时机 ⭐

```jsx
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);

  // 清理函数：在组件卸载 或 依赖变化时执行
  return () => {
    clearInterval(timer);
    console.log('cleaned up');
  };
}, [dep]);

// 执行顺序：
// 首次渲染 → effect 回调
// dep 变化 → 先执行旧清理 → 再执行新 effect
// 组件卸载 → 执行清理
```

| 场景 | effect 回调 | 清理函数 |
|------|------------|---------|
| 首次渲染 | ✅ 执行 | — |
| 依赖变化 | ✅ 执行（清理后） | ✅ 先执行旧的 |
| 组件卸载 | — | ✅ 执行 |
| 无依赖 `[]` | 首次渲染执行一次 | 卸载时执行一次 |

---

## 知识点 3：React 18 中的并发更新基础

### 3.1 并发模式 vs 旧模式

```text
旧模式（React 17 之前）：同步、不可中断
setState → 立即开始 Reconciliation → 完成 → Commit

并发模式（React 18）：可中断、可恢复
setState → 标记更新 → 调度器决定何时开始
  → 开始 Reconciliation
  → 时间片用完？暂停，让出主线程
  → 有更高优先级任务？先处理
  → 恢复 Reconciliation
  → 完成 → Commit
```

### 3.2 createRoot API

```jsx
// ❌ React 17 同步模式
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// ✅ React 18 并发模式
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

| 区别 | ReactDOM.render | createRoot |
|------|----------------|------------|
| 渲染模式 | 同步 | 并发 |
| 自动批处理 | 仅在合成事件中 | Promise/setTimeout 中也批处理 |
| Suspense 支持 | 部分 | 完整 |
| useTransition | ❌ | ✅ |

---

## 🔧 手写题（2 道）

### 手写题 1：模拟 useState 的基本行为

```js
/**
 * 简化版 useState 实现
 * 理解 Hooks 链表和更新队列机制
 */
function createHookSystem() {
  let currentFiber = null;
  let workInProgressHook = null;
  let isMount = true;

  function mountWorkInProgressHook() {
    const hook = {
      memoizedState: null,
      queue: { pending: null },
      next: null,
    };
    // 1. 挂到 fiber 的 hook 链表
    if (!currentFiber.memoizedState) {
      currentFiber.memoizedState = hook;
    } else {
      let last = currentFiber.memoizedState;
      while (last.next) last = last.next;
      last.next = hook;
    }
    return hook;
  }

  function useState(initialState) {
    if (isMount) {
      // 2. 首次渲染：初始化状态
      const hook = mountWorkInProgressHook();
      hook.memoizedState = typeof initialState === 'function'
        ? initialState() : initialState;

      const dispatch = (action) => {
        const update = { action: typeof action === 'function' ? action : () => action };
        hook.queue.pending = update;
        // 3. 触发重新渲染（简化版直接调用 render）
        render();
      };

      return [hook.memoizedState, dispatch];
    }
    // 后续渲染逻辑（简化版省略）
  }

  function render() {
    isMount = false;
    workInProgressHook = currentFiber.memoizedState;
    // 模拟组件重新执行
    const [count, setCount] = useState(0); // 这里简化，实际需要 hookIndex
    console.log('render count:', count);
    // 处理 pending 更新
    let hook = currentFiber.memoizedState;
    while (hook) {
      if (hook.queue.pending) {
        const { action } = hook.queue.pending;
        hook.memoizedState = action(hook.memoizedState);
        hook.queue.pending = null;
      }
      hook = hook.next;
    }
  }

  // 初始化 fiber
  currentFiber = { memoizedState: null };
  return { useState, render };
}

// 测试
const { useState: myUseState, render } = createHookSystem();
let myCount = 0;
function Counter() {
  const [count, setCount] = myUseState(0);
  myCount = count;
}
// 首次调用
Counter();
console.log(myCount); // 0
```

### 手写题 2：实现简化版 useEffect

```js
/**
 * 简化版 useEffect 实现
 * 理解依赖比较和清理函数机制
 */
function createEffectSystem() {
  let prevDeps = undefined;
  let cleanup = undefined;

  /**
   * @param {Function} effect - 副作用函数，可返回清理函数
   * @param {Array|undefined} deps - 依赖数组
   */
  function useEffect(effect, deps) {
    // 1. 首次渲染：无 prevDeps
    if (prevDeps === undefined) {
      cleanup = effect();
      prevDeps = deps;
      return;
    }

    // 2. deps 为 undefined（无依赖数组）：每次都执行
    if (deps === undefined) {
      if (typeof cleanup === 'function') cleanup();
      cleanup = effect();
      return;
    }

    // 3. 依赖比较
    const hasChanged = deps.some((dep, i) => !Object.is(dep, prevDeps[i]));

    if (hasChanged) {
      // 4. 先执行旧清理，再执行新 effect
      if (typeof cleanup === 'function') cleanup();
      cleanup = effect();
      prevDeps = deps;
    }
    // 5. 依赖没变 → 跳过
  }

  return { useEffect };
}

// 测试用例
const { useEffect } = createEffectSystem();
let log = [];

// 首次渲染
useEffect(() => {
  log.push('effect run');
  return () => log.push('cleanup');
}, [1]);
console.log(log); // ['effect run']

// 依赖没变
useEffect(() => {
  log.push('effect run 2');
  return () => log.push('cleanup 2');
}, [1]);
console.log(log); // ['effect run'] — 跳过了

// 依赖变了
useEffect(() => {
  log.push('effect run 3');
  return () => log.push('cleanup 3');
}, [2]);
console.log(log); // ['effect run', 'cleanup', 'effect run 3']
```

---

## 💻 算法题

### 题 1：岛屿数量（#200）⭐

**思路**：BFS 或 DFS 遍历网格，遇到 '1' 就把整个岛标记为已访问（改为 '0'），岛屿数量 +1。

```js
/**
 * @param {character[][]} grid
 * @return {number}
 * 时间复杂度：O(m×n) 空间复杂度：O(min(m,n)) BFS 队列
 */
var numIslands = function(grid) {
  if (!grid.length) return 0;
  const rows = grid.length, cols = grid[0].length;
  let count = 0;

  const bfs = (r, c) => {
    const queue = [[r, c]];
    grid[r][c] = '0'; // 标记已访问
    while (queue.length) {
      const [cr, cc] = queue.shift();
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = cr + dr, nc = cc + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1') {
          grid[nr][nc] = '0';
          queue.push([nr, nc]);
        }
      }
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        bfs(r, c);
      }
    }
  }
  return count;
};

// 测试
console.log(numIslands([
  ['1','1','0','0','0'],
  ['1','1','0','0','0'],
  ['0','0','1','0','0'],
  ['0','0','0','1','1']
])); // 3
```

### 题 2：腐烂的橘子（#994）⭐

**思路**：多源 BFS。初始将所有腐烂橘子加入队列，每轮扩展一层（1分钟），统计新鲜橘子全部腐烂的最少时间。

```js
/**
 * @param {number[][]} grid
 * @return {number}
 * 时间复杂度：O(m×n) 空间复杂度：O(m×n)
 */
var orangesRotting = function(grid) {
  const rows = grid.length, cols = grid[0].length;
  const queue = [];
  let fresh = 0;

  // 1. 收集所有腐烂橘子和新鲜橘子数
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      if (grid[r][c] === 1) fresh++;
    }
  }

  if (fresh === 0) return 0;

  let minutes = 0;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  // 2. BFS 逐层扩展
  while (queue.length) {
    const size = queue.length;
    let rotted = false;
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          queue.push([nr, nc]);
          rotted = true;
        }
      }
    }
    if (rotted) minutes++;
  }

  // 3. 还有新鲜橘子？返回 -1
  return fresh === 0 ? minutes : -1;
};

console.log(orangesRotting([[2,1,1],[1,1,0],[0,1,1]])); // 4
console.log(orangesRotting([[2,1,1],[0,1,1],[1,0,1]])); // -1
```

### 题 3：课程表（#207）⭐

**思路**：拓扑排序（Kahn 算法）。检测有向图是否有环。

```js
/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 * 时间复杂度：O(V+E) 空间复杂度：O(V+E)
 */
var canFinish = function(numCourses, prerequisites) {
  const inDegree = new Array(numCourses).fill(0);
  const graph = Array.from({ length: numCourses }, () => []);

  // 1. 建图 + 统计入度
  for (const [course, pre] of prerequisites) {
    graph[pre].push(course);
    inDegree[course]++;
  }

  // 2. 入度为 0 的节点入队
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  // 3. BFS 拓扑排序
  let count = 0;
  while (queue.length) {
    const node = queue.shift();
    count++;
    for (const next of graph[node]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  // 4. 能完成所有课程 = 无环
  return count === numCourses;
};

console.log(canFinish(2, [[1,0]]));       // true
console.log(canFinish(2, [[1,0],[0,1]])); // false
```

### 解法对比

| 题目 | 解法 | 时间 | 空间 | 核心技巧 |
|------|------|------|------|---------|
| 岛屿数量 | BFS/DFS | O(mn) | O(mn) | 原地标记避免 visited 数组 |
| 腐烂的橘子 | 多源 BFS | O(mn) | O(mn) | 所有源同时入队，逐层扩展 |
| 课程表 | 拓扑排序 | O(V+E) | O(V+E) | 入度为 0 才能学习 |

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Fiber 架构 | 双缓冲 + 时间切片，让 diff 可中断 | ⭐⭐⭐⭐⭐ |
| 双缓冲 | current ↔ workInProgress 通过 alternate 互指 | ⭐⭐⭐⭐ |
| Lane 优先级 | 二进制位掩码，位越靠右优先级越高 | ⭐⭐⭐ |
| Hooks 链表 | 存在 Fiber.memoizedState 上，靠调用顺序匹配 | ⭐⭐⭐⭐⭐ |
| 条件 Hooks ❌ | 打破链表顺序，导致状态错乱 | ⭐⭐⭐⭐⭐ |
| useEffect 时机 | 绘制后异步执行，清理在重渲染前/卸载时 | ⭐⭐⭐⭐ |
| React 18 createRoot | 开启并发模式，自动批处理范围扩大 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 16）

明日主题：**React 18 新特性**

- 🔑 Concurrent Mode 深入原理
- 🔑 useTransition vs useDeferredValue 实战对比
- 🔑 实战：高性能搜索列表
- 💻 全排列、子集、电话号码字母组合（回溯法）
