# 04/03 — JS 进阶与内存管理（Day 3）

> **阶段**：第一阶段 前端基础强化
> **今日目标**：掌握 ES6+ 数据结构、迭代器/生成器、模块化机制，理解 V8 垃圾回收与内存泄漏排查
> **投入时间**：上午 2h / 下午 2h / 晚上 3h 算法

---

## 知识点 1：ES6+ 数据结构（Map/Set/WeakMap/WeakRef）

### 1.1 Set — 唯一值集合 ⭐

```js
// 基本用法
const set = new Set([1, 2, 2, 3, 3, 3]);
console.log(set);        // Set(3) {1, 2, 3}
console.log(set.size);   // 3

// 增删查
set.add(4);              // Set(4) {1, 2, 3, 4}
set.delete(2);           // true
console.log(set.has(2)); // false

// ⚠️ 对象引用问题
const objSet = new Set();
objSet.add({ a: 1 });
console.log(objSet.has({ a: 1 })); // false — 不同引用！

// ✅ 数组去重
const arr = [1, 2, 2, 3, 3];
const unique = [...new Set(arr)];
console.log(unique); // [1, 2, 3]

// ✅ 交集/并集/差集
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
const intersection = [...a].filter(x => b.has(x));  // [2, 3]
const union = [...new Set([...a, ...b])];            // [1, 2, 3, 4]
const difference = [...a].filter(x => !b.has(x));   // [1]
```

### 1.2 Map — 键值对集合 ⭐

```js
// 基本用法：键可以是任意类型
const map = new Map();
const key = { id: 1 };
map.set(key, 'value1');
map.set('name', 'Penny');
map.set(42, 'number key');

console.log(map.get(key));    // 'value1'
console.log(map.has('name')); // true
console.log(map.size);        // 3

// 遍历
map.forEach((value, key) => console.log(key, value));
for (const [key, value] of map) { /* 解构遍历 */ }

// 与 Object 的核心区别 ⭐
```

| 特性 | Map | Object |
|------|-----|--------|
| 键类型 | **任意值**（对象、函数等） | 字符串/Symbol |
| 顺序 | ✅ 插入顺序 | 部分保证（数字键排序） |
| size | `.size` 属性 | 需要 `Object.keys().length` |
| 性能 | 频繁增删更快 | 静态结构更快 |
| 原型 | 无原型污染 | 可能有原型链属性 |

```js
// ⚠️ Map 与 JSON
const map = new Map([['a', 1], ['b', 2]]);
// ❌ JSON.stringify(map) → '{}'
// ✅ 转换
const json = JSON.stringify([...map]);   // '[["a",1],["b",2]]'
const restored = new Map(JSON.parse(json));
```

### 1.3 WeakMap — 弱引用 ⭐🔑

```js
// 核心特点：
// 1. 键必须是对象（不能是原始值）
// 2. 键是弱引用 — 不阻止垃圾回收
// 3. 没有 size、不能遍历

const weakMap = new WeakMap();

// ✅ 经典用法：给对象挂私有数据，不阻止 GC
const cache = new WeakMap();
function process(obj) {
  if (!cache.has(obj)) {
    cache.set(obj, expensiveComputation(obj));
  }
  return cache.get(obj);
}
// 当 obj 不再被引用时，cache 中的条目自动清理 ✅

// ✅ 实现类的私有属性
const privateData = new WeakMap();
class Person {
  constructor(name) {
    privateData.set(this, { name });
  }
  getName() {
    return privateData.get(this).name;
  }
}
// Person 实例被 GC 后，privateData 自动清理

// ❌ 如果用 Map — 内存泄漏！
const mapCache = new Map();
function processBad(obj) {
  mapCache.set(obj, expensiveComputation(obj));
  // 即使 obj 不再使用，mapCache 仍持有强引用 → 永远不会 GC
}
```

### 1.4 WeakRef — 弱引用对象

```js
// WeakRef 允许持有对象引用而不阻止 GC
let obj = { data: 'important' };
const ref = new WeakRef(obj);

// 使用时检查是否还存活
const deref = ref.deref();
if (deref) {
  console.log(deref.data); // 'important'
}

// 配合 FinalizationRegistry 使用
const registry = new FinalizationRegistry(key => {
  console.log(`对象 ${key} 已被回收`);
});
registry.register(obj, 'myObj');
obj = null; // 下次 GC 时会触发回调
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| WeakMap 使用场景？ | 私有数据、缓存、DOM 节点关联数据 |
| 为什么 WeakMap 不会内存泄漏？ | 键是弱引用，不阻止 GC，对象被回收后自动清理条目 |
| Map vs Object 怎么选？ | 需要非字符串键 / 频繁增删 → Map；固定结构 → Object |
| Set 判断相等用什么？ | `SameValueZero` 算法（类似 `===`，但 `NaN === NaN` 为 true） |

---

## 知识点 2：迭代器与生成器

### 2.1 迭代器协议 ⭐

```js
// 迭代器：实现 next() 方法的对象
// 返回 { value, done }

