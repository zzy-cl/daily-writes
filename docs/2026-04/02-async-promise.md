# 04/02 — JS 异步与 Promise（Day 2）

> **阶段**：第一阶段 前端基础强化
> **今日目标**：彻底掌握 Event Loop、Promise/Await 机制，手写 Promise 完整实现
> **投入时间**：上午 2h / 下午 2h / 晚上 3h 算法

---

## 知识点 1：Event Loop 执行机制

### 1.1 宏任务与微任务 ⭐

JavaScript 是**单线程**语言，通过 Event Loop 实现异步。核心分层：

| 层级 | 宏任务 (MacroTask) | 微任务 (MicroTask) |
|------|-------------------|-------------------|
| 来源 | setTimeout、setInterval、I/O、UI 渲染 | Promise.then/catch/finally、queueMicrotask、MutationObserver |
| 执行时机 | 每轮 Event Loop 取**一个**宏任务 | 每轮宏任务执行**后**，清空**全部**微任务 |
| 优先级 | 低 | **高** |

🔑 **核心规则**：执行一个宏任务 → 清空所有微任务 → UI 渲染 → 下一个宏任务

### 1.2 经典执行顺序题 ⭐⚠️

```js
console.log('1'); // 宏任务：同步

setTimeout(() => {
  console.log('2'); // 宏任务回调
  Promise.resolve().then(() => console.log('3'));
}, 0);

Promise.resolve().then(() => {
  console.log('4'); // 微任务
  setTimeout(() => console.log('5'), 0);
});

console.log('6'); // 同步

// 输出顺序：1 → 6 → 4 → 2 → 3 → 5
// 详解：
// 第1轮同步：打印 1、6，注册 setTimeout(cb1) 和 Promise.then(cb2)
// 第1轮微任务：cb2 执行 → 打印 4，注册 setTimeout(cb3)
// 第2轮宏任务：cb1 执行 → 打印 2，注册 Promise.then(cb4)
// 第2轮微任务：cb4 执行 → 打印 3
// 第3轮宏任务：cb3 执行 → 打印 5
```

### 1.3 async/await 与微任务 ⭐⚠️

```js
async function async1() {
  console.log('async1 start'); // 同步执行
  await async2();
  // await 后面的代码等价于 .then 回调 → 微任务
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
async1();
new Promise((resolve) => {
  console.log('promise1'); // executor 是同步的
  resolve();
}).then(() => {
  console.log('promise2');
});
console.log('script end');

// 输出：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end     ← 微任务1
// promise2       ← 微任务2
// setTimeout     ← 宏任务
```

⚠️ **易错点**：`await fn()` 会**先同步执行 fn()**，再把后续代码挂到微任务队列。

### 1.4 Node.js Event Loop 差异

| 阶段 | 回调类型 |
|------|---------|
| timers | setTimeout / setInterval 回调 |
| pending | 系统级回调（TCP 错误等） |
| poll | I/O 回调（fs.readFile 等） |
| check | **setImmediate** 回调 |
| close | socket.on('close') 等 |

> Node 11+ 行为已与浏览器趋同：每个宏任务后立即清空微任务。

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| 宏任务和微任务的区别？ | 宏任务每轮取一个执行，微任务在每个宏任务后**全部执行完毕** |
| `await` 后面的代码是宏任务还是微任务？ | 微任务（等价于 `.then` 回调） |
| `Promise.resolve().then()` 和 `setTimeout()` 谁先？ | Promise.then 先（微任务优先级高于宏任务） |
| `process.nextTick` 和 `Promise.then` 谁先？ | nextTick 先（Node.js 中 nextTick 优先级最高） |

---

## 知识点 2：Promise 状态机 ⭐

### 2.1 三种状态

```
    ┌─────────────┐
    │  pending    │
    └──┬──────┬───┘
       │      │
  resolve() reject()
       │      │
       ▼      ▼
┌──────────┐ ┌──────────┐
│fulfilled │ │ rejected │
└──────────┘ └──────────┘
```

- **pending**：初始状态，可变
- **fulfilled**：已成功，不可再变
- **rejected**：已失败，不可再变

⚠️ **关键**：状态**一旦改变就不可逆**。多次调用 `resolve()` / `reject()` 只有第一次生效。

### 2.2 链式调用规则

