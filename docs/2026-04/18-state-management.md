# 04/18 — 状态管理与数据获取（Day 18）

> **阶段**：第三阶段 React 18+
> **今日目标**：掌握主流状态管理方案（Redux Toolkit / Zustand）和数据获取框架（TanStack Query）
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：Redux Toolkit（RTK）⭐⭐⭐

### 1.1 为什么需要状态管理？

React 有三种数据流：本地状态（useState）、提升状态（lift up）、全局状态（Context/库）。

```text
状态管理选择指南：

  数据只在一个组件用？ → useState ✅
  父子组件共享？       → props 传递 / 提升状态 ✅
  跨多层组件共享？     → Context ✅（简单场景）
  复杂全局状态？       → Redux Toolkit / Zustand ✅
  服务端数据缓存？     → TanStack Query ✅
```

### 1.2 Redux Toolkit 核心概念

🔑 Redux Toolkit 是 Redux 官方推荐的编写 Redux 逻辑的方式，内置 Immer（不可变更新）、Redux Thunk、DevTools。

```js
// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
});
// configureStore 自动：
// - 组合多个 slice reducer
// - 添加 redux-thunk 中间件
// - 启用 Redux DevTools
```

### 1.3 createSlice ⭐

```js
// store/counterSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步 thunk
export const fetchCount = createAsyncThunk(
  'counter/fetchCount',
  async (amount) => {
    const response = await fetch('/api/count', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return response.json(); // 返回值自动 dispatch fulfilled action
  }
);

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: 0,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  },
  reducers: {
    // ✅ 可以直接写"mutation"代码！Immer 会处理不可变更新
    increment: (state) => {
      state.value += 1; // 看起来是 mutation，实际是不可变更新
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCount.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCount.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.value += action.payload.amount;
      })
      .addCase(fetchCount.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

### 1.4 在 React 中使用

```jsx
// App.jsx
import { Provider } from 'react-redux';
import { store } from './store/store';
import Counter from './Counter';

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}

// Counter.jsx
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, fetchCount } from './store/counterSlice';

function Counter() {
  const count = useSelector((state) => state.counter.value);
  const status = useSelector((state) => state.counter.status);
  const dispatch = useDispatch();

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(fetchCount(5))} disabled={status === 'loading'}>
        {status === 'loading' ? '加载中...' : '异步 +5'}
      </button>
    </div>
  );
}
```

### 1.5 ⚠️ Immer 注意事项

```js
// ❌ 错误：不能同时使用 mutation 和 return
increment: (state) => {
  state.value += 1;
  return state; // ⚠️ Immer 不允许！用了 mutation 就不能 return
}

// ✅ 正确：要么 mutation
increment: (state) => {
  state.value += 1;
}

// ✅ 正确：要么 return 新对象（不用 Immer）
increment: (state) => {
  return { ...state, value: state.value + 1 };
}
```

---

## 知识点 2：Zustand 入门 ⭐⭐⭐

### 2.1 为什么 Zustand 比 Redux 轻量？

| 对比 | Redux Toolkit | Zustand |
|------|--------------|---------|
| 样板代码 | 较多（slice、reducer、action） | 极简（一个 create） |
| 包大小 | ~11KB (minified) | ~1KB (minified) |
| Provider | 需要 `<Provider>` | 不需要 Provider ✅ |
| 中间件 | 内置 thunk | 按需组合 middleware |
| 学习曲线 | 较陡 | 很平缓 |
| DevTools | 内置 | 可选 `devtools` 中间件 |
| 适用场景 | 大型复杂应用 | 中小型应用、快速原型 |

### 2.2 Zustand 基本用法

```js
// store/useStore.js
import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // 状态
  count: 0,
  user: null,

  // 操作（直接写函数）
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),

  // 异步操作
  fetchUser: async (id) => {
    const res = await fetch(`/api/user/${id}`);
    const user = await res.json();
    set({ user });
  },

  // 读取当前状态
  doubleCount: () => get().count * 2,
}));
```

```jsx
// Counter.jsx — 不需要 Provider！
import { useStore } from './store/useStore';

