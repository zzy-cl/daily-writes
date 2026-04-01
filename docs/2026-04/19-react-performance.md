# 04/19 — React 性能优化（Day 19）

> **阶段**：第三阶段 React 18+
> **今日目标**：掌握 React 性能优化三件套和代码分割方案，建立正确的优化心智模型
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：React 性能优化第一原则 ⭐⭐⭐⭐⭐

### 1.1 测量优先，不要猜测

🔑 **React 性能优化第一原则：先测量，再优化。没有测量的优化是盲目的。**

```jsx
// React DevTools Profiler 的使用方法
// 1. 打开 React DevTools → Profiler 标签
// 2. 点击录制 → 操作页面 → 停止录制
// 3. 查看 Flamegraph（哪些组件重渲染了、耗时多少）
// 4. 查看 Ranked（按渲染耗时排序）

// 在代码中标记需要分析的组件
function MyComponent() {
  // 使用 React Profiler API
  return (
    <Profiler id="MyComponent" onRender={(id, phase, actualDuration) => {
      console.log(`${id} ${phase}: ${actualDuration}ms`);
      // phase: 'mount' | 'update'
    }}>
      <ExpensiveChild />
    </Profiler>
  );
}
```

### 1.2 何时该优化

| 信号 | 需要优化？ | 说明 |
|------|-----------|------|
| Profiler 显示组件渲染 > 16ms | ✅ | 影响 60fps |
| 大列表滚动卡顿 | ✅ | 需要虚拟列表 |
| 频繁输入时 UI 延迟 | ✅ | 需要防抖/debounce/Transition |
| 普通组件偶尔重渲染 | ❌ | React diff 很快，不需要 |
| 小型表单组件 | ❌ | 过度优化得不偿失 |

---

## 知识点 2：React.memo ⭐⭐⭐

### 2.1 基本用法

`React.memo` 是一个高阶组件，对 props 进行浅比较，props 没变就跳过重渲染。

```jsx
// ❌ 每次父组件渲染，ExpensiveChild 都会重渲染
function ExpensiveChild({ name, age }) {
  console.log('ExpensiveChild 渲染'); // 每次都输出
  return <div>{name}, {age}</div>;
}

// ✅ 用 React.memo 包裹，props 不变就不重渲染
const ExpensiveChild = React.memo(function({ name, age }) {
  console.log('ExpensiveChild 渲染'); // 只在 props 变化时输出
  return <div>{name}, {age}</div>;
});

// 父组件
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveChild name="Penny" age={21} />
      {/* count 变化 → Parent 重渲染 → 但 ExpensiveChild props 没变 → 跳过 ✅ */}
    </div>
  );
}
```

### 2.2 自定义比较函数

```jsx
const UserCard = React.memo(
  function({ user, onSelect }) {
    console.log('UserCard 渲染:', user.name);
    return <div onClick={() => onSelect(user.id)}>{user.name}</div>;
  },
  // 自定义比较：只有 id 变化才重渲染
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### 2.3 ⚠️ React.memo 失效的常见原因

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新对象/函数 → memo 失效！
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child style={{ color: 'red' }} onClick={() => console.log('click')} />
    </div>
  );
}
```

---

## 知识点 3：useMemo & useCallback ⭐⭐⭐⭐

### 3.1 useMemo — 缓存计算结果

```jsx
function SearchList({ items, query }) {
  // ❌ 每次渲染都重新过滤，即使 items 和 query 没变
  // const filtered = items.filter(item => item.name.includes(query));

  // ✅ 只在 items 或 query 变化时重新计算
  const filtered = useMemo(() => {
    console.log('重新过滤');
    return items.filter(item => item.name.includes(query));
  }, [items, query]);

  return filtered.map(item => <div key={item.id}>{item.name}</div>);
}
```

### 3.2 useCallback — 缓存函数引用

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数 → memo 包的子组件也会重渲染
  // const handleClick = () => console.log('clicked');

  // ✅ 函数引用稳定 → memo 子组件不会白渲染
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // 依赖为空，函数永远不变

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedChild onClick={handleClick} />
    </div>
  );
}

