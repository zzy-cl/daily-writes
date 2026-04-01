# 04/07 — 第一周复盘（Day 7）⭐

> **阶段**：第一阶段 前端基础强化
> **今日目标**：整理 Day 1-6 全部错题和难点，口述 JS 基础题，回顾力扣错题
> **投入时间**：上午 2h / 下午 1h 口述 / 晚上 2h 错题回顾

---

## 知识点 1：本周核心知识脉络

### 1.1 Day 1-6 知识地图

```
第一阶段 前端基础强化
├── Day 1: JS 基础（类型/原型/闭包/this）
├── Day 2: 异步与 Promise ← Event Loop / 手写 Promise
├── Day 3: JS 进阶与内存管理 ← Map/Set/WeakMap/模块化/V8 GC
├── Day 4: TypeScript 核心 ← 类型系统/泛型/Utility Types
├── Day 5: TypeScript 进阶 ← 条件类型/infer/类型体操
├── Day 6: 算法 + 数据结构 ← 链表/栈/队列/LRU Cache
└── Day 7: 本周复盘 ← 你现在在这里 📍
```

### 1.2 按面试频率排序的 Top 10 知识点

| 排名 | 知识点 | 面试频率 | 所属 Day |
|------|--------|---------|---------|
| 1 | Event Loop / 微任务宏任务执行顺序 | ⭐⭐⭐⭐⭐ | Day 2 |
| 2 | Promise / async/await 原理与手写 | ⭐⭐⭐⭐⭐ | Day 2 |
| 3 | TypeScript 泛型 + 条件类型 | ⭐⭐⭐⭐⭐ | Day 4-5 |
| 4 | interface vs type 区别 | ⭐⭐⭐⭐⭐ | Day 4 |
| 5 | V8 垃圾回收 / 内存泄漏排查 | ⭐⭐⭐⭐⭐ | Day 3 |
| 6 | 反转链表 / 快慢指针 | ⭐⭐⭐⭐⭐ | Day 6 |
| 7 | LRU Cache | ⭐⭐⭐⭐⭐ | Day 6 |
| 8 | ESM vs CJS / Tree Shaking | ⭐⭐⭐⭐⭐ | Day 3 |
| 9 | WeakMap 原理与使用场景 | ⭐⭐⭐⭐⭐ | Day 3 |
| 10 | Utility Types 原理（Partial/Pick/Omit）| ⭐⭐⭐⭐⭐ | Day 4 |

---

## 知识点 2：高频易错点汇总 ⚠️

### 2.1 JS 异步易错题

```js
// ⚠️ 易错题 1：async/await 执行顺序
async function foo() {
  console.log(1);       // 同步
  await Promise.resolve();
  console.log(2);       // 微任务
}
foo();
console.log3;           // 同步
// 输出：1 → 3 → 2
// 关键：await 后面是微任务

// ⚠️ 易错题 2：Promise.resolve 的 then 链
Promise.resolve()
  .then(() => {
    throw new Error('err');
  })
  .then(
    () => console.log('success'),
    (e) => console.log('caught:', e.message)
  );
// 输出：'caught: err'
// 关键：前一个 then 抛错，走下一个 then 的 onRejected

// ⚠️ 易错题 3：new Promise executor 是同步的
console.log('start');
const p = new Promise((resolve) => {
  console.log('executor'); // 同步执行！
  resolve('done');
});
p.then(v => console.log(v));
console.log('end');
// 输出：start → executor → end → done
```

### 2.2 TypeScript 易错题

```ts
// ⚠️ 易错题 1：分布式条件类型
type ToArray<T> = T extends any ? T[] : never;
type R1 = ToArray<string | number>;
// string[] | number[]（分发了）
// 不是 (string | number)[]

type ToArray2<T> = [T] extends [any] ? T[] : never;
type R2 = ToArray2<string | number>;
// (string | number)[]（不分发）

// ⚠️ 易错题 2：never 在联合类型中被消隐
type T1 = string | never; // string
type T2 = never | never;  // never

// ⚠️ 易错题 3：unknown 的使用限制
let x: unknown = 'hello';
// x.toUpperCase();    // ❌ Error
if (typeof x === 'string') {
  x.toUpperCase();     // ✅ 收窄后可用
}

// ⚠️ 易错题 4：as const 的效果
const arr = [1, 2, 3];
// 类型：number[]
const arr2 = [1, 2, 3] as const;
// 类型：readonly [1, 2, 3]
// arr2[0] = 10; // ❌ readonly
```