```js
Promise.resolve(1)
  .then(val => {
    console.log(val); // 1
    return val + 1;   // 返回值被包装成 Promise.resolve(2)
  })
  .then(val => {
    console.log(val); // 2
    throw new Error('oops');
  })
  .catch(err => {
    console.log(err.message); // 'oops'
    return 'recovered';       // catch 也能恢复链路
  })
  .then(val => {
    console.log(val); // 'recovered'
  });
```

✅ **规则总结**：
1. `.then()` 返回新 Promise（链式调用的核心）
2. 回调中 `return 普通值` → 自动包装成 `Promise.resolve(值)`
3. 回调中 `throw` → 进入下一个 `.catch()`
4. 回调中 `return Promise` → 以该 Promise 的状态为准
5. `.catch()` 本身也是 `.then(null, onRejected)` 的语法糖

### 2.3 ⚠️ 常见陷阱

```js
// ❌ 错误：忘记 return 导致链断裂
Promise.resolve(1)
  .then(val => {
    val + 1; // 没有 return！返回 undefined
  })
  .then(val => {
    console.log(val); // undefined，不是 2
  });

// ✅ 正确
Promise.resolve(1)
  .then(val => {
    return val + 1; // 显式 return
  })
  .then(val => {
    console.log(val); // 2
  });
```

```js
// ❌ 错误：.catch() 位置不当
Promise.resolve()
  .then(() => { throw new Error('e1'); })
  .then(() => console.log('不会执行'))
  .catch(err => console.log(err.message)); // 'e1'

// ⚠️ 注意：catch 能捕获前面链上所有未被捕获的错误
// 但如果 then 中间有人 catch 了，后面的 catch 就收不到了
```

### 2.4 Promise 静态方法对比 ⭐

| 方法 | 行为 | 返回值 | 全 reject 时 |
|------|------|--------|-------------|
| `Promise.all` | **全部成功**才成功 | 按顺序的结果数组 | 抛出**第一个** reject 值 |
| `Promise.allSettled` | **全部结束**即成功 | `{status, value/reason}[]` | 永远不 reject |
| `Promise.race` | **第一个结束**就结束 | 第一个结束的值/reason | 第一个 reject |
| `Promise.any` | **第一个成功**就成功 | 第一个成功值 | `AggregateError` |
| `Promise.resolve` | 包装为 fulfilled | — | — |
| `Promise.reject` | 包装为 rejected | — | — |

```js
// ✅ Promise.allSettled 示例 — 适合批量请求不中断
const results = await Promise.allSettled([
  fetch('/api/a'),
  fetch('/api/b'),
  fetch('/api/c'),
]);
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value);
  else console.error(r.reason);
});

// ❌ 如果用 Promise.all，一个失败全部中断
try {
  await Promise.all([fetch('/api/a'), fetch('/api/b'), fetch('/api/c')]);
} catch (e) {
  // 只能拿到第一个失败的错误，其他结果丢失
}
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| `Promise.all` vs `Promise.allSettled` 区别？ | all 要求全部成功，任一失败立即返回；allSettled 等全部结束，返回每个的结果状态 |
| 如何实现并发限制？ | 自定义调度器（见手写题） |
| `.then` 和 `.catch` 的区别？ | `.catch(onRejected)` 是 `.then(null, onRejected)` 的语法糖 |
| Promise 中的错误如果不 catch 会怎样？ | 浏览器控制台报 `UnhandledPromiseRejectionWarning`（Node 15+ 会直接终止进程） |

---

## 知识点 3：async/await 最佳实践 ⭐

### 3.1 基本语法

```js
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('请求失败:', err);
    throw err; // 重新抛出让调用方处理
  }
}
```

### 3.2 并发 vs 串行 ⚠️

```js
// ❌ 串行执行（慢！） — 3个请求依次等待
async function serial() {
  const a = await fetch('/api/a');
  const b = await fetch('/api/b');
  const c = await fetch('/api/c');
  return [await a.json(), await b.json(), await c.json()];
}

// ✅ 并发执行（快！） — 3个请求同时发起
async function concurrent() {
  const [a, b, c] = await Promise.all([
    fetch('/api/a'),
    fetch('/api/b'),
    fetch('/api/c'),
  ]);
  return Promise.all([a.json(), b.json(), c.json()]);
}
```

🔑 **记忆法**：没有依赖关系的请求用 `Promise.all`，有依赖关系才串行 `await`。

### 3.3 错误捕获最佳实践

```js
// 方案一：try/catch — 最通用
async function load() {
  try {
    const data = await getData();
    return data;
  } catch (err) {
    handleError(err);
  }
}