const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {          // 1. 实现可迭代协议
    let current = this.from;
    const last = this.to;
    return {                      // 2. 返回迭代器对象
      next() {
        return current <= last
          ? { value: current++, done: false }  // 还有值
          : { done: true };                     // 结束
      }
    };
  }
};

// ✅ 可以用 for...of 遍历
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// ✅ 可以展开
console.log([...range]); // [1, 2, 3, 4, 5]

// ⚠️ 可迭代 ≠ 数组
console.log(range instanceof Array); // false
console.log(Array.isArray(range));   // false
```

### 2.2 生成器（Generator）⭐🔑

```js
// function* 定义生成器，yield 暂停执行
function* gen() {
  console.log('执行到 yield 1');
  yield 1;
  console.log('执行到 yield 2');
  yield 2;
  console.log('执行到 yield 3');
  yield 3;
}

const g = gen();
console.log(g.next()); // '执行到 yield 1' → { value: 1, done: false }
console.log(g.next()); // '执行到 yield 2' → { value: 2, done: false }
console.log(g.next()); // '执行到 yield 3' → { value: 3, done: false }
console.log(g.next()); // { value: undefined, done: true }

// 🔑 关键：惰性求值 — 每次 next() 才执行到下一个 yield
```

### 2.3 生成器实现可迭代对象

```js
function* range(from, to) {
  for (let i = from; i <= to; i++) {
    yield i;
  }
}

console.log([...range(1, 5)]); // [1, 2, 3, 4, 5]

// ✅ 生成器自动实现 Symbol.iterator
const g = range(1, 3);
console.log(g[Symbol.iterator]() === g); // true
```

### 2.4 生成器与异步（async generator）

```js
// 异步生成器：用于流式数据
async function* fetchPages() {
  let page = 1;
  while (true) {
    const res = await fetch(`/api/items?page=${page}`);
    const data = await res.json();
    if (data.length === 0) break;
    yield data;
    page++;
  }
}

// for await...of 消费
(async () => {
  for await (const page of fetchPages()) {
    console.log(page);
  }
})();
```

### 2.5 ⚠️ 常见陷阱

```js
// ❌ 生成器只能迭代一次
const gen = range(1, 3);
console.log([...gen]); // [1, 2, 3]
console.log([...gen]); // [] — 已耗尽！

// ✅ 可迭代对象可以多次迭代
const iterable = range(1, 3);
console.log([...iterable]); // [1, 2, 3]
console.log([...iterable]); // [1, 2, 3]
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| Generator 的用途？ | 惰性求值、自定义迭代、协程、状态机 |
| yield 和 return 的区别？ | yield 暂停可恢复，return 终止生成器 |
| 什么对象可以 for...of？ | 实现了 `Symbol.iterator` 的对象 |
| 生成器和数组的取舍？ | 大数据/无限序列用生成器（惰性），小数据用数组 |

---

## 知识点 3：模块化（ESM vs CJS）⭐

### 3.1 核心对比

| 特性 | ES Module (ESM) | CommonJS (CJS) |
|------|----------------|----------------|
| 语法 | `import` / `export` | `require()` / `module.exports` |
| 加载时机 | 编译时（静态） | 运行时（动态） |
| 值类型 | **引用**（live binding） | **值的拷贝** |
| this | `undefined` | `module.exports` |
| 循环依赖 | ✅ 能处理（引用） | ⚠️ 返回未完成的对象 |
| Tree Shaking | ✅ 支持（静态分析） | ❌ 不支持 |
| 顶层 await | ✅ 支持 | ❌ 不支持 |

### 3.2 ESM 导出导出方式

```js
// === 导出 ===
// 命名导出
export const name = 'Penny';
export function sayHi() { return 'Hi!'; }

// 批量导出
const age = 21;
const city = 'Shanghai';
export { age, city };

// 重命名导出
export { age as userAge };

// 默认导出（一个模块只能一个）
export default class User { /* ... */ }

// === 导入 ===
import User from './user.js';               // 默认导入
import { name, sayHi } from './utils.js';   // 命名导入
import * as utils from './utils.js';        // 全量导入
import { age as userAge } from './utils.js'; // 重命名导入
```