function Counter() {
  // 只订阅 count，其他状态变化不会触发重渲染
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

### 2.3 Zustand 中间件

```js
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export const useStore = create(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        setTheme: (theme) => set({ theme }),
      }),
      { name: 'app-storage' } // localStorage key
    )
  )
);
```

---

## 知识点 3：TanStack Query（React Query）⭐⭐⭐⭐

### 3.1 为什么需要 TanStack Query？

🔑 TanStack Query 解决的不是"全局状态"，而是**服务端状态**——从 API 获取的数据。这些数据有独特特征：可能过时、需要重新获取、有加载/错误状态。

```text
客户端状态 vs 服务端状态：

客户端状态（Redux/Zustand）：
  - 你自己控制数据
  - 不会自己变化
  - 不需要同步

服务端状态（TanStack Query）：
  - 别人可能修改了数据 ⚠️
  - 需要定期刷新
  - 需要缓存、去重、乐观更新、后台同步
```

### 3.2 核心 API

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// —— 查询数据 ——
function UserList() {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['users'],          // 缓存 key
    queryFn: () => fetch('/api/users').then(r => r.json()),
    staleTime: 5 * 60 * 1000,    // 5 分钟内认为数据新鲜
    cacheTime: 10 * 60 * 1000,   // 10 分钟后清除缓存
    refetchOnWindowFocus: true,   // 窗口聚焦时自动刷新
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {isFetching && <div>后台刷新中...</div>}
      {data.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}

// —— 修改数据 ——
function CreateUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser) =>
      fetch('/api/users', { method: 'POST', body: JSON.stringify(newUser) }),
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <button onClick={() => mutation.mutate({ name: 'Penny' })} disabled={mutation.isPending}>
      {mutation.isPending ? '创建中...' : '创建用户'}
    </button>
  );
}
```

### 3.3 缓存策略 ⭐

```text
TanStack Query 数据生命周期：

fetch (获取数据)
    │
    ▼
fresh（新鲜）── staleTime ──→ stale（过时但可用）
                                  │
                                  ├── 窗口聚焦 → 自动 refetch ✅
                                  ├── queryKey 变化 → 自动 refetch ✅
                                  └── 手动 invalidateQueries → 立即 refetch ✅

stale ── cacheTime ──→ 垃圾回收（从缓存删除）
```

| 参数 | 作用 | 默认值 |
|------|------|--------|
| `staleTime` | 数据被视为新鲜的时间 | 0（立即过时） |
| `cacheTime` | 未使用数据在缓存中保留的时间 | 5 分钟 |
| `refetchOnWindowFocus` | 窗口聚焦时重新获取 | true |
| `refetchOnMount` | 组件挂载时重新获取 | true（当数据 stale） |
| `refetchInterval` | 轮询间隔 | false（不轮询） |

### 3.4 乐观更新（Optimistic Updates）

```jsx
function TodoList() {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (todo) => fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: !todo.done }),
    }),

    // 乐观更新：在 API 响应前就更新 UI
    onMutate: async (todo) => {
      // 1. 取消正在进行的 refetch（避免覆盖乐观数据）
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // 2. 保存当前数据（用于回滚）
      const previous = queryClient.getQueryData(['todos']);

      // 3. 乐观更新缓存
      queryClient.setQueryData(['todos'], (old) =>
        old.map(t => t.id === todo.id ? { ...t, done: !t.done } : t)
      );

      return { previous }; // 传给 onError 用于回滚
    },

    // 失败时回滚
    onError: (err, todo, context) => {
      queryClient.setQueryData(['todos'], context.previous);
    },

    // 无论成功失败，最终都同步
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // ...渲染 todo 列表
}
```

---

## 🔧 手写题（2 道）

### 手写题 1：实现简化版 Zustand

```js
/**
 * 简化版 Zustand 实现
 * 理解：无 Provider、选择器订阅、精确重渲染
 */