### 2.3 算法易错点

| 题目 | 易错点 | 正确做法 |
|------|--------|---------|
| 三数之和(#15) | 忘记去重导致重复答案 | 排序后跳过相同的 left/right |
| 反转链表(#206) | 丢失 next 指针 | 先存 next，再改指向 |
| 环形链表 II(#142) | 快指针判空 | 用 `fast?.next` 防空指针 |
| 合并区间(#56) | 忘记排序 | 先按左端点排序 |
| 矩阵置零(#73) | 用额外数组占空间 | 用第一行/列做标记 |
| 旋转图像(#48) | 旋转方向搞反 | 先转置再左右翻转 = 顺时针 90° |
| LRU Cache | 淘汰策略错误 | 删除 Map 第一个 key（最久未用）|
| 回文链表(#234) | 破坏了链表结构 | 反转后半部分，比较后最好恢复 |

---

## 知识点 3：口述 10 道 JS 基础题

### Q1：JavaScript 的数据类型有哪些？

**口述**：8 种。7 种原始类型：`string`、`number`、`boolean`、`null`、`undefined`、`symbol`、`bigint`，加上 1 种引用类型 `object`（包括 array、function、date 等）。原始类型存储在栈上，引用类型存储在堆上，变量存的是引用地址。`typeof null` 是 `'object'`，这是历史遗留 bug。

### Q2：== 和 === 的区别？

**口述**：`===` 是严格相等，类型不同直接 false，不转换。`==` 是宽松相等，会做类型转换。核心规则：null == undefined 为 true；NaN == NaN 为 false（用 Number.isNaN 判断）；对象和原始类型比较会调用 `valueOf()` 或 `toString()`。**面试中永远推荐用 `===`**。

### Q3：什么是闭包？有什么应用？

**口述**：闭包是一个函数加上它创建时的词法作用域。即使外层函数已经执行完毕，内层函数仍然可以访问外层的变量。常见应用：封装私有变量、防抖节流、柯里化、模块模式。**注意**：闭包会导致被引用的变量不被 GC 回收，需要及时释放。

### Q4：this 的指向规则？

**口述**：4 条规则按优先级：① `new` 调用 → 指向新对象；② 显式绑定（call/apply/bind）→ 指向传入的对象；③ 隐式绑定（obj.fn()）→ 指向 obj；④ 默认绑定 → 非严格模式是 window，严格模式是 undefined。箭头函数没有自己的 this，继承外层作用域。

### Q5：原型链是什么？

**口述**：每个对象都有 `__proto__` 指向它的构造函数的 `prototype`。沿着 `__proto__` 一层层往上找就形成了原型链，终点是 `null`。属性查找时先在自身找，找不到就沿原型链往上。`instanceof` 就是检查构造函数的 prototype 是否在对象的原型链上。

### Q6：深拷贝 vs 浅拷贝？

**口述**：浅拷贝只复制第一层，嵌套对象还是引用。方法：`Object.assign()`、展开运算符 `{...obj}`。深拷贝完全独立。方法：`JSON.parse(JSON.stringify())`（有循环引用和特殊类型丢失的问题）、递归实现、`structuredClone()`（现代 API）。**面试重点**：处理循环引用用 WeakMap 记录已拷贝对象。

### Q7：防抖和节流的区别？

**口述**：防抖 debounce：最后一次触发后等一段时间再执行，期间重复触发会重新计时。应用：搜索框输入。节流 throttle：一段时间内只执行一次，不管触发多少次。应用：滚动事件、resize。防抖用 setTimeout + clearTimeout，节流用时间戳或定时器。

### Q8：Event Loop 的执行机制？

**口述**：JS 单线程，通过 Event Loop 实现异步。执行顺序：同步代码 → 清空微任务队列（Promise.then、queueMicrotask）→ UI 渲染 → 取一个宏任务执行（setTimeout、I/O）→ 清空微任务 → 循环。**关键**：每个宏任务后都会清空全部微任务。

### Q9：ES6 新特性有哪些？你最常用的？

**口述**：最常用的：let/const（块级作用域）、箭头函数、解构赋值、模板字符串、Promise/async-await、Map/Set、展开运算符、可选链 `?.`、空值合并 `??`、class 语法、模块化 import/export。**面试重点**：let/const 的暂时性死区（TDZ）、箭头函数的 this 绑定差异。

### Q10：V8 的垃圾回收机制？

**口述**：分代回收。新生代用 Scavenge（复制算法），空间小（1-8MB），对象存活率低，速度快但空间利用率 50%。老生代用 Mark-Sweep（标记清除）+ Mark-Compact（标记整理），空间大，处理存活率高的对象。对象经过两次 Scavenge 仍存活会晋升到老生代。V8 还用增量标记避免长时间停顿。

---

## 知识点 4：本周力扣题解汇总

### 4.1 题目清单

| 题号 | 题目 | 难度 | 核心技巧 | Day |
|------|------|------|---------|-----|
| #283 | 移动零 | Easy | 双指针交换 | Day 2 |
| #11 | 盛水最多的容器 | Medium | 双指针收缩 | Day 2 |
| #15 | 三数之和 | Medium | 排序 + 双指针 + 去重 | Day 2 |
| #3 | 无重复字符的最长子串 | Medium | 滑动窗口 + Set | Day 3 |
| #438 | 找到字符串中所有字母异位词 | Medium | 固定窗口 + 频率数组 | Day 3 |
| #53 | 最大子数组和 | Easy | Kadane 算法 | Day 4 |
| #56 | 合并区间 | Medium | 排序 + 贪心合并 | Day 4 |
| #189 | 轮转数组 | Medium | 三次翻转 | Day 4 |
| #73 | 矩阵置零 | Medium | 第一行/列做标记 | Day 5 |
| #54 | 螺旋矩阵 | Medium | 模拟边界收缩 | Day 5 |
| #48 | 旋转图像 | Medium | 转置 + 左右翻转 | Day 5 |
| #206 | 反转链表 | Easy | 三指针迭代 | Day 6 |
| #234 | 回文链表 | Easy | 快慢指针 + 反转后半 | Day 6 |
| #142 | 环形链表 II | Medium | Floyd 判圈 | Day 6 |

### 4.2 算法技巧速查表

| 技巧 | 适用场景 | 代表题目 |
|------|---------|---------|
| 双指针 | 有序数组、链表、区间问题 | 三数之和、盛水最多容器 |
| 滑动窗口 | 连续子串/子数组 | 最长子串、字母异位词 |
| 快慢指针 | 链表中点、环检测 | 反转链表、环形链表 |
| 排序 + 贪心 | 区间合并、选择问题 | 合并区间 |
| 哈希表 | 快速查找、频率统计 | 两数之和、字母异位词 |
| 前缀和 | 快速区间求和 | 子数组和问题 |
| 虚拟头节点 | 链表边界处理 | 链表操作通用 |
| 三次翻转 | 数组原地操作 | 轮转数组 |
| 模拟 | 矩阵遍历 | 螺旋矩阵、旋转图像 |

---

## 🔧 手写题：错题回顾

### 回顾 1：手写 Promise（Day 2 核心）

> 如果还没完全掌握，今天的重点就是把 `resolvePromise` 的逻辑再走一遍。

```ts
// 关键回顾：
// 1. 状态不可逆：pending → fulfilled / rejected
// 2. then 返回新 Promise（链式调用的核心）
// 3. resolvePromise 处理 thenable（递归解析）
// 4. queueMicrotask 模拟异步（A+ 规范要求）
```

### 回顾 2：并发限制调度器

```ts
// 核心思路：
// - 维护 running 计数器 + 等待队列
// - 每次执行任务后 running--，然后 _run() 调度下一个
// - while (running < limit && queue.length > 0) 循环调度
```

### 回顾 3：LRU Cache

```ts
// 核心思路：
// - Map 保持插入顺序
// - get 时先 delete 再 set（移到最新位置）
// - 超容量时删除 keys().next().value（最久未使用）
```

---

## 💻 错题重做清单

以下题目如果之前不熟练，今天重点重做：

### 重做 1：三数之和（如果去重逻辑不熟）

```ts
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];

  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue; // 去重！

    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum < 0) left++;
      else if (sum > 0) right--;
      else {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++; right--;
      }
    }
  }
  return result;
}
```

### 重做 2：环形链表 II（如果数学推导不熟）

```ts
// 记忆口诀：快慢相遇 → 一个回起点 → 同速走 → 再遇就是入口
function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;
  while (fast?.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let ptr = head;
      while (ptr !== slow) {
        ptr = ptr!.next;
        slow = slow!.next;
      }
      return ptr;
    }
  }
  return null;
}
```

### 重做 3：手写 Utility Types

```ts
// 如果某些类型还不熟，今天手写一遍
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyOmit<T, K extends keyof T> = { [P in keyof T as P extends K ? never : P]: T[P] };
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;
type MyReturnType<T extends (...a: any) => any> = T extends (...a: any) => infer R ? R : never;
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;
type MyFlat<T extends any[]> = T extends [infer F, ...infer R]
  ? F extends any[] ? [...MyFlat<F>, ...MyFlat<R>] : [F, ...MyFlat<R>]
  : [];
type MyEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
```

---

## 📝 本周总结

### 知识掌握度自评

| 知识板块 | 自评（1-5） | 薄弱点 | 改进计划 |
|---------|-----------|--------|---------|
| JS 异步 | ⭐⭐⭐⭐ | 微任务嵌套顺序 | 多做执行顺序题 |
| Promise 手写 | ⭐⭐⭐ | resolvePromise 递归 | 重新手写一遍 |
| ES6+ 数据结构 | ⭐⭐⭐⭐ | WeakRef 用法少 | 找实际场景练习 |
| 模块化 | ⭐⭐⭐⭐ | 循环依赖细节 | 写 demo 验证 |
| TypeScript 泛型 | ⭐⭐⭐ | 多参数泛型约束 | 类型体操加强 |
| 条件类型/infer | ⭐⭐⭐ | 复杂 infer 位置 | 重做类型体操 |
| 算法-数组/链表 | ⭐⭐⭐⭐ | 去重逻辑 | 重复刷 |
| 算法-矩阵 | ⭐⭐⭐ | 螺旋矩阵边界 | 画图理解 |

### 关键收获 Top 5

1. **Event Loop 的执行本质**：不是简单的"微任务优先"，而是"每个宏任务后清空全部微任务"
2. **Promise 的核心**：then 返回新 Promise + resolvePromise 递归处理 thenable
3. **TypeScript 的层次**：基础类型 → 泛型 → 条件类型 → infer → 模板字面量，层层递进
4. **算法的本质**：双指针/滑动窗口/快慢指针是数组和链表题的万金油
5. **WeakMap 的价值**：弱引用自动 GC，是前端内存管理的关键数据结构

### 下周预告（第二阶段：框架与工程化）

第二阶段将进入：
- **Day 8**: Vue 3 Composition API
- **Day 9**: Vue 3 响应式原理（Proxy/Ref/Computed）
- **Day 10**: React 基础 + Hooks
- **Day 11**: React 状态管理 + 性能优化
- **Day 12**: Webpack/Vite 构建原理
- **Day 13**: Git 工作流 + CI/CD
- **Day 14**: 第二周复盘

基础阶段辛苦了，下周开始玩框架！🚀
