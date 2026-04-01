# 04/16 — React 18 新特性（Day 16）

> **阶段**：第三阶段 React 18+
> **今日目标**：掌握 React 18 Concurrent 特性，实现非阻塞 UI 更新
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：Concurrent Mode 核心概念 ⭐⭐⭐

### 1.1 什么是 Concurrent Mode

Concurrent Mode 不是一个 API，而是 React 18 底层的一种**渲染能力**。它让 React 能够：
- 同时准备多个版本的 UI
- 在渲染过程中暂停和恢复工作
- 根据优先级调度更新

```text
同步渲染（React 17）：
用户输入 ──[阻塞 200ms]──→ UI 更新 → 渲染结果
                ↑
           用户感觉卡顿 ❌

并发渲染（React 18）：
用户输入 → 立即响应 ✅
  └── 后台准备新 UI（可中断）
  └── 准备好了再切换到新 UI
```

### 1.2 更新优先级分类

React 18 将更新分为两类：

| 类型 | 触发方式 | 优先级 | 行为 |
|------|---------|--------|------|
| 紧急更新 | 用户输入（打字、点击） | 高 | 立即响应，不可被打断 |
| 过渡更新 | 由 `startTransition` 标记 | 低 | 可被打断，后台渲染 |

```jsx
import { useState, startTransition } from 'react';

function SearchList() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setQuery(e.target.value); // 紧急更新：输入框立即响应

    startTransition(() => {
      setResults(filterItems(e.target.value)); // 过渡更新：搜索结果可延迟
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {results.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

---

## 知识点 2：useTransition vs useDeferredValue ⭐⭐⭐

### 2.1 useTransition

🔑 `useTransition` 用于将某些状态更新标记为**过渡更新**（低优先级）。

```jsx
import { useTransition, useState } from 'react';

function App() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState('home');

  function selectTab(nextTab) {
    // 1. 紧急更新：立即切换 tab 按钮的 active 状态
    startTransition(() => {
      // 2. 过渡更新：tab 内容渲染可被打断
      setTab(nextTab);
    });
  }

  return (
    <div>
      <TabButton onClick={() => selectTab('home')}>Home</TabButton>
      <TabButton onClick={() => selectTab('posts')}>Posts</TabButton>
      {isPending && <Spinner />} {/* 过渡期间显示加载指示 */}
      <TabContent tab={tab} />
    </div>
  );
}
```

### 2.2 useDeferredValue

🔑 `useDeferredValue` 创建一个**延迟版本的值**，让紧急更新先完成。

```jsx
import { useDeferredValue, useState, useMemo } from 'react';

function SearchResults({ query }) {
  // query 是父组件传入的快速变化的值
  const deferredQuery = useDeferredValue(query);

  // useMemo 确保只在 deferredQuery 变化时重新计算
  const results = useMemo(() => {
    return filterItems(deferredQuery);
  }, [deferredQuery]);

  const isStale = query !== deferredQuery; // 判断是否显示旧数据

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      {results.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <SearchResults query={query} />
    </div>
  );
}
```

### 2.3 对比总结 ⭐

| 特性 | useTransition | useDeferredValue |
|------|--------------|-----------------|
| 使用场景 | **控制整个状态更新**的优先级 | **延迟某个值**的更新 |
| 返回值 | `[isPending, startTransition]` | 延迟后的值 |
| 谁在控制 | 你主动包裹更新 | 被动接收，自动延迟 |
| 典型场景 | Tab 切换、页面导航 | 搜索框防抖、列表筛选 |
| 是否需要修改父组件 | ✅ 父组件用 startTransition | ❌ 不需要改父组件 |

```text
选择指南：

  需要降低某个 setState 的优先级？
  ├── 你有这个 setState 的调用权 → useTransition
  └── 你只接收一个 props 值，想让它慢一点更新 → useDeferredValue
