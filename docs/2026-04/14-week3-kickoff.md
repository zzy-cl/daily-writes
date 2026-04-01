# 04/14 — ⭐ 第三阶段启动（Day 14）

> **阶段**：第三阶段 React 18+
> **今日目标**：回顾 Day 8-13 错题盲区，为 React 深入学习做知识地基巩固
> **投入时间**：上午 2h / 下午 1h / 晚上 1h 算法

---

## 知识点 1：前端模块化演进回顾（预习 React 前置知识）

在进入 React 深水区之前，先巩固模块化和组件化思想，这是理解 Fiber/Hooks 的底层基础。

### 1.1 CommonJS vs ESM ⭐

| 特性 | CommonJS (`require`) | ESM (`import`) |
|------|---------------------|----------------|
| 加载方式 | 运行时同步加载 | 编译时静态解析 |
| 值类型 | 值的拷贝 | 值的引用（live binding） |
| Tree-shaking | ❌ 不支持 | ✅ 支持 |
| 循环依赖 | 返回未完成的拷贝 | 返回引用（可能 undefined） |
| 顶层 `this` | `module.exports` 对象 | `undefined` |

```js
// ESM — live binding 示例
// counter.mjs
export let count = 0;
export function increment() { count++; }

// main.mjs
import { count, increment } from './counter.mjs';
console.log(count); // 0
increment();
console.log(count); // 1 ✅ 值是引用，始终同步

// 如果用 CommonJS：
// let { count } = require('./counter'); // 拿到的是 0 的拷贝，不会更新
```

### 1.2 组件化核心思想

React 的一切围绕 **组件** 展开。组件 = UI + 状态 + 生命周期。

```jsx
// ✅ 函数组件是 React 18 的主流写法
function Counter() {
  const [count, setCount] = React.useState(0); // Hook
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}

// ❌ 类组件仍然可用但不推荐新项目使用
class CounterOld extends React.Component {
  state = { count: 0 };
  render() {
    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>
      Count: {this.state.count}
    </button>;
  }
}
```

### 1.3 虚拟 DOM 本质 ⭐

虚拟 DOM 不是银弹，它解决的核心问题是：**最小化真实 DOM 操作次数**。

```js
// 虚拟 DOM 就是一个普通 JS 对象
const vdom = {
  type: 'div',
  props: { className: 'container' },
  children: [
    { type: 'h1', props: {}, children: ['Hello'] },
    { type: 'p', props: {}, children: ['World'] }
  ]
};
console.log(vdom); // 纯 JS 对象，不含任何 DOM 引用
```

| 概念 | 说明 |
|------|------|
| Reconciliation（协调） | 新旧虚拟 DOM 树的 diff 算法 |
| Commit（提交） | 将 diff 结果应用到真实 DOM |
| Fiber | React 16+ 的新协调引擎，使 diff 可中断 |

> 🔑 **关键理解**：Fiber 是 React 对 Reconciliation 阶段的重写，让 diff 过程可以拆分成小任务、可暂停、可恢复。

---

## 知识点 2：Day 8-13 高频错题回顾

### 2.1 this 绑定易错 ⭐⚠️

```js
const obj = {
  name: 'Penny',
  greet() {
    console.log(this.name); // 'Penny'
  },
  greetArrow: () => {
    console.log(this.name); // undefined ⚠️ 箭头函数无自己的 this
  }
};

obj.greet();      // 'Penny'
obj.greetArrow(); // undefined
```

### 2.2 Promise 链式调用陷阱

```js
// ❌ 常见错误：忘记 return
Promise.resolve(1)
  .then(v => v + 1)
  .then(v => { v + 1; }) // 没有 return！
  .then(v => console.log(v)); // undefined ⚠️

// ✅ 正确写法
Promise.resolve(1)
  .then(v => v + 1)
  .then(v => v + 1)
  .then(v => console.log(v)); // 3 ✅
```

### 2.3 原型链继承易错点

```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return `${this.name} makes a noise`; };

function Dog(name) {
  Animal.call(this, name); // ✅ 必须调用父构造函数
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog; // ⚠️ 别忘了修复 constructor

const d = new Dog('Rex');
console.log(d.speak()); // 'Rex makes a noise'
console.log(d instanceof Dog);    // true
console.log(d instanceof Animal); // true
```

### 2.4 闭包经典面试题

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出：3, 3, 3 ⚠️ var 没有块级作用域

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出：0, 1, 2 ✅ let 有块级作用域
```

---

## 🔧 手写题（3 道）

### 手写题 1：实现一个简易的 EventEmitter

```js
/**
 * 实现一个 EventEmitter（发布-订阅模式）
 * 支持 on / off / emit / once
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }

  // 1. on — 注册事件监听
  on(event, handler) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(handler);
    return this;
  }

  // 2. off — 移除事件监听
  off(event, handler) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(h => h !== handler);
    return this;
  }

  // 3. emit — 触发事件
  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(handler => handler(...args));
    return true;
  }

  // 4. once — 只触发一次的监听
  once(event, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
    return this;
  }
}

// 测试用例
const emitter = new EventEmitter();
let result = [];
emitter.on('test', (msg) => result.push(msg));
emitter.emit('test', 'hello');
emitter.emit('test', 'world');
console.log(result); // ['hello', 'world']

let onceResult = [];
emitter.once('once-test', (msg) => onceResult.push(msg));
emitter.emit('once-test', 'first');
emitter.emit('once-test', 'second');
console.log(onceResult); // ['first'] — 只执行一次
```

### 手写题 2：实现 deepClone（深拷贝）

```js
/**
 * 深拷贝：处理循环引用、Date、RegExp、Map、Set
 * @param {*} obj - 要拷贝的对象
 * @param {WeakMap} map - 处理循环引用
 * @returns {*}
 */