const MemoizedChild = React.memo(function({ onClick }) {
  console.log('MemoizedChild 渲染'); // 不会因 count 变化而渲染
  return <button onClick={onClick}>Click me</button>;
});
```

### 3.3 什么时候该用？⭐

```text
useMemo 使用指南：

  计算量大（如大量数据排序/过滤） → useMemo ✅
  结果作为子组件 props          → useMemo ✅（避免子组件无意义重渲染）
  普通的简单计算               → ❌ 不需要（React diff 很快）
  纯粹为了"看起来优化"         → ❌ 不需要

useCallback 使用指南：

  回调传给 memo 包裹的子组件  → useCallback ✅
  回调作为 useEffect 依赖     → useCallback ✅（避免 effect 不必要地重执行）
  普通的事件处理函数           → ❌ 不需要
  没有 memo 子组件的场景       → ❌ 没意义
```

### 3.4 ⚠️ 过度优化的反模式

```jsx
// ❌ 过度优化：每个值都 memo，每个函数都 callback
function BadExample() {
  const a = 1;
  const b = 2;

  // ❌ 简单加法不需要 useMemo！
  const sum = useMemo(() => a + b, [a, b]);

  // ❌ 没有 memo 子组件接收这个函数，useCallback 没意义
  const handler = useCallback(() => {}, []);

  return <div>{sum}</div>;
}

// ✅ 正常写法就够了
function GoodExample() {
  const sum = 1 + 2;
  const handler = () => {};
  return <div>{sum}</div>;
}
```

---

## 知识点 4：代码分割 ⭐⭐⭐

### 4.1 React.lazy + Suspense

```jsx
import { Suspense, lazy } from 'react';

// ✅ 路由级代码分割：只在需要时下载
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

```text
代码分割前后对比：

分割前：app.js (2MB) — 用户首次访问下载全部
  └── 一次性下载所有页面代码

分割后：
  ├── app.js (200KB) — 公共代码
  ├── dashboard.js (300KB) — 按需加载
  ├── settings.js (150KB) — 按需加载
  └── profile.js (100KB) — 按需加载
```

### 4.2 预加载策略

```jsx
// 鼠标悬停时预加载（提升用户体验）
function NavLink({ to, children }) {
  const preload = () => {
    // 用户可能要去这个页面，提前加载
    if (to === '/dashboard') import('./pages/Dashboard');
    if (to === '/settings') import('./pages/Settings');
  };

  return (
    <Link to={to} onMouseEnter={preload} onFocus={preload}>
      {children}
    </Link>
  );
}
```

---

## 知识点 5：虚拟列表（Virtualization）⭐⭐⭐

### 5.1 为什么需要虚拟列表？

渲染 10000 个列表项 = 创建 10000 个 DOM 节点 → 巨大的内存和性能开销。虚拟列表只渲染**可见区域**的项目。

```text
普通列表（10000 项）：           虚拟列表：
┌──────────────────┐            ┌──────────────────┐
│  Item 1          │            │  Item 1          │ ← 渲染
│  Item 2          │            │  Item 2          │ ← 渲染
│  Item 3          │            │  Item 3          │ ← 渲染
│  ...             │  10000个   │  ...             │  只渲染 ~20 个
│  Item 9999       │  DOM 节点   │  (空白占位)       │  DOM 节点
│  Item 10000      │            │  Item 10000      │
└──────────────────┘            └──────────────────┘
```

### 5.2 react-window 基本用法

```jsx
import { FixedSizeList as List } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      {items[index].name}
    </div>
  );

  return (
    <List
      height={600}         // 可视区域高度
      itemCount={items.length}
      itemSize={50}        // 每项高度
      width="100%"
    >
      {Row}
    </List>
  );
}

// 10000 项 → 只创建 ~12-15 个 DOM 节点！
```

### 5.3 可变高度列表

```jsx
import { VariableSizeList } from 'react-window';

function VariableVirtualList({ items }) {
  // 每项高度不同
  const getItemSize = (index) => {
    return items[index].expanded ? 120 : 50;
  };

  const Row = ({ index, style }) => (
    <div style={style}>
      <h3>{items[index].title}</h3>
      {items[index].expanded && <p>{items[index].content}</p>}
    </div>
  );

  return (
    <VariableSizeList
      height={600}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

---

## 知识点 6：Hydration Mismatch ⭐⭐

### 6.1 什么是 Hydration

SSR 渲染出 HTML 后，React 需要在客户端"附加"事件处理器，这个过程叫 **hydration**。

```text
SSR 输出 HTML → 用户看到页面 → JS 加载完成 → hydration → 可交互
                                  ↑
                           如果 HTML 和 React 渲染结果不一致
                           → Hydration Mismatch 错误！