### 3.3 动态导入 ⭐

```js
// ESM 也支持运行时动态导入
const module = await import('./heavy-module.js');
module.doSomething();

// 按需加载场景
button.addEventListener('click', async () => {
  const { showModal } = await import('./modal.js');
  showModal();
});

// ⚠️ dynamic import 返回 Promise，所有模块都可以用
```

### 3.4 循环依赖

```js
// a.js
import { b } from './b.js';
export const a = 'A';
export const ab = a + b; // ✅ 此时 b 可能还没初始化

// b.js
import { a } from './a.js';
export const b = 'B';
export const ba = a + b; // ⚠️ a 可能是 undefined

// 🔑 ESM 中循环依赖：导入的是 live binding
// 执行顺序：a.js 开始 → 遇到 import b → 执行 b.js → b.js 遇到 import a
// 此时 a 还没定义，但 a.js 继续执行完后绑定就更新了
```

### 3.5 Tree Shaking 与 ESM ⭐🔑

```
为什么 Tree Shaking 要求 ESM？
→ 因为 ESM 的 import/export 是静态的，打包工具可以在编译时分析
   哪些导出从未被使用，从而在产物中移除它们。
→ CJS 的 require() 是动态的，打包工具无法在编译时确定依赖关系。
```

```js
// utils.js
export function used() { return 'used'; }
export function unused() { return 'unused'; } // ❌ 未使用

// app.js
import { used } from './utils.js';
// Tree Shaking 后：unused() 被移除，产物更小
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| ESM 和 CJS 最本质的区别？ | ESM 编译时静态分析，CJS 运行时动态加载 |
| 为什么 ESM 的 export 是引用？ | live binding — 导入方始终拿到导出方的最新值 |
| Tree Shaking 的前提条件？ | 使用 ESM + 支持静态分析的打包工具（Rollup/Webpack） |
| ESM 中为什么 this 是 undefined？ | ESM 默认在 strict mode 下运行 |

---

## 知识点 4：V8 垃圾回收机制 ⭐🔑

### 4.1 内存生命周期

```
分配内存 → 使用内存 → 释放内存
  (new)    (读/写)     (GC)
```

### 4.2 V8 内存分代

| 分代 | 名称 | 空间 | 存活时间 | GC 算法 |
|------|------|------|---------|---------|
| 新生代 | Young Generation | 1-8MB | 短 | **Scavenge**（复制算法） |
| 老生代 | Old Generation | 较大 | 长 | **Mark-Sweep + Mark-Compact** |

### 4.3 Scavenge 算法（新生代）

```
┌─────────────────────────┐
│      新生代空间          │
│  ┌──────────┬──────────┐│
│  │  From    │   To     ││
│  │ (活动区)  │  (空闲区) ││
│  └──────────┴──────────┘│
└─────────────────────────┘

1. GC 时扫描 From 空间的存活对象
2. 复制存活对象到 To 空间
3. From 和 To 角色互换
4. 对象经过两次 Scavenge 仍存活 → 晋升到老生代
```

**优点**：速度快，只需复制存活对象
**缺点**：空间利用率只有 50%

### 4.4 Mark-Sweep + Mark-Compact（老生代）

```
Mark-Sweep（标记清除）：
1. 从根对象出发，标记所有可达对象
2. 清除未标记的对象（产生内存碎片）

Mark-Compact（标记整理）：
1. 标记阶段同上
2. 将存活对象向一端移动，清除边界外的空间
```

⚠️ **增量标记**：V8 将标记过程拆分成小步，穿插在主线程执行，避免长时间停顿。

### 4.5 闭包与内存 ⭐

```js
function outer() {
  const largeData = new Array(1000000).fill('data'); // 大数组
  return function inner() {
    console.log(largeData.length); // 闭包引用了 largeData
  };
}

const fn = outer();
// largeData 不会被 GC，因为 inner 闭包引用着它

// ✅ 正确释放：解除引用
fn = null; // 现在 largeData 可以被 GC