function createStore(initializer) {
  let state;
  const listeners = new Set();

  // 1. 初始化状态
  const setState = (partial) => {
    const newState = typeof partial === 'function' ? partial(state) : partial;
    if (newState !== state) {
      state = { ...state, ...newState };
      // 2. 通知所有订阅者
      listeners.forEach((listener) => listener(state));
    }
  };

  const getState = () => state;

  // 3. 创建 store API
  const api = { setState, getState, subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } };
  state = initializer(setState, getState);

  // 4. 返回 hook
  function useStore(selector = (s) => s) {
    // 简化版：实际 React 版用 useSyncExternalStore
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const selectedRef = React.useRef(selector(state));

    React.useEffect(() => {
      const unsubscribe = api.subscribe((newState) => {
        const newSelected = selector(newState);
        // 5. 浅比较，值没变就不重渲染
        if (!shallowEqual(newSelected, selectedRef.current)) {
          selectedRef.current = newSelected;
          forceUpdate();
        }
      });
      return unsubscribe;
    }, []);

    return selectedRef.current;
  }

  // 把 API 挂到 hook 上（Zustand 的用法）
  Object.assign(useStore, api);
  return useStore;
}

function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => Object.is(a[key], b[key]));
}

// 测试
const useCounterStore = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

console.log(useCounterStore.getState()); // { count: 0, increment: [Function] }
useCounterStore.getState().increment();
console.log(useCounterStore.getState()); // { count: 1, increment: [Function] }
```

### 手写题 2：实现简化版 useQuery

```js
/**
 * 简化版 TanStack Query 的 useQuery
 * 理解：缓存、stale 策略、自动重获取
 */
function createQueryClient() {
  const cache = new Map(); // queryKey → { data, dataUpdatedAt, staleTime }
  const subscribers = new Map(); // queryKey → Set<callback>

  function getQueryKey(key) {
    return JSON.stringify(key);
  }

  return {
    /**
     * @param {Object} options
     * @param {Array} options.queryKey - 缓存 key
     * @param {Function} options.queryFn - 数据获取函数
     * @param {number} options.staleTime - 新鲜时间（ms）
     */
    useQuery({ queryKey, queryFn, staleTime = 0 }) {
      const key = getQueryKey(queryKey);
      const cached = cache.get(key);
      const now = Date.now();

      // 1. 判断缓存是否新鲜
      const isStale = !cached || (now - cached.dataUpdatedAt > staleTime);

      // 2. 简化版：同步返回缓存，标记是否需要重获取
      if (cached && !isStale) {
        return { data: cached.data, isLoading: false, isFetching: false, isStale: false };
      }

      // 3. 需要获取数据
      if (isStale) {
        // 异步获取（简化版用 Promise）
        queryFn().then((data) => {
          cache.set(key, { data, dataUpdatedAt: Date.now(), staleTime });
          // 通知订阅者
          const subs = subscribers.get(key);
          if (subs) subs.forEach(fn => fn(data));
        });
      }

      return {
        data: cached?.data ?? null,
        isLoading: !cached,
        isFetching: true,
        isStale,
      };
    },

    // 手动使缓存失效
    invalidateQueries(queryKey) {
      const key = getQueryKey(queryKey);
      cache.delete(key);
    },

    // 设置缓存数据
    setQueryData(queryKey, data) {
      const key = getQueryKey(queryKey);
      cache.set(key, { data, dataUpdatedAt: Date.now(), staleTime: 0 });
    },
  };
}

// 测试
const queryClient = createQueryClient();

// 模拟首次查询
const result1 = queryClient.useQuery({
  queryKey: ['users'],
  queryFn: async () => [{ id: 1, name: 'Penny' }],
  staleTime: 5000,
});
console.log(result1); // { data: null, isLoading: true, isFetching: true, isStale: true }