```

### 6.2 常见原因

```jsx
// ❌ 原因 1：服务端和客户端渲染结果不同
function BadComponent() {
  const date = new Date().toLocaleString(); // 服务端和客户端时间不同！
  return <div>{date}</div>;
}

// ✅ 修复：只在客户端渲染
function GoodComponent() {
  const [date, setDate] = useState('');
  useEffect(() => {
    setDate(new Date().toLocaleString()); // 只在客户端执行
  }, []);
  return <div>{date}</div>;
}

// ❌ 原因 2：随机数/UUID
function BadRandom() {
  return <div>{Math.random()}</div>; // 服务端和客户端随机数不同
}

// ❌ 原因 3：依赖 navigator/window
function BadBrowser() {
  return <div>{navigator.userAgent}</div>; // 服务端没有 navigator
}
```

---

## 🔧 手写题（2 道）

### 手写题 1：实现 React.memo

```js
/**
 * 手写 React.memo
 * @param {Function} Component - 原始组件
 * @param {Function} [compare] - 自定义比较函数
 * @returns {Function} 包裹后的组件
 */
function myMemo(Component, compare) {
  // 默认比较：浅比较 props
  const defaultCompare = (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(key =>
      Object.is(prevProps[key], nextProps[key])
    );
  };

  const areEqual = compare || defaultCompare;

  // 返回一个包装组件
  return function MemoizedComponent(props) {
    // 1. 用 ref 保存上次的 props
    const prevPropsRef = myUseRef(undefined);

    // 2. 比较 props
    if (prevPropsRef.current && areEqual(prevPropsRef.current, props)) {
      console.log('memo: props 没变，跳过渲染');
      // 实际 React 会返回上次的渲染结果
      return myMemoizedRef.current;
    }

    // 3. props 变了，更新 ref 并渲染
    prevPropsRef.current = props;
    const result = Component(props);
    myMemoizedRef.current = result;
    return result;
  };
}

// 模拟 useRef
function myUseRef(initial) {
  return { current: initial };
}
let myMemoizedRef = { current: null };

// 测试
const MyComponent = myMemo(function({ name, age }) {
  return `Name: ${name}, Age: ${age}`;
});

console.log(MyComponent({ name: 'Penny', age: 21 }));
// 'Name: Penny, Age: 21'
console.log(MyComponent({ name: 'Penny', age: 21 }));
// 'memo: props 没变，跳过渲染' + 'Name: Penny, Age: 21'
```

### 手写题 2：实现 useMemo

```js
/**
 * 手写 useMemo
 * 理解依赖比较 + 缓存机制
 */
let memoIndex = 0;
let memoHooks = [];

function myUseMemo(factory, deps) {
  const hook = memoHooks[memoIndex];

  if (hook) {
    // 1. 比较依赖
    const depsChanged = deps.some((dep, i) => !Object.is(dep, hook.deps[i]));

    if (!depsChanged) {
      // 2. 依赖没变，返回缓存值
      memoIndex++;
      return hook.value;
    }
  }

  // 3. 依赖变了（或首次），重新计算
  const value = factory();
  memoHooks[memoIndex] = { value, deps };
  memoIndex++;
  return value;
}

// 测试
let callCount = 0;

function expensiveCalc(a, b) {
  callCount++;
  return a + b;
}

memoIndex = 0;
const result1 = myUseMemo(() => expensiveCalc(1, 2), [1, 2]);
console.log(result1);      // 3
console.log(callCount);    // 1（计算了）

memoIndex = 0;
const result2 = myUseMemo(() => expensiveCalc(1, 2), [1, 2]);
console.log(result2);      // 3
console.log(callCount);    // 1（没重新计算！）