// ⚠️ 常见错误：事件监听器
element.addEventListener('click', handler);
// 如果不 removeEventListener，handler 和它闭包引用的数据都不会被 GC
```

### 4.6 Chrome DevTools Memory 面板 🔑

| 功能 | 用途 |
|------|------|
| Heap Snapshot | 查看内存快照，比较两次快照找泄漏 |
| Allocation Timeline | 实时记录内存分配，定位分配源 |
| Allocation Sampling | 低开销采样，适合生产环境 |
| Performance Monitor | 监控 JS 堆大小、DOM 节点数等 |

**排查流程**：
1. 打开 DevTools → Memory → Take Heap Snapshot
2. 执行操作后 → Take Heap Snapshot
3. Comparison 视图对比两次快照
4. 查看 "Objects allocated between Snapshot 1 and 2"
5. 检查 `Detached DOM Tree`（已移除但未释放的 DOM）

### 4.7 前端内存泄漏常见场景 ⭐

| 场景 | 说明 | 解决方案 |
|------|------|---------|
| 未清除的定时器 | setInterval + 闭包 | clearInterval |
| 未移除的事件监听 | addEventListener 不移除 | removeEventListener / AbortController |
| DOM 引用 | JS 变量引用已移除的 DOM | 置 null |
| 闭包 | 函数持有大对象引用 | 及时释放引用 |
| 全局变量 | 意外的全局变量 | 'use strict' |
| Detached DOM | 移除父节点但 JS 仍引用子节点 | 解除引用 |

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| V8 如何判断对象可被回收？ | 从 GC Roots 出发不可达 |
| 新生代为什么要用复制算法？ | 新生代对象存活率低，复制成本小 |
| 什么情况下对象从新生代晋升到老生代？ | 经历过一次 Scavenge 且 To 空间占用超 25%，或两次 Scavenge 后仍存活 |
| 如何检测前端内存泄漏？ | Chrome DevTools Memory 面板 + 对比两次 Heap Snapshot |

---

## 🔧 手写题（2 道）

### 手写题 1：用 Set 实现去重 + 交并差

```js
/**
 * 通用集合操作工具
 */
const SetUtils = {
  /**
   * 数组去重
   * @param {Array} arr
   * @returns {Array}
   */
  unique(arr) {
    // 1. 利用 Set 自动去重特性
    return [...new Set(arr)];
  },

  /**
   * 交集：同时在 a 和 b 中的元素
   * @param {Set} a
   * @param {Set} b
   * @returns {Set}
   */
  intersect(a, b) {
    // 2. 遍历较小的集合，效率更高
    const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
    return new Set([...smaller].filter(x => larger.has(x)));
  },

  /**
   * 并集：a 或 b 中的所有元素
   * @param {Set} a
   * @param {Set} b
   * @returns {Set}
   */
  union(a, b) {
    // 3. 展开两个集合合并
    return new Set([...a, ...b]);
  },

  /**
   * 差集：在 a 中但不在 b 中的元素
   * @param {Set} a
   * @param {Set} b
   * @returns {Set}
   */
  diff(a, b) {
    // 4. 过滤掉 b 中存在的元素
    return new Set([...a].filter(x => !b.has(x)));
  },
};

// 测试
const s1 = new Set([1, 2, 3, 4]);
const s2 = new Set([3, 4, 5, 6]);

console.log(SetUtils.unique([1, 2, 2, 3, 3]));   // [1, 2, 3]
console.log([...SetUtils.intersect(s1, s2)]);     // [3, 4]
console.log([...SetUtils.union(s1, s2)]);         // [1, 2, 3, 4, 5, 6]
console.log([...SetUtils.diff(s1, s2)]);          // [1, 2]
```

---

### 手写题 2：实现惰性求值的 range 生成器

```js
/**
 * 惰性无限 range 生成器
 * 支持：步长、无限序列、take 取前 N 个
 *
 * @param {number} start
 * @param {number} end - 传 Infinity 为无限序列
 * @param {number} step
 * @returns {Generator}
 */
function* range(start = 0, end = Infinity, step = 1) {
  // 1. 参数校验
  if (step === 0) throw new Error('step 不能为 0');

  let current = start;

  // 2. 根据步长方向判断终止条件
  const shouldContinue = step > 0
    ? () => current < end
    : () => current > end;

  while (shouldContinue()) {
    yield current;       // 3. 惰性返回当前值
    current += step;     // 4. 增加步长
  }
}

/**
 * 从生成器中取前 n 个值
 * @param {Generator} gen
 * @param {number} n
 * @returns {Array}
 */
function take(gen, n) {
  const result = [];
  for (let i = 0; i < n; i++) {
    const { value, done } = gen.next();
    if (done) break;
    result.push(value);
  }
  return result;
}