// 等获取完成
setTimeout(() => {
  const result2 = queryClient.useQuery({
    queryKey: ['users'],
    queryFn: async () => [{ id: 1, name: 'Penny' }],
    staleTime: 5000,
  });
  console.log(result2); // { data: [{ id: 1, name: 'Penny' }], isLoading: false, isFetching: false, isStale: false }
}, 100);
```

---

## 💻 算法题

### 题 1：求开方（#69）⭐

**思路**：二分查找。在 [0, x] 范围内找到最大的 mid 使得 mid² ≤ x。

```js
/**
 * @param {number} x
 * @return {number}
 * 时间复杂度：O(log x) 空间复杂度：O(1)
 */
var mySqrt = function(x) {
  let left = 0, right = x;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const sq = mid * mid;

    if (sq === x) return mid;
    if (sq < x) left = mid + 1;
    else right = mid - 1;
  }

  return right; // right 是最大的满足 mid² ≤ x 的值
};

console.log(mySqrt(4));  // 2
console.log(mySqrt(8));  // 2 (2²=4 ≤ 8 < 9=3²)
console.log(mySqrt(0));  // 0
console.log(mySqrt(1));  // 1
```

### 题 2：分割数组的最大值（#410）⭐

**思路**：二分答案。在 [max(nums), sum(nums)] 之间二分搜索最小的最大子数组和。

```js
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 * 时间复杂度：O(n × log(sum-max)) 空间复杂度：O(1)
 */
var splitArray = function(nums, k) {
  // 1. 确定二分范围
  let left = Math.max(...nums);  // 至少要能放下最大元素
  let right = nums.reduce((a, b) => a + b, 0); // 最多不分割

  // 2. 判断：以 maxSum 为上限，能否分成 ≤ k 段
  const canSplit = (maxSum) => {
    let count = 1, currentSum = 0;
    for (const num of nums) {
      if (currentSum + num > maxSum) {
        count++;
        currentSum = num;
        if (count > k) return false;
      } else {
        currentSum += num;
      }
    }
    return true;
  };

  // 3. 二分查找最小的满足条件的 maxSum
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (canSplit(mid)) {
      right = mid;    // 可以分，尝试更小
    } else {
      left = mid + 1; // 不可以分，增大
    }
  }

  return left;
};

console.log(splitArray([7,2,5,10,8], 2)); // 18
console.log(splitArray([1,2,3,4,5], 2));   // 9
```

### 解法对比

| 题目 | 二分类型 | 搜索范围 | 判断条件 | 时间复杂度 |
|------|---------|---------|---------|-----------|
| 求开方 | 搜索值 | [0, x] | mid² ≤ x | O(log x) |
| 分割数组最大值 | 二分答案 | [max, sum] | 能否分 ≤ k 段 | O(n·log(sum)) |

🔑 **二分答案**技巧：当直接求解困难，但**验证答案正确性容易**时，对答案进行二分搜索。

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Redux Toolkit | createSlice + Immer + configureStore 一站式方案 | ⭐⭐⭐⭐ |
| Immer 注意 | mutation 和 return 不能同时使用 | ⭐⭐⭐ |
| Zustand | 无 Provider、~1KB、选择器订阅精确重渲染 | ⭐⭐⭐⭐ |
| TanStack Query | 服务端状态管理，缓存 + stale + 自动重获取 | ⭐⭐⭐⭐⭐ |
| 缓存生命周期 | fresh → stale → 垃圾回收 | ⭐⭐⭐⭐ |
| 乐观更新 | onMutate 乐观更新 → onError 回滚 → onSettled 同步 | ⭐⭐⭐⭐ |
| 二分答案 | 验证容易、求解困难时，对答案二分 | ⭐⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 19）

明日主题：**React 性能优化**

- 🔑 React.memo / useMemo / useCallback 正确用法
- 🔑 避免过度优化的原则
- 🔑 代码分割 & 虚拟列表
- 💻 跳跃游戏、跳跃游戏 II、划分字母区间（贪心算法）
