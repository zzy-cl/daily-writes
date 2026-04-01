# 04/26 — 微前端与架构设计（Day 26）

> **阶段**：第四阶段 工程化 + 冲刺
> **今日目标**：掌握微前端方案和架构设计思路，能回答大型项目组件体系设计题
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：微前端方案 ⭐

### 1.1 微前端解决什么问题？

🔑 **核心：将一个大型前端应用拆分为多个独立开发、独立部署的子应用**

```
单体应用痛点：
❌ 团队间代码冲突频繁
❌ 技术栈被绑定（全部 React 或全部 Vue）
❌ 构建部署耦合（改一个小功能全部重新构建）
❌ 代码量巨大，新人上手困难

微前端解决：
✅ 独立开发、独立部署
✅ 技术栈无关（React + Vue + Angular 可共存）
✅ 增量升级（逐步替换旧模块）
✅ 团队自治
```

### 1.2 三大方案对比

| 维度 | qiankun | Micro-App | Module Federation |
|------|---------|-----------|-------------------|
| **原理** | single-spa + Proxy 沙箱 | Web Component + 沙箱 | Webpack 5 模块共享 |
| **JS 沙箱** | ✅ Proxy 沙箱 | ✅ iframe/with 沙箱 | ❌ 无沙箱 |
| **CSS 隔离** | Shadow DOM / scoped | Shadow DOM | 手动处理 |
| **接入成本** | 中等 | 低（类组件使用） | 较高（需改造 Webpack） |
| **通信机制** | `initGlobalState` | data 属性 / 事件 | 共享模块 |
| **技术栈无关** | ✅ | ✅ | ✅（需统一打包工具） |
| **适用场景** | 中大型项目 | 中小型项目 ⭐ | 微前端 + 共享组件 |

### 1.3 qiankun 核心原理

```
┌──────────────────────────────────────────┐
│              主应用 (Main App)            │
│  ┌────────────┐  ┌───────────────────┐   │
│  │  路由分发   │  │  JS/CSS 沙箱管理   │   │
│  └─────┬──────┘  └────────┬──────────┘   │
│        │                   │              │
│   ┌────┴────┐         ┌───┴────┐         │
│   ▼         ▼         ▼        ▼         │
│ ┌─────┐  ┌─────┐  ┌──────┐  ┌──────┐    │
│ │Vue子 │  │React│  │Angular│ │ legacy│    │
│ │应用1 │  │子应用│  │ 子应用 │ │ 子应用 │    │
│ └─────┘  └─────┘  └──────┘  └──────┘    │
└──────────────────────────────────────────┘
```

```js
// 主应用 — registerMicroApps 注册子应用
import { registerMicroApps, start, initGlobalState } from 'qiankun';

// 1. 全局状态
const actions = initGlobalState({
  user: { name: 'Orion', role: 'admin' },
});

// 2. 注册子应用
registerMicroApps([
  {
    name: 'vue-app',
    entry: '//localhost:7100',
    container: '#sub-app',
    activeRule: '/vue',
  },
  {
    name: 'react-app',
    entry: '//localhost:7200',
    container: '#sub-app',
    activeRule: '/react',
  },
]);

// 3. 监听全局状态变化
actions.onGlobalStateChange((state, prev) => {
  console.log('State changed:', state);
}, true);

// 4. 启动
start({
  sandbox: { strictStyleIsolation: true }, // CSS 隔离
  prefetch: 'all', // 预加载所有子应用资源
});
```

```js
// 子应用 — Vue 示例
// main.js
let instance = null;

function render(props = {}) {
  const { container } = props;
  instance = new Vue({
    router,
    store,
    render: h => h(App),
  }).mount(container ? container.querySelector('#app') : '#app');
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// 导出 qiankun 生命周期
export async function bootstrap() {
  console.log('Vue app bootstrapped');
}

export async function mount(props) {
  // 接收主应用传递的全局状态
  console.log('Props from main:', props);
  render(props);
}

export async function unmount() {
  instance.$destroy();
  instance = null;
}
```

### 1.4 JS 沙箱原理 ⭐