function deepClone(obj, map = new WeakMap()) {
  // 1. 基本类型直接返回
  if (obj === null || typeof obj !== 'object') return obj;

  // 2. 循环引用检测
  if (map.has(obj)) return map.get(obj);

  // 3. 特殊对象类型
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);

  // 4. Map 和 Set
  if (obj instanceof Map) {
    const clone = new Map();
    map.set(obj, clone);
    obj.forEach((v, k) => clone.set(deepClone(k, map), deepClone(v, map)));
    return clone;
  }
  if (obj instanceof Set) {
    const clone = new Set();
    map.set(obj, clone);
    obj.forEach(v => clone.add(deepClone(v, map)));
    return clone;
  }

  // 5. 普通对象和数组
  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], map);
  }
  return clone;
}

// 测试用例
const original = { a: 1, b: { c: 2 }, d: [3, 4], e: new Date(), f: /abc/gi };
const copy = deepClone(original);
copy.b.c = 99;
console.log(original.b.c); // 2 ✅ 原对象不受影响
console.log(copy.b.c);     // 99

// 循环引用
const circular = { x: 1 };
circular.self = circular;
const circularCopy = deepClone(circular);
console.log(circularCopy.self === circularCopy); // true ✅
console.log(circularCopy.self !== circular);     // true ✅
```

### 手写题 3：实现 Promise.all

```js
/**
 * 手写 Promise.all
 * @param {Iterable<Promise>} promises
 * @returns {Promise<Array>}
 */
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    // 1. 参数校验
    const arr = Array.from(promises);
    const results = new Array(arr.length);
    let completed = 0;

    if (arr.length === 0) {
      resolve(results);
      return;
    }

    // 2. 遍历每个 Promise
    arr.forEach((p, i) => {
      Promise.resolve(p) // 3. 兼容非 Promise 值
        .then(value => {
          results[i] = value; // 保证顺序
          completed++;
          if (completed === arr.length) resolve(results);
        })
        .catch(reject); // 4. 任何一个 reject，整体 reject
    });
  });
}

// 测试用例
const p1 = Promise.resolve(1);
const p2 = new Promise(r => setTimeout(() => r(2), 100));
const p3 = Promise.resolve(3);

promiseAll([p1, p2, p3]).then(v => console.log(v)); // [1, 2, 3]

promiseAll([p1, Promise.reject('err'), p3])
  .catch(e => console.log(e)); // 'err'
```

---

## 💻 算法题

### 回顾题 1：合并两个有序数组（#88）

**思路**：从后往前填充，避免额外空间。双指针分别指向两个数组的有效尾部。

```js
/**
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 * @return {void} Do not return anything, modify nums1 in-place instead.
 */
var merge = function(nums1, m, nums2, n) {
  let p1 = m - 1, p2 = n - 1, p = m + n - 1;

  while (p2 >= 0) {
    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p--] = nums1[p1--];
    } else {
      nums1[p--] = nums2[p2--];
    }
  }
};

// 测试
const nums1 = [1,2,3,0,0,0];
merge(nums1, 3, [2,5,6], 3);
console.log(nums1); // [1,2,2,3,5,6]
```

- 时间复杂度：O(m + n)
- 空间复杂度：O(1)

### 回顾题 2：有效的括号（#20）

**思路**：栈。遇到左括号入栈，遇到右括号检查栈顶是否匹配。

```js
var isValid = function(s) {
  const stack = [];
  const map = { ')': '(', ']': '[', '}': '{' };

  for (const ch of s) {
    if (!map[ch]) {
      stack.push(ch); // 左括号入栈
    } else {
      if (stack.pop() !== map[ch]) return false;
    }
  }
  return stack.length === 0;
};

console.log(isValid('()[]{}')); // true
console.log(isValid('(]'));     // false
console.log(isValid('([)]'));   // false
console.log(isValid('{[]}'));   // true
```

- 时间复杂度：O(n)
- 空间复杂度：O(n)

### 解法对比

| 解法 | 时间 | 空间 | 特点 |
|------|------|------|------|
| 栈 | O(n) | O(n) | 最直观，面试首选 |
| 正则替换 | O(n²) | O(n) | 代码简洁但性能差 |

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| CommonJS vs ESM | ESM 是静态解析、支持 Tree-shaking，值是 live binding | ⭐⭐⭐ |
| 虚拟 DOM | 本质是 JS 对象树，Fiber 让 diff 可中断 | ⭐⭐⭐⭐ |
| 闭包经典题 | var/let 块级作用域差异 | ⭐⭐⭐⭐⭐ |
| EventEmitter | 发布-订阅模式，on/off/emit/once | ⭐⭐⭐⭐ |
| 深拷贝 | 处理循环引用、特殊对象类型 | ⭐⭐⭐⭐ |
| Promise.all | 顺序保证 + 任一 reject 整体 reject | ⭐⭐⭐⭐ |

**今日收获**：为第三阶段打好了模块化、组件化、异步处理的地基。明天正式进入 Fiber 架构！

---

## 📌 明天预告（Day 15）

明日主题：**React 核心：Fiber 与 Hooks**

- 🔑 Fiber 双缓冲链表 & 时间切片原理
- 🔑 Lane 优先级调度模型
- 🔑 Hooks 底层链表结构 & 闭包陷阱
- 💻 岛屿数量、腐烂的橘子、课程表（BFS/拓扑排序）