memoIndex = 0;
const result3 = myUseMemo(() => expensiveCalc(1, 3), [1, 3]);
console.log(result3);      // 4
console.log(callCount);    // 2（依赖变了，重新计算）
```

---

## 💻 算法题

### 题 1：跳跃游戏（#55）⭐

**思路**：贪心。维护能到达的最远位置，遍历时不断更新。

```js
/**
 * @param {number[]} nums
 * @return {boolean}
 * 时间复杂度：O(n) 空间复杂度：O(1)
 */
var canJump = function(nums) {
  let maxReach = 0;

  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false; // 位置 i 无法到达
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true; // 已能到达终点
  }

  return true;
};

console.log(canJump([2,3,1,1,4])); // true
console.log(canJump([3,2,1,0,4])); // false
```

### 题 2：跳跃游戏 II（#45）⭐

**思路**：贪心 BFS。每一步维护当前步能到的最远边界，到边界时步数 +1。

```js
/**
 * @param {number[]} nums
 * @return {number}
 * 时间复杂度：O(n) 空间复杂度：O(1)
 */
var jump = function(nums) {
  let jumps = 0;
  let currentEnd = 0;  // 当前步能到的最远位置
  let farthest = 0;    // 全局最远位置

  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);

    // 到达当前步的边界，必须跳一步
    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;
    }
  }

  return jumps;
};

console.log(jump([2,3,1,1,4])); // 2 (跳 1 步到 1，再跳 1 步到终点)
console.log(jump([2,3,0,1,4])); // 2
```

### 题 3：划分字母区间（#763）⭐

**思路**：贪心。先记录每个字母最后出现的位置，遍历时不断扩展当前区间的右边界。

```js
/**
 * @param {string} s
 * @return {number[]}
 * 时间复杂度：O(n) 空间复杂度：O(1)（最多 26 个字母）
 */
var partitionLabels = function(s) {
  // 1. 记录每个字母最后出现的位置
  const last = {};
  for (let i = 0; i < s.length; i++) {
    last[s[i]] = i;
  }

  const result = [];
  let start = 0, end = 0;

  // 2. 贪心扩展右边界
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s[i]]);

    // 3. 到达右边界，切分
    if (i === end) {
      result.push(end - start + 1);
      start = i + 1;
    }
  }

  return result;
};

console.log(partitionLabels('ababcbacadefegdehijhklij'));
// [9,7,8] → "ababcbaca", "defegde", "hijhklij"
console.log(partitionLabels('eccbbbbdec'));
// [10]
```

### 解法对比

| 题目 | 策略 | 核心变量 | 时间 | 空间 |
|------|------|---------|------|------|
| 跳跃游戏 | 贪心 | maxReach（最远可达） | O(n) | O(1) |
| 跳跃游戏 II | 贪心 BFS | currentEnd（当前步边界） | O(n) | O(1) |
| 划分字母区间 | 贪心区间 | last[char]（最后位置） | O(n) | O(1) |

🔑 **贪心算法关键**：每步做局部最优选择，需要证明局部最优能导致全局最优。

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| 性能优化第一原则 | 先用 Profiler 测量，再针对性优化 | ⭐⭐⭐⭐⭐ |
| React.memo | 浅比较 props，不变则跳过重渲染 | ⭐⭐⭐⭐⭐ |
| useMemo | 缓存计算结果，大计算 + 稳定 props 引用时用 | ⭐⭐⭐⭐⭐ |
| useCallback | 缓存函数引用，配合 memo 子组件使用 | ⭐⭐⭐⭐⭐ |
| 过度优化 | 没有 memo 子组件时 useCallback 无意义 | ⭐⭐⭐⭐ |
| 代码分割 | React.lazy + Suspense，路由级按需加载 | ⭐⭐⭐⭐ |
| 虚拟列表 | 只渲染可见区域，10000 项只需 ~15 DOM 节点 | ⭐⭐⭐ |
| Hydration Mismatch | SSR HTML 和客户端渲染结果不一致 | ⭐⭐⭐⭐ |
| 贪心算法 | 局部最优 → 全局最优，关键证明贪心策略正确 | ⭐⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 20）

明日主题：**Next.js 与元框架 + 系统设计**

- 🔑 Next.js App Router vs Pages Router
- 🔑 Server Actions 改变 API 调用方式
- 🔑 系统设计：权限管理系统（RBAC vs ABAC）
- 💻 爬楼梯、杨辉三角、打家劫舍（动态规划）