```js
// Proxy 沙箱 — qiankun 的实现思路
class ProxySandbox {
  constructor() {
    // 1. 创建一个假的 window 代理
    const fakeWindow = {};
    const proxy = new Proxy(fakeWindow, {
      // 2. 设置属性 → 写到 fakeWindow 上
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
      // 3. 获取属性 → 先查 fakeWindow，再查真实 window
      get(target, prop) {
        return target[prop] ?? window[prop];
      },
    });

    this.proxy = proxy;
  }
}

// 使用
const sandbox1 = new ProxySandbox();
const sandbox2 = new ProxySandbox();

// 子应用 1 修改全局变量
sandbox1.proxy.count = 1;
// 子应用 2 也有自己的 count
sandbox2.proxy.count = 2;

console.log(sandbox1.proxy.count); // 1（互不影响）
console.log(sandbox2.proxy.count); // 2
console.log(window.count);        // undefined（真实 window 未被污染）
```

| 沙箱类型 | 原理 | 优缺点 |
|---------|------|--------|
| **快照沙箱** | 激活时保存 window 快照，卸载时恢复 | 简单，但不能多实例共存 |
| **Proxy 沙箱** | 每个子应用一个 Proxy 代理 window | ✅ 多实例共存，推荐 |
| **iframe 沙箱** | 天然隔离 | 性能差，通信麻烦 |

### 面试 Q&A

| 面试题 | 要点 |
|--------|------|
| 微前端解决什么问题？ | 独立开发部署、技术栈无关、增量升级、团队自治 |
| JS 沙箱原理？ | Proxy 代理 window，每个子应用写入自己的代理对象 |
| CSS 隔离怎么做？ | Shadow DOM / scoped CSS / CSS Modules / 命名空间前缀 |
| qiankun 和 Micro-App 区别？ | qiankun 基于 single-spa，Micro-App 基于 Web Component，接入更简单 |

---

## 知识点 2：架构设计场景题

### 2.1 大型项目组件体系设计 ⭐

```
组件库分层架构：

┌──────────────────────────────────────┐
│         业务组件 (Business)           │
│  OrderCard / UserAvatar / ProductSKU │
├──────────────────────────────────────┤
│         通用组件 (Common)             │
│  Table / Form / Modal / Drawer       │
├──────────────────────────────────────┤
│         基础组件 (Primitives)         │
│  Button / Input / Icon / Text        │
├──────────────────────────────────────┤
│         设计令牌 (Design Tokens)      │
│  colors / spacing / typography       │
└──────────────────────────────────────┘
```

```js
// 设计令牌层 — design-tokens.js
export const tokens = {
  colors: {
    primary: '#1677ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  },
};

// 基础组件层 — Button.jsx
function Button({
  variant = 'primary',  // primary | secondary | ghost
  size = 'md',          // sm | md | lg
  loading = false,
  children,
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner size="small" />}
      {children}
    </button>
  );
}

// 通用组件层 — DataTable.jsx
function DataTable({ columns, data, loading, pagination, onChange }) {
  return (
    <div className="data-table">
      <Table columns={columns} dataSource={data} loading={loading} />
      <Pagination {...pagination} onChange={onChange} />
    </div>
  );
}

// 业务组件层 — OrderCard.jsx
function OrderCard({ order }) {
  return (
    <Card>
      <CardHeader title={`订单 ${order.id}`} />
      <DataTable columns={orderColumns} data={order.items} />
      <Button variant="primary" onClick={() => pay(order.id)}>
        立即支付
      </Button>
    </Card>
  );
}
```

### 2.2 电商购物车设计 ⭐