// 方案二：.catch() 包装 — 更简洁
async function load2() {
  const [err, data] = await getData().then(
    d => [null, d],
    e => [e, null]
  );
  if (err) return handleError(err);
  useData(data);
}

// 方案三：高阶函数封装 — 生产推荐
function to(promise) {
  return promise.then(data => [null, data]).catch(err => [err, null]);
}
async function load3() {
  const [err, res] = await to(fetch('/api/data'));
  if (err) return handleError(err);
  useData(res);
}
```

### 3.4 循环中的 async/await ⚠️

```js
const urls = ['/a', '/b', '/c'];

// ❌ forEach 中的 async 不会等待
urls.forEach(async (url) => {
  await fetch(url); // 这里 await 无效，forEach 不会等它
});

// ✅ 方案一：for...of 串行
for (const url of urls) {
  const res = await fetch(url); // 依次执行
}

// ✅ 方案二：Promise.all 并行
await Promise.all(urls.map(url => fetch(url)));

// ✅ 方案三：限制并发（见手写题）
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| async 函数返回什么？ | 一定返回 Promise。return value → Promise.resolve(value); throw → Promise.reject(err) |
| for...of 和 for...in 遍历 async? | for...of 能正确等待，for...in 不行 |
| await 只能在哪里使用？ | async 函数内部，或 ES2022 模块顶层 |

---

## 🔧 手写题（3 道）

### 手写题 1：手写 Promise 完整实现

```js
/**
 * 手写 Promise 完整实现（符合 Promises/A+ 规范）
 * 支持：链式调用、异步回调、状态不可逆、resolvePromise 规范
 */
class MyPromise {
  // 1. 定义三种状态常量
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  /**
   * @param {Function} executor - 同步执行器 (resolve, reject) => {}
   */
  constructor(executor) {
    // 2. 初始化状态和值
    this.status = MyPromise.PENDING;
    this.value = undefined;
    this.reason = undefined;
    // 3. 存储回调队列（支持异步 + 多次 .then）
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      // 4. 只有 pending 才能改变状态
      if (this.status === MyPromise.PENDING) {
        // 支持 resolve Promise 的情况
        if (value instanceof MyPromise) {
          return value.then(resolve, reject);
        }
        this.status = MyPromise.FULFILLED;
        this.value = value;
        // 5. 发布：依次执行所有成功回调
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    };

    const reject = (reason) => {
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };

    // 6. 执行 executor，捕获同步异常
    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  /**
   * 核心：then 方法
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   * @returns {MyPromise}
   */
  then(onFulfilled, onRejected) {
    // 7. 值穿透：如果不是函数，就透传
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e; };

    // 8. 返回新 Promise 实现链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = () => {
        // 9. 用微任务模拟异步（A+ 规范要求）
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value);
            // 10. 解析 x 与 promise2 的关系（A+ 核心）
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      };

      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      };

      // 11. 根据当前状态决定是立即执行还是入队等待
      if (this.status === MyPromise.FULFILLED) {
        handleFulfilled();
      } else if (this.status === MyPromise.REJECTED) {
        handleRejected();
      } else {
        // pending：订阅
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      value => MyPromise.resolve(onFinally()).then(() => value),
      reason => MyPromise.resolve(onFinally()).then(() => { throw reason; })
    );
  }

  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  /**
   * Promise.all 实现
   * @param {MyPromise[]} promises
   * @returns {MyPromise}
   */
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let completed = 0;
      const len = promises.length;
      if (len === 0) return resolve([]);

      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(
          value => {
            results[i] = value; // 保证顺序
            completed++;
            if (completed === len) resolve(results);
          },
          reason => reject(reason) // 任一失败立即 reject
        );
      });
    });
  }

  /**
   * Promise.race 实现
   * @param {MyPromise[]} promises
   * @returns {MyPromise}
   */
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(p => {
        MyPromise.resolve(p).then(resolve, reject);
      });
    });
  }

  static allSettled(promises) {
    return new MyPromise(resolve => {
      const results = [];
      let completed = 0;
      const len = promises.length;
      if (len === 0) return resolve([]);

      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(
          value => {
            results[i] = { status: 'fulfilled', value };
            if (++completed === len) resolve(results);
          },
          reason => {
            results[i] = { status: 'rejected', reason };
            if (++completed === len) resolve(results);
          }
        );
      });
    });
  }
}

/**
 * A+ 规范的 resolvePromise：解析 thenable
 * @param {MyPromise} promise2 - 新返回的 Promise
 * @param {*} x - onFulfilled/onRejected 的返回值
 * @param {Function} resolve
 * @param {Function} reject
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 12. 不能返回自己（循环引用）
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected'));
  }
  // 13. x 是对象或函数，可能是 thenable
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false;
    try {
      const then = x.then;
      if (typeof then === 'function') {
        // 14. thenable：调用 then 并递归解析
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        // 15. 普通对象直接 resolve
        resolve(x);
      }
    } catch (err) {
      if (!called) {
        called = true;
        reject(err);
      }
    }
  } else {
    // 16. 基本类型直接 resolve
    resolve(x);
  }
}
```