// 测试
console.log([...range(1, 5)]);              // [1, 2, 3, 4]
console.log([...range(0, 10, 3)]);          // [0, 3, 6, 9]
console.log([...range(5, 0, -1)]);          // [5, 4, 3, 2, 1]

// 无限序列 + take
console.log(take(range(0, Infinity), 5));    // [0, 1, 2, 3, 4]

// ⚠️ 不能对无限序列用 [...range()] — 会死循环
// ✅ 必须用 take 或 for...of + break
```

---

## 💻 算法题

### 算法题 1：无重复字符的最长子串（LeetCode #3）

**思路**：滑动窗口。用 Set 记录窗口内的字符，右指针扩张，遇到重复字符则左指针收缩。

| 解法 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| 滑动窗口 + Set | O(n) | O(min(m,n)) |
| 滑动窗口 + Map（优化） | O(n) | O(min(m,n)) |
| 暴力 | O(n²) | O(min(m,n)) |

```js
/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
  const set = new Set();
  let left = 0, max = 0;

  for (let right = 0; right < s.length; right++) {
    // 遇到重复字符，左指针收缩直到不重复
    while (set.has(s[right])) {
      set.delete(s[left]);
      left++;
    }
    // 加入当前字符
    set.add(s[right]);
    // 更新最大长度
    max = Math.max(max, right - left + 1);
  }
  return max;
  // 时间 O(n)，空间 O(min(m,n)) m 为字符集大小
};

// 测试
console.log(lengthOfLongestSubstring('abcabcbb')); // 3 ('abc')
console.log(lengthOfLongestSubstring('bbbbb'));    // 1 ('b')
console.log(lengthOfLongestSubstring('pwwkew'));   // 3 ('wke')
console.log(lengthOfLongestSubstring(''));         // 0
```

---

### 算法题 2：找到字符串中所有字母异位词（LeetCode #438）

**思路**：固定窗口滑动。窗口大小 = p.length，用 Map 或数组记录字符频率，比较窗口与目标的频率是否一致。

```js
/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
var findAnagrams = function(s, p) {
  if (s.length < p.length) return [];

  const result = [];
  const pCount = new Array(26).fill(0);
  const sCount = new Array(26).fill(0);
  const aCode = 'a'.charCodeAt(0);

  // 初始化 p 和第一个窗口的频率
  for (let i = 0; i < p.length; i++) {
    pCount[p.charCodeAt(i) - aCode]++;
    sCount[s.charCodeAt(i) - aCode]++;
  }

  // 判断两个频率数组是否相等
  const matches = () => pCount.every((v, i) => v === sCount[i]);

  if (matches()) result.push(0);

  // 滑动窗口：加入右边，移除左边
  for (let i = p.length; i < s.length; i++) {
    sCount[s.charCodeAt(i) - aCode]++;           // 加入右边界
    sCount[s.charCodeAt(i - p.length) - aCode]--; // 移除左边界
    if (matches()) result.push(i - p.length + 1);
  }
  return result;
  // 时间 O(n)，空间 O(1)（26个字母的固定数组）
};

// 测试
console.log(findAnagrams('cbaebabacd', 'abc')); // [0, 6]
console.log(findAnagrams('abab', 'ab'));         // [0, 1, 2]
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Set / Map | Set 去重，Map 任意键值对 | ⭐⭐⭐⭐ |
| WeakMap | 弱引用键，自动 GC，私有数据 | ⭐⭐⭐⭐⭐ |
| 迭代器 / 生成器 | Symbol.iterator、yield 惰性求值 | ⭐⭐⭐ |
| ESM vs CJS | 编译时静态 vs 运行时动态、live binding | ⭐⭐⭐⭐⭐ |
| V8 垃圾回收 | Scavenge（新生代）+ Mark-Sweep（老生代） | ⭐⭐⭐⭐ |
| 内存泄漏排查 | 未清除定时器/监听器、闭包、Detached DOM | ⭐⭐⭐⭐⭐ |

### 🔑 今日关键收获
1. `WeakMap` 的弱引用是理解 JS 内存管理的关键
2. ESM 的 static 特性使 Tree Shaking 成为可能
3. V8 的分代 GC 策略：新生代快但空间小，老生代慢但空间大
4. 内存泄漏排查：**对比两次 Heap Snapshot 是金标准**

---

## 📌 明天预告（Day 4）

Day 4 进入 **TypeScript 核心**：
- 基础类型、泛型、接口 vs 类型别名
- 类型守卫、never/unknown/void
- Utility Types 手写

TypeScript 是现代前端的必备武器，准备好了吗？💪