```

---

## 知识点 3：React 18 自动批处理 ⭐⭐

### 3.1 React 17 vs React 18 批处理

```jsx
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    // 两次 setState，React 只触发一次渲染 ✅
    setCount(c => c + 1);
    setFlag(f => !f);
    console.log('点击后立即读 count:', count); // 还是旧值 ⚠️
  }

  // 在 setTimeout / Promise 中：
  function handleAsync() {
    setTimeout(() => {
      setCount(c => c + 1);
      setFlag(f => !f);
      // React 17：渲染 2 次 ❌
      // React 18：渲染 1 次 ✅ 自动批处理！
    }, 100);
  }

  return (
    <div>
      <p>Count: {count}, Flag: {String(flag)}</p>
      <button onClick={handleClick}>同步更新</button>
      <button onClick={handleAsync}>异步更新</button>
    </div>
  );
}
```

| 场景 | React 17 | React 18 |
|------|----------|----------|
| 合成事件（onClick） | ✅ 批处理 | ✅ 批处理 |
| setTimeout / Promise | ❌ 渲染 2 次 | ✅ 批处理 |
| 原生事件回调 | ❌ 渲染 2 次 | ✅ 批处理 |

### 3.2 ⚠️ flushSync 强制同步

如果确实需要立即渲染，用 `flushSync`：

```jsx
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(c => c + 1);
  });
  console.log('flushSync 后 count 已更新'); // ✅ 能拿到新值
}
```

---

## 知识点 4：Suspense 基础 ⭐⭐

### 4.1 Suspense 概念

`Suspense` 让组件在等待异步数据时显示 fallback UI。

```jsx
import { Suspense, lazy } from 'react';

// 懒加载组件
const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 4.2 Suspense + 数据获取（配合 React Query）

```jsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/user/${userId}`).then(r => r.json()),
  });

  return <div>{data.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

### 4.3 Suspense 边界错误处理

```jsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>出错了！</div>}>
      <Suspense fallback={<div>加载中...</div>}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 实战：高性能搜索列表

```jsx
import { useState, useDeferredValue, useMemo } from 'react';

// 模拟大量数据
const ITEMS = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  category: ['A', 'B', 'C'][i % 3],
}));

function SearchList() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // 🔑 过滤操作在 deferredQuery 变化时执行，不阻塞输入
  const filtered = useMemo(() => {
    console.log('过滤执行，query:', deferredQuery);
    return ITEMS.filter(item =>
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [deferredQuery]);

  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        {filtered.slice(0, 50).map(item => (
          <div key={item.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            {item.name} ({item.category})
          </div>
        ))}
        <p>显示 {Math.min(50, filtered.length)} / {filtered.length} 条</p>
      </div>
    </div>
  );
}

export default SearchList;
```

**性能分析**：
- 输入时不触发过滤计算（deferredValue 延迟）
- 输入框永远流畅
- 过滤结果稍有延迟但用户无感知（opacity 过渡平滑）

---

## 🔧 手写题（2 道）

### 手写题 1：模拟 startTransition

```js
/**
 * 模拟 startTransition 的核心逻辑
 * 将回调中的状态更新标记为低优先级
 */
function mockStartTransition(callback) {
  // 1. 保存当前调度优先级
  const prevTransition = globalThis.__ReactTransition;

  // 2. 标记进入过渡模式
  globalThis.__ReactTransition = true;

  try {
    // 3. 执行回调（内部的 setState 会被标记为低优先级）
    callback();
  } finally {
    // 4. 恢复之前的优先级
    globalThis.__ReactTransition = prevTransition;
  }

  // 5. 如果有更高优先级的更新在等待，先处理它们
  // 6. 过渡更新在空闲时间处理
  if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      // 处理低优先级更新
      console.log('过渡更新执行（低优先级）');
    };
    channel.port2.postMessage(null);
  }
}

// 测试
console.log('开始');
mockStartTransition(() => {
  console.log('过渡回调执行');
  // 内部 setState 被标记为低优先级
});
console.log('同步代码继续执行');
// 输出顺序：开始 → 过渡回调执行 → 同步代码继续执行 → 过渡更新执行
```

### 手写题 2：实现防抖 hook 逻辑（useDeferredValue 原理）

```js
/**
 * 模拟 useDeferredValue 的防抖逻辑
 * 立即返回新值，但延迟触发依赖该值的计算
 */