```js
// 购物车状态管理 — useCart.js
// 用 Zustand 实现

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCart = create(
  persist(
    (set, get) => ({
      // 状态
      items: [], // [{ id, name, price, quantity, sku }]

      // 计算属性
      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      get totalPrice() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      // 操作
      addItem: (product, quantity = 1) => set(state => {
        const existing = state.items.find(i => i.sku === product.sku);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.sku === product.sku
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          };
        }
        return { items: [...state.items, { ...product, quantity }] };
      }),

      removeItem: (sku) => set(state => ({
        items: state.items.filter(i => i.sku !== sku),
      })),

      updateQuantity: (sku, quantity) => set(state => ({
        items: state.items.map(i =>
          i.sku === sku ? { ...i, quantity: Math.max(0, quantity) } : i
        ).filter(i => i.quantity > 0),
      })),

      clear: () => set({ items: [] }),
    }),
    { name: 'shopping-cart' }
  )
);

// 使用
function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity } = useCart();

  return (
    <div>
      {items.map(item => (
        <div key={item.sku}>
          <span>{item.name}</span>
          <input
            type="number"
            value={item.quantity}
            onChange={e => updateQuantity(item.sku, +e.target.value)}
          />
          <span>¥{item.price * item.quantity}</span>
          <button onClick={() => removeItem(item.sku)}>删除</button>
        </div>
      ))}
      <p>总计：¥{totalPrice}</p>
    </div>
  );
}
```

**购物车设计要点：**

| 维度 | 考虑点 |
|------|--------|
| **状态管理** | 全局状态 + 持久化（localStorage） |
| **库存校验** | 添加/修改数量时异步校验库存 |
| **价格计算** | 优惠券、满减、会员折扣 |
| **并发问题** | 多标签页同步（BroadcastChannel） |
| **离线支持** | Service Worker + IndexedDB |
| **性能** | 虚拟列表（商品多时）、防抖更新 |

---

## 🔧 手写题（2 道）

### 手写题 1：实现简易事件总线（EventBus）

```js
/**
 * 事件总线 — 用于微前端/组件间通信
 */
class EventBus {
  constructor() {
    // 1. 存储事件监听器
    this.events = new Map();
  }

  /**
   * 监听事件
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} 取消监听的函数
   */
  on(event, callback) {
    // 2. 初始化事件队列
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);

    // 3. 返回取消函数
    return () => this.off(event, callback);
  }

  /**
   * 监听一次
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * 触发事件
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(fn => fn(...args));
    }
  }

  /**
   * 取消监听
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    const listeners = this.events.get(event);
    if (listeners) {
      this.events.set(event, listeners.filter(fn => fn !== callback));
    }
  }

  /**
   * 清除所有监听
   */
  clear() {
    this.events.clear();
  }
}

// 测试
const bus = new EventBus();
const unsub = bus.on('user-login', (user) => {
  console.log('User logged in:', user.name); // "User logged in: Orion"
});

bus.emit('user-login', { name: 'Orion' });
unsub(); // 取消监听
bus.emit('user-login', { name: 'Test' }); // 无输出
```

### 手写题 2：实现深度克隆

```js
/**
 * 深度克隆 — 支持循环引用、特殊对象类型
 * @param {*} source
 * @param {WeakMap} [map]
 * @returns {*}
 */
function deepClone(source, map = new WeakMap()) {
  // 1. 处理原始类型和 null
  if (source === null || typeof source !== 'object') {
    return source;
  }

  // 2. 处理循环引用
  if (map.has(source)) {
    return map.get(source);
  }

  // 3. 处理特殊对象类型
  if (source instanceof Date) return new Date(source);
  if (source instanceof RegExp) return new RegExp(source.source, source.flags);
  if (source instanceof Error) return new Error(source.message);

  // 4. 处理 Map 和 Set
  if (source instanceof Map) {
    const result = new Map();
    map.set(source, result);
    source.forEach((value, key) => {
      result.set(deepClone(key, map), deepClone(value, map));
    });
    return result;
  }

  if (source instanceof Set) {
    const result = new Set();
    map.set(source, result);
    source.forEach(value => {
      result.add(deepClone(value, map));
    });
    return result;
  }

  // 5. 处理数组和普通对象
  const result = Array.isArray(source) ? [] : {};
  map.set(source, result);

  // 6. 克隆所有属性（包括 Symbol）
  Reflect.ownKeys(source).forEach(key => {
    result[key] = deepClone(source[key], map);
  });

  return result;
}

// 测试
const obj = {
  num: 1,
  str: 'hello',
  arr: [1, 2, { a: 3 }],
  date: new Date(),
  regex: /test/gi,
  nested: { b: { c: 4 } },
};
obj.self = obj; // 循环引用

const cloned = deepClone(obj);
console.log(cloned.nested.b.c === 4); // true
console.log(cloned.self === cloned);   // true（保持循环引用）
console.log(cloned !== obj);           // true（不同引用）
console.log(cloned.arr !== obj.arr);   // true
```