**测试用例：**

```js
// 基础测试
new MyPromise(resolve => resolve(42)).then(v => console.log(v)); // 42

// 异步测试
new MyPromise(resolve => setTimeout(() => resolve('async'), 100))
  .then(v => console.log(v)); // 'async'

// 链式调用
MyPromise.resolve(1)
  .then(v => v + 1)
  .then(v => v + 1)
  .then(v => console.log(v)); // 3

// 错误捕获
MyPromise.resolve().then(() => { throw 'err'; })
  .catch(e => console.log(e)); // 'err'

// all 测试
MyPromise.all([MyPromise.resolve(1), MyPromise.resolve(2)])
  .then(v => console.log(v)); // [1, 2]

// race 测试
MyPromise.race([
  new MyPromise(r => setTimeout(() => r('slow'), 100)),
  new MyPromise(r => setTimeout(() => r('fast'), 10)),
]).then(v => console.log(v)); // 'fast'
```

---

### 手写题 2：并发限制调度器

```js
/**
 * 实现并发限制调度器
 * 最多同时执行 limit 个异步任务
 *
 * @example
 * const scheduler = new Scheduler(2);
 * scheduler.add(() => fetch('/a')).then(console.log);
 * scheduler.add(() => fetch('/b')).then(console.log);
 * scheduler.add(() => fetch('/c')).then(console.log); // 等前两个之一完成
 */
class Scheduler {
  /** @param {number} limit - 最大并发数 */
  constructor(limit) {
    this.limit = limit;     // 1. 并发上限
    this.running = 0;       // 2. 当前正在执行数
    this.queue = [];        // 3. 等待队列
  }

  /**
   * @param {() => Promise} task - 返回 Promise 的任务函数
   * @returns {Promise} - 任务完成后 resolve
   */
  add(task) {
    return new Promise((resolve) => {
      // 4. 将任务包装成 { task, resolve } 放入队列
      this.queue.push({ task, resolve });
      this._run();
    });
  }

  _run() {
    // 5. 如果还有空位且队列不为空
    while (this.running < this.limit && this.queue.length > 0) {
      const { task, resolve } = this.queue.shift();
      this.running++;
      // 6. 执行任务，完成后释放一个位置
      task().then(resolve).finally(() => {
        this.running--;
        this._run(); // 7. 递归调度下一个
      });
    }
  }
}

// 测试用例
const scheduler = new Scheduler(2);
const timeout = (time) => () => new Promise(r => setTimeout(r, time));

scheduler.add(timeout(1000)).then(() => console.log(1)); // 1000ms后
scheduler.add(timeout(500)).then(() => console.log(2));  // 500ms后
scheduler.add(timeout(300)).then(() => console.log(3));  // 800ms后（等前面完成）
scheduler.add(timeout(400)).then(() => console.log(4));  // 900ms后

// 输出：2 → 1 → 3 → 4（时间可能略有偏差）
// 并发度：最多2个同时执行
```

---

### 手写题 3：retry 重试函数

```js
/**
 * 异步重试函数
 * @param {Function} fn - 返回 Promise 的异步函数
 * @param {number} retries - 最大重试次数
 * @param {number} delay - 重试间隔(ms)
 * @returns {Promise}
 */
async function retry(fn, retries = 3, delay = 1000) {
  // 1. 尝试执行
  try {
    return await fn();
  } catch (err) {
    // 2. 还有重试次数
    if (retries > 0) {
      console.log(`重试，剩余 ${retries} 次`);
      // 3. 等待 delay 毫秒
      await new Promise(r => setTimeout(r, delay));
      // 4. 递归重试，次数 -1
      return retry(fn, retries - 1, delay);
    }
    // 5. 次数用尽，抛出错误
    throw err;
  }
}

// 测试用例
let callCount = 0;
async function flakyFetch() {
  callCount++;
  if (callCount < 3) throw new Error('网络错误');
  return '成功';
}

retry(flakyFetch, 3, 500)
  .then(res => console.log(res))   // '成功'
  .catch(err => console.error(err));
```