function createDeferredValue(delay = 150) {
  let deferredValue = undefined;
  let timer = null;

  /**
   * @param {*} value - 快速变化的值
   * @returns {*} 延迟更新的值
   */
  function useDeferredValue(value) {
    // 立即更新 deferredValue 会导致重渲染
    // 真正的 React 是在调度层面控制，这里用 setTimeout 模拟
    if (deferredValue === undefined) {
      deferredValue = value;
    }

    // 清除旧定时器
    if (timer) clearTimeout(timer);

    // 延迟更新
    timer = setTimeout(() => {
      deferredValue = value;
      console.log('deferredValue 更新为:', value);
    }, delay);

    return deferredValue;
  }

  return useDeferredValue;
}

// 测试
const useDeferredValue = createDeferredValue(100);
let result;

result = useDeferredValue('a');
console.log('立即返回:', result); // 'a'

result = useDeferredValue('ab');
console.log('立即返回:', result); // 'a'（还是旧值）

result = useDeferredValue('abc');
console.log('立即返回:', result); // 'a'（还是旧值）
// 100ms 后 deferredValue 变成 'abc'
```

---

## 💻 算法题

### 题 1：全排列（#46）⭐

**思路**：回溯法。每次从剩余数字中选一个加入路径，递归完成后回溯撤销选择。

```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 * 时间复杂度：O(n!×n) 空间复杂度：O(n)
 */
var permute = function(nums) {
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);

  const backtrack = () => {
    // 终止条件：路径长度等于数组长度
    if (path.length === nums.length) {
      result.push([...path]); // ⚠️ 必须拷贝！
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // 跳过已使用
      path.push(nums[i]);
      used[i] = true;
      backtrack();
      path.pop();      // 回溯
      used[i] = false; // 回溯
    }
  };

  backtrack();
  return result;
};

console.log(permute([1,2,3]));
// [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

### 题 2：子集（#78）⭐

**思路**：每个元素有两种选择（选/不选），回溯生成所有组合。

```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 * 时间复杂度：O(n×2^n) 空间复杂度：O(n)
 */
var subsets = function(nums) {
  const result = [];

  const backtrack = (start, path) => {
    result.push([...path]); // 每个路径都是一个子集

    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  };

  backtrack(0, []);
  return result;
};

console.log(subsets([1,2,3]));
// [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]
```

### 题 3：电话号码的字母组合（#17）

**思路**：回溯遍历每个数字对应的字母组合。

```js
/**
 * @param {string} digits
 * @return {string[]}
 * 时间复杂度：O(4^n × n) 空间复杂度：O(n)
 */
var letterCombinations = function(digits) {
  if (!digits.length) return [];

  const map = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };

  const result = [];

  const backtrack = (index, path) => {
    if (index === digits.length) {
      result.push(path);
      return;
    }
    const letters = map[digits[index]];
    for (const ch of letters) {
      backtrack(index + 1, path + ch);
    }
  };

  backtrack(0, '');
  return result;
};

console.log(letterCombinations('23'));
// ['ad','ae','af','bd','be','bf','cd','ce','cf']
```

### 解法对比

| 题目 | 回溯模板 | 关键去重 | 时间复杂度 |
|------|---------|---------|-----------|
| 全排列 | 选一个 → 标记 → 递归 → 回溯 | used 数组 | O(n!×n) |
| 子集 | 从 start 开始遍历 | start 索引 | O(n×2^n) |
| 电话组合 | 逐层对应数字的字母 | 无需去重 | O(4^n×n) |

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Concurrent Mode | 渲染可中断，让高优先级更新先执行 | ⭐⭐⭐⭐⭐ |
| useTransition | 主动标记过渡更新，返回 isPending | ⭐⭐⭐⭐⭐ |
| useDeferredValue | 被动延迟值，适合不改父组件的场景 | ⭐⭐⭐⭐ |
| 自动批处理 | React 18 中 setTimeout/Promise 也批处理 | ⭐⭐⭐⭐ |
| Suspense | 异步边界，显示 fallback UI | ⭐⭐⭐⭐ |
| 回溯法 | 选择 → 递归 → 撤销，三步走 | ⭐⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 17）

明日主题：**React Server Components + AI Agent 入门**

- 🔑 RSC 服务端组件 vs 客户端组件边界
- 🔑 流式渲染（Streaming SSR）
- 🔑 AI Agent 架构：LLM + Tools + Memory
- 💻 组合总和、分割回文串、N 皇后（回溯进阶）