---

## 💻 算法题

### 题目 1：缺失的第一个正数（#41）⭐

**思路**：原地哈希。用数组自身作为哈希表，将值为 `i` 的数放到索引 `i-1` 的位置。

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var firstMissingPositive = function(nums) {
  const n = nums.length;

  // 1. 将每个数放到正确的位置
  for (let i = 0; i < n; i++) {
    // nums[i] 应该放在 nums[i]-1 的位置
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      // 交换
      const target = nums[i] - 1;
      [nums[i], nums[target]] = [nums[target], nums[i]];
    }
  }

  // 2. 找第一个 nums[i] !== i+1 的位置
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }

  return n + 1;
};
// 时间 O(n) | 空间 O(1)

console.log(firstMissingPositive([1, 2, 0]));       // 3
console.log(firstMissingPositive([3, 4, -1, 1]));    // 2
console.log(firstMissingPositive([7, 8, 9, 11, 12])); // 1
```

### 题目 2：数据流的中位数（#295）

**思路**：用两个堆——大顶堆存较小一半，小顶堆存较大一半。

```js
/**
 * 简易堆实现
 */
class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  peek() { return this.data[0]; }

  push(val) {
    this.data.push(val);
    this._bubbleUp(this.data.length - 1);
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent] <= this.data[i]) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1, right = 2 * i + 2;
      if (left < n && this.data[left] < this.data[smallest]) smallest = left;
      if (right < n && this.data[right] < this.data[smallest]) smallest = right;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}

class MaxHeap extends MinHeap {
  push(val) { super.push(-val); }
  pop() { return -super.pop(); }
  peek() { return -super.peek(); }
}

/**
 * 中位数查找器
 */
class MedianFinder {
  constructor() {
    // 1. 大顶堆存较小的一半
    this.maxHeap = new MaxHeap();
    // 2. 小顶堆存较大的一半
    this.minHeap = new MinHeap();
  }

  /**
   * @param {number} num
   */
  addNum(num) {
    // 3. 先放入大顶堆
    this.maxHeap.push(num);
    // 4. 大顶堆的最大值 → 小顶堆
    this.minHeap.push(this.maxHeap.pop());
    // 5. 平衡：大顶堆可以比小顶堆多一个
    if (this.maxHeap.size() < this.minHeap.size()) {
      this.maxHeap.push(this.minHeap.pop());
    }
  }

  /**
   * @return {number}
   */
  findMedian() {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek();
    }
    return (this.maxHeap.peek() + this.minHeap.peek()) / 2;
  }
}
// addNum O(log n) | findMedian O(1)

// 测试
const mf = new MedianFinder();
mf.addNum(1);
mf.addNum(2);
console.log(mf.findMedian()); // 1.5
mf.addNum(3);
console.log(mf.findMedian()); // 2
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|----------|----------|
| 微前端方案 | qiankun / Micro-App / Module Federation 三种路线 | ⭐⭐⭐⭐⭐ |
| JS 沙箱 | Proxy 沙箱多实例共存，快照沙箱简单但受限 | ⭐⭐⭐⭐⭐ |
| 组件体系 | 设计令牌 → 基础 → 通用 → 业务 四层架构 | ⭐⭐⭐⭐ |
| 购物车设计 | 状态持久化 + 库存校验 + 多标签同步 | ⭐⭐⭐⭐ |
| 缺失的第一个正数 | 原地哈希 O(n) 时间 O(1) 空间 | ⭐⭐⭐⭐⭐ |
| 数据流中位数 | 双堆（大顶+小顶）维护有序对半 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 27）

**AI Agent 实战深入** — Prompt Engineering 进阶（RTF 框架、Chain-of-Thought）、AI Agent 开发实战（Vercel AI SDK / LangChain）、RAG 原理与前端集成。晚上以复习为主，不安排新算法题。