---

## 💻 算法题

### 算法题 1：移动零（LeetCode #283）

**思路**：双指针法。用 `j` 指向下一个非零元素要放置的位置，遍历数组将非零元素前移，最后将剩余位置填零。

| 解法 | 时间复杂度 | 空间复杂度 | 特点 |
|------|-----------|-----------|------|
| 双指针 | O(n) | O(1) | ✅ 最优，原地操作 |
| 额外数组 | O(n) | O(n) | 简单但占空间 |
| 两次遍历 | O(n) | O(1) | 先移非零，再补零 |

```js
/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {
  let j = 0; // j: 下一个非零元素应放的位置

  // 第一步：将所有非零元素按顺序移到前面
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      [nums[i], nums[j]] = [nums[j], nums[i]]; // 交换
      j++;
    }
  }
  // 时间 O(n)，空间 O(1)
};

// 测试
const arr1 = [0, 1, 0, 3, 12];
moveZeroes(arr1);
console.log(arr1); // [1, 3, 12, 0, 0]

const arr2 = [0];
moveZeroes(arr2);
console.log(arr2); // [0]
```

---

### 算法题 2：盛水最多的容器（LeetCode #11）

**思路**：双指针从两端向中间收缩。面积 = min(height[left], height[right]) × (right - left)。每次移动较矮的那根指针，因为移动较高的指针只会让面积减小。

```js
/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
  let left = 0, right = height.length - 1;
  let max = 0;

  while (left < right) {
    // 计算当前面积
    const area = Math.min(height[left], height[right]) * (right - left);
    max = Math.max(max, area);

    // 移动较矮的一边（才有机会找到更大的面积）
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return max;
  // 时间 O(n)，空间 O(1)
};

// 测试
console.log(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])); // 49
console.log(maxArea([1, 1])); // 1
```

---

### 算法题 3：三数之和（LeetCode #15）

**思路**：排序 + 双指针。固定一个数，用双指针找另外两个数使得三数之和为 0。注意去重。

```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
  nums.sort((a, b) => a - b); // 先排序
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    // 剪枝：最小的数 > 0 则不可能
    if (nums[i] > 0) break;
    // 去重：跳过相同的第一个数
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1, right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        // 找到一组
        result.push([nums[i], nums[left], nums[right]]);
        // 去重：跳过相同的 left 和 right
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      }
    }
  }
  return result;
  // 时间 O(n²)，空间 O(1)（不计输出）
};

// 测试
console.log(threeSum([-1, 0, 1, 2, -1, -4]));
// [[-1, -1, 2], [-1, 0, 1]]

console.log(threeSum([0, 0, 0]));
// [[0, 0, 0]]

console.log(threeSum([]));
// []
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Event Loop | 宏任务→清空微任务→渲染→下一个宏任务 | ⭐⭐⭐⭐⭐ |
| Promise 状态机 | pending→fulfilled/rejected，状态不可逆 | ⭐⭐⭐⭐⭐ |
| async/await | await 后是微任务，串行 vs 并行区分 | ⭐⭐⭐⭐⭐ |
| 手写 Promise | A+ 规范、resolvePromise 递归、thenable | ⭐⭐⭐⭐ |
| 并发限制调度器 | 队列 + 计数器 | ⭐⭐⭐ |
| 双指针法 | 移零、盛水、三数之和都用到 | ⭐⭐⭐⭐⭐ |

### 🔑 今日关键收获
1. `await` 不是"等待"，是把后面的代码挂到微任务队列
2. `.then()` 不写 return 会导致链断裂
3. Promise.all 和 Promise.allSettled 适用场景完全不同
4. 双指针是数组类题目的万金油

---

## 📌 明天预告（Day 3）

Day 3 进入 **JS 进阶与内存管理**：
- ES6+ 数据结构（Map/Set/WeakMap）
- 迭代器与生成器
- V8 垃圾回收机制
- 前端内存泄漏排查

准备好深入 JS 引擎底层了吗？🔥
