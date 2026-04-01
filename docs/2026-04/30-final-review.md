# 04/30 — 查漏补缺 + 心态调整（Day 30）

> **阶段**：第四阶段 工程化 + AI Agent + 综合冲刺
> **今日目标**：最终回顾，查漏补缺，以最佳状态迎接面试
> **投入时间**：上午 2h / 下午 1h / 其余时间休息调整

---

## 🔑 知识点 1：全月知识体系思维导图

### 总览

```
前端面试知识体系（30天覆盖）
│
├── 第一阶段：JS/TS 核心（Day 1-7）
│   ├── 执行机制：作用域链、闭包、this指向、原型链
│   ├── 异步编程：Event Loop、Promise、async/await
│   ├── ES6+：Map/Set/WeakMap、迭代器/生成器、模块化
│   ├── 内存管理：V8 GC、内存泄漏排查
│   └── TypeScript：类型系统、泛型、类型体操、Utility Types
│
├── 第二阶段：Vue 3 深度（Day 8-13）
│   ├── 响应式原理：Proxy + track + trigger
│   ├── 编译优化：PatchFlag、HoistStatic、Block Tree
│   ├── Composition API：ref/reactive/computed/watch
│   ├── 状态管理：Pinia（去 Mutations、TS 原生支持）
│   ├── 性能优化：懒加载、虚拟滚动、v-memo
│   └── SSR：Nuxt 3、Hydration、SSR vs SSG vs ISR
│
├── 第三阶段：React 18+（Day 14-20）
│   ├── Fiber 架构：双缓冲链表、时间切片、Lane 优先级
│   ├── Hooks：链表结构、闭包陷阱、useEffect 清理
│   ├── React 18：Concurrent Mode、useTransition、Suspense
│   ├── RSC：服务端组件 vs 客户端组件、流式渲染
│   ├── 状态管理：Redux Toolkit、Zustand、TanStack Query
│   ├── 性能：memo/useMemo/useCallback、hydration mismatch
│   └── 元框架：Next.js App Router、Server Actions、Edge Runtime
│
└── 第四阶段：工程化 + 冲刺（Day 21-30）
    ├── 构建工具：Vite 原理、Webpack 5、Monorepo
    ├── 网络安全：HTTP/2/3、XSS/CSRF、CSP、CORS
    ├── 性能全链路：Web Vitals、加载优化、监控 SDK
    ├── 测试：Vitest、Cypress/Playwright、测试金字塔
    ├── 微前端：qiankun、Module Federation、JS 沙箱
    ├── AI Agent：MCP、A2A、RAG、Function Calling
    └── 面试实战：模拟面试、简历优化、STAR 法则
```

---

## 🔑 知识点 2：Top 30 面试题终极速查

### JS 核心（8 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 1 | 闭包的内存泄漏怎么解决？ | 不再使用时解除引用 `fn = null` |
| 2 | 手写 bind 要考虑什么？ | 支持 new 调用时 this 指向新对象 |
| 3 | Promise.all vs allSettled？ | all 有一个失败就 reject，allSettled 等全部完成 |
| 4 | 深拷贝怎么处理循环引用？ | WeakMap 存已拷贝对象，遇到直接返回 |
| 5 | Event Loop 输出顺序？ | 同步→微任务→宏任务，async 内同步立即执行 |
| 6 | var/let/const 区别？ | var 函数作用域+提升，let/const 块级作用域+TDZ，const 不可重赋值 |
| 7 | 原型链终点？ | `Object.prototype.__proto__ === null` |
| 8 | 箭头函数 vs 普通函数？ | 箭头函数无自己的 this/arguments/prototype，不能 new |

### Vue 3（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 9 | Proxy vs defineProperty？ | Proxy 支持新增/删除属性、数组、Map/Set |
| 10 | computed 缓存怎么实现？ | lazy 求值 + dirty 标记，依赖不变就不重新计算 |
| 11 | Pinia vs Vuex？ | Pinia 无 Mutation、扁平化、setup 风格、TS 友好 |
| 12 | Vue 3 编译优化？ | PatchFlag + HoistStatic + Block Tree |
| 13 | SSR 水合不匹配？ | 服务端和客户端渲染结果不一致，常见原因是随机数/时间/环境变量 |

### React（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 14 | Fiber 解决什么问题？ | 长任务阻塞渲染，无法中断，用链表+时间切片实现可中断渲染 |
| 15 | Hooks 为什么必须顶层？ | 底层链表存储，顺序依赖，条件调用会状态错位 |
| 16 | RSC vs SSR？ | SSR 每次渲染 HTML+水合；RSC 只在服务端运行，不发 JS |
| 17 | useMemo 什么时候该用？ | 计算代价大的派生数据，不要用于简单计算 |
| 18 | Zustand 为什么轻量？ | 无 Provider、无 Reducer、无 Dispatch，直接 createStore |

### 工程化 + 网络 + 安全（5 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 19 | Vite 为什么比 Webpack 快？ | 开发时用 ESM 原生加载无需 bundle，HMR 精确更新单模块 |
| 20 | HTTP/2 多路复用？ | 一个 TCP 连接上并发多个请求/响应，解决队头阻塞 |
| 21 | XSS 存储型怎么防？ | CSP + 输出转义 + HttpOnly Cookie |
| 22 | CORS 预检请求？ | 非简单请求先发 OPTIONS，服务端返回允许的 Header/Method |
| 23 | MCP 是什么？ | Model Context Protocol，标准化 AI Agent 调用外部工具的协议 |

### CSS 布局（3 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 24 | BFC 是什么？怎么触发？ | 块级格式化上下文，overflow≠visible / display:flow-root 等可触发 |
| 25 | Flex 和 Grid 区别？ | Flex 一维布局（行或列），Grid 二维布局（行+列），Grid 更适合复杂页面骨架 |
| 26 | 水平垂直居中几种方案？ | flex:justify+align / grid:place-items / 定位+transform / margin:auto |

### TypeScript（2 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 27 | interface vs type？ | interface 可合并（declaration merging）、extends 更自然；type 能做联合/交叉/映射 |
| 28 | 泛型约束 extends 和 in 的区别？ | `extends` 约束类型范围，`in` 遍历联合类型成员（映射类型） |

### Git + 其他（2 题）

| # | 题目 | 一句话回答 |
|---|------|-----------|
| 29 | rebase vs merge？ | rebase 线性提交历史，merge 保留分支拓扑；公共分支用 merge，个人分支可用 rebase |
| 30 | CI/CD pipeline 关键阶段？ | lint → test → build → deploy；PR 触发 CI，merge 到 main 触发 CD |

---

## 🔑 知识点 3：高频手写题（面试终极必背）

### 手写题 1：Promise.all

```javascript
/**
 * Promise.all
 * - 全部 resolve → 按顺序返回结果数组
 * - 任一 reject → 立即 reject（短路）
 * - 支持可迭代对象
 */
function myPromiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const promises = Array.from(iterable);
    const results = new Array(promises.length);
    let settled = 0;

    if (promises.length === 0) {
      return resolve(results);
    }

    promises.forEach((p, index) => {
      Promise.resolve(p).then(
        (value) => {
          results[index] = value;  // 保证顺序
          settled++;
          if (settled === promises.length) resolve(results);
        },
        (reason) => reject(reason) // 短路
      );
    });
  });
}

// 测试
myPromiseAll([
  Promise.resolve(1),
  2,                        // 非 Promise 自动包装
  Promise.resolve(3)
]).then(console.log);       // [1, 2, 3]
```

> ⚠️ **易错点**：结果必须按输入顺序而非完成顺序存储！用 `index` 而不是 `push`。

### 手写题 2：防抖（debounce）

```javascript
/**
 * debounce 防抖
 * - 延迟 wait ms 执行，期间再次调用则重新计时
 * - leading: 是否在延迟开始时立即执行
 * - trailing: 是否在延迟结束后执行（默认 true）
 */
function debounce(fn, wait, { leading = false, trailing = true } = {}) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;
  let invoked = false;

  function cancel() {
    clearTimeout(timer);
    timer = null;
    invoked = false;
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    if (timer) clearTimeout(timer);

    if (leading && !invoked) {
      fn.apply(lastThis, lastArgs);
      invoked = true;
    }

    timer = setTimeout(() => {
      if (trailing && !leading) {
        fn.apply(lastThis, lastArgs);
      }
      timer = null;
      invoked = false;
    }, wait);
  }

  debounced.cancel = cancel;
  return debounced;
}

// 使用
const handleResize = debounce(() => console.log('resized'), 300);
window.addEventListener('resize', handleResize);
// handleResize.cancel() 可取消
```

> ⚠️ **易错点**：防抖的 `this` 必须绑定到调用者，不能丢失；`leading + trailing` 同时开启时要注意只执行一次。

### 手写题 3：柯里化（curry）

```javascript
/**
 * curry 柯里化
 * - 将 fn(a, b, c) → fn(a)(b)(c)
 * - 支持累计参数：curried(1, 2)(3) 也可以
 * - 参数够了自动执行
 */
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return (...moreArgs) => curried(...args, ...moreArgs);
  };
}

// 测试
const add = curry((a, b, c) => a + b + c);
console.log(add(1)(2)(3));     // 6
console.log(add(1, 2)(3));     // 6
console.log(add(1)(2, 3));     // 6
```

> ⚠️ **易错点**：`fn.length` 是函数定义时的参数个数（rest 参数不计）；如果不支持累计参数就不够实用。

---

## 🔑 知识点 4：精选算法题（面试高频）

### 算法题 1：两数之和（Two Sum）

```javascript
/**
 * LeetCode #1 —— 哈希表 O(n)
 * 题意：给定数组和目标值，返回两数下标
 * 考点：哈希表、边查找边存储
 */
function twoSum(nums, target) {
  const map = new Map(); // value → index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (map.has(complement)) {
      return [map.get(complement), i]; // 找到答案
    }

    map.set(nums[i], i); // 没找到，存入当前值
  }

  return []; // 无解
}

// O(n) 时间，O(n) 空间
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
```

> ⚠️ **面试追问**：
> - 为什么用 Map 不用对象？→ Map 支持任意键类型，性能更好
> - 如果数组有序？→ 双指针 O(n) 也可以，但要返回下标所以哈希表更直接
> - 为什么边遍历边存？→ 避免自己和自己配对

### 算法题 2：有效的括号（Valid Parentheses）

```javascript
/**
 * LeetCode #20 —— 栈 O(n)
 * 题意：判断括号串是否有效
 * 考点：栈、哈希映射配对
 */
function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };

  for (const char of s) {
    if (char in pairs) {
      // 右括号：检查栈顶是否匹配
      if (stack.pop() !== pairs[char]) return false;
    } else {
      // 左括号：入栈
      stack.push(char);
    }
  }

  return stack.length === 0; // 栈空才算完全匹配
}

console.log(isValid("({[]})")); // true
console.log(isValid("([)]"));   // false
```

> ⚠️ **面试追问**：
> - 长度为奇数能不能提前返回 false？→ 可以，奇数长度一定不匹配
> - 如果只有一种括号呢？→ 计数器即可，不需要栈
> - 栈最后不为空说明什么？→ 多余的左括号，如 `"((("`

---

## 🔑 知识点 5：面试前 Checklist + 心态调整

### 面试前一周

```
□ 回顾简历上每个项目：技术选型原因、遇到的挑战、优化成果
□ 梳理 3 个最拿手的项目（STAR 法则准备）
□ 准备好自我介绍（中英文各一版，计时 2 分钟以内）
□ 了解目标公司：产品、技术栈、最近的融资/新闻
□ 算法每天保持 1-2 题手感
```

### 面试前一晚

```
□ 简历打印 2 份（或准备好电子版 PDF）
□ 自我介绍过一遍，计时 2 分钟以内
□ 公司信息了解（做什么产品、技术栈、最近新闻）
□ 准备好 3 个反问问题（团队技术方向、项目挑战、成长路径）
□ 早点睡觉（23:00 前），设 2 个闹钟
```

### 面试当天时间线规划

```
面试时间 -60min：起床/洗漱，吃早餐，穿好正装
面试时间 -45min：最后过一遍速查表 Top 30，不要看新东西
面试时间 -30min：线上——检查网络/麦克风/摄像头/背景
                线下——出发，预留堵车时间
面试时间 -15min：到达/登录，深呼吸，告诉自己"我已经准备好了"
面试时间 -5min ：关闭无关页面/手机静音，纸笔放好
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🎯 面试开始
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
面试中：先听题 → 想 3 秒 → 有框架地回答 → 举例佐证
面试结束：感谢面试官 → 记录面试题 → 评估表现
```

### 面试中注意事项

```
□ 提前 10 分钟到（线上测试网络/麦克风/摄像头）
□ 带纸笔（画架构图用）
□ 遇到不会的题：诚实说"这个我不太了解，但我可以讲讲相关理解"
□ 不要急着回答，先想 3 秒再开口
□ 面试官给提示时要积极回应，不要沉默
□ 写代码时先说思路，再写，再测试用例
□ 面试结束主动问反问问题，展现兴趣
```

### 心态调整

> **你已经准备了 30 天，这比大多数人努力得多。**
>
> - 面试是双向选择，不是单方面被审判
> - 不会的题不代表你不行，只是这个点没覆盖到
> - 面试没过不代表你差，可能是匹配度问题
> - 每次面试都是练习，越面越强
> - **自信来自于准备充分——你已经准备好了**
>
> **面对压力的 3 个小技巧：**
> 1. 深呼吸法：面试前做 4-7-8 呼吸（吸 4 秒→屏 7 秒→呼 8 秒）
> 2. 正面暗示："我是来展示能力的，不是来被考倒的"
> 3. 最坏情况：即使这场没过，下一场会更好，因为面经又积累了一份

---

## ⚠️ 面试常见误区 ❌/✅ 对比表

### JS 基础误区

| ❌ 常见错误说法 | ✅ 正确回答 |
|----------------|-----------|
| "var 是全局作用域" | var 是**函数作用域**，在全局声明才挂到 window |
| "let 不能提升" | let 有提升，但在 TDZ（暂时性死区）内不能访问 |
| "闭包就是函数里面套函数" | 闭包是函数 + 它能访问的外部词法环境的组合 |
| "Promise.all 只要有一个 reject 就全失败" | ✅ 这是对的，但要补充：Promise.allSettled 不会短路 |
| "深拷贝用 JSON.parse(JSON.stringify()) 就行" | ❌ 丢失 undefined/函数/Symbol/循环引用/Date/RegExp |

### Vue 误区

| ❌ 常见错误说法 | ✅ 正确回答 |
|----------------|-----------|
| "Vue 3 用 Proxy 所以没有响应式限制" | Proxy 仍然对基本类型需要 ref 包装 |
| "computed 不能传参数" | computed 接受 get/set 对象，派生值可通过 getter 处理 |
| "Pinia 就是 Vuex 5" | Pinia 是独立库，API 完全不同，Vuex 5 计划已取消 |

### React 误区

| ❌ 常见错误说法 | ✅ 正确回答 |
|----------------|-----------|
| "useEffect 的依赖数组为空就等于 componentDidMount" | 不完全等价：useEffect 在**渲染后**异步执行，componentDidMount 同步 |
| "React 18 自动开启并发模式" | 需要使用 concurrent API（如 useTransition）才启用并发特性 |
| "RSC 就是在服务端渲染组件" | RSC 组件在服务端运行、序列化结果发到客户端，不走 hydration |

### CSS 误区

| ❌ 常见错误说法 | ✅ 正确回答 |
|----------------|-----------|
| "BFC 元素不会和浮动元素重叠" | BFC 区域**不会**与同级浮动元素重叠（这才是正确结论） |
| "position:fixed 相对于视口" | 大多数情况对，但祖先有 transform/filter/backdrop-filter 时会相对该祖先 |
| "margin 塌陷只发生在父子元素" | 也发生在相邻兄弟的上下 margin 之间 |

### 工程化误区

| ❌ 常见错误说法 | ✅ 正确回答 |
|----------------|-----------|
| "Vite 生产环境不用打包" | Vite 生产用 Rollup 打包，只有开发时用 ESM 原生加载 |
| "Tree Shaking 是 Vite/Webpack 做的" | Tree Shaking 是**Rollup/Terser** 的能力，打包工具是利用它 |
| "HTTPS 就是安全的" | HTTPS 防窃听不防 XSS，CSP 才防 XSS |

---

## ⚠️ 高频易错提示

### JS 易错

```javascript
// ❌ 经典面试陷阱 1：this 丢失
const obj = {
  name: 'Penny',
  greet() { return this.name; }
};
const fn = obj.greet;
console.log(fn()); // undefined —— 方法赋值给变量后 this 丢失

// ✅ 修复：用 bind/箭头函数
const fn2 = obj.greet.bind(obj);
console.log(fn2()); // 'Penny'
```

```javascript
// ❌ 经典面试陷阱 2：for 循环中 var
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 3, 3, 3 —— var 是函数作用域，共享同一个 i

// ✅ 修复：用 let（块级作用域）
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 0, 1, 2
```

```javascript
// ❌ 经典面试陷阱 3：浮点数精度
console.log(0.1 + 0.2 === 0.3); // false

// ✅ 修复：用误差范围判断
console.log(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON); // true
```

### Vue 易错

```javascript
// ❌ 解构 reactive 会丢失响应式
const state = reactive({ count: 0 });
let { count } = state; // count 是 number，不是响应式！

// ✅ 用 toRefs 或直接 state.count
const { count } = toRefs(state); // count 是 Ref<number>
```

```javascript
// ❌ watch 监听 ref 不加 .value
watch(count, (newVal) => { /* ... */ }); // 报错或不生效

// ✅ 监听 ref 用 getter 函数或直接传 ref
watch(() => count.value, (newVal) => { /* ... */ });
// 或（Vue 3.4+ 的 ref 自动解包）
watch(count, (newVal) => { /* ... */ }); // 直接传 ref 也行
```

### React 易错

```javascript
// ❌ useEffect 闭包陷阱
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 永远是 0 —— 闭包捕获了初始值
      setCount(count + 1); // 永远设为 1
    }, 1000);
    return () => clearInterval(timer);
  }, []); // 空依赖，count 是初始快照

  return <div>{count}</div>;
}

// ✅ 修复：用函数式更新
setCount(prev => prev + 1); // 不依赖闭包中的 count
```

```javascript
// ❌ 数组/对象状态直接修改
state.items.push(newItem);  // React 不会重新渲染
setState(state);            // 引用没变

// ✅ 创建新引用
setState(prev => ({ ...prev, items: [...prev.items, newItem] }));
```

### CSS 易错

```css
/* ❌ z-index 不生效 */
.child { z-index: 999; } /* 没效果，因为父元素没创建层叠上下文 */

/* ✅ 父元素需要 position + z-index（非 auto） */
.parent { position: relative; z-index: 1; }
.child { z-index: 999; } /* 在父的层叠上下文中生效 */
```

```css
/* ❌ 百分比高度不生效 */
.parent { height: 300px; }
.child { height: 50%; } /* 如果父元素没设固定高度，50% 没有参考 */
```

---

## 📝 全月总结

### 30 天成长回顾

| 阶段 | Day | 核心收获 |
|------|-----|---------|
| JS/TS 核心 | 1-7 | 闭包/this/原型链能秒答，手写 Promise/bind/LRU，TS 类型体操熟练 |
| Vue 3 深度 | 8-13 | 响应式源码级理解，Pinia/Composables 实战，Nuxt 3 SSR |
| React 18+ | 14-20 | Fiber/Hooks 原理，RSC、Next.js App Router，状态管理选型 |
| 工程化+冲刺 | 21-30 | Vite/Webpack 原理，Web 安全，微前端/MCP/AI Agent，模拟面试 |

### 你已经掌握的能力

1. **JS/TS 底层原理**：面试官追问到源码级别也能从容应对
2. **Vue3 杀手锏级理解**：从响应式到编译优化，全面碾压
3. **React 18+ 精通级**：Fiber、RSC、元框架，和 Vue 同等自信
4. **AI 协作 + Agent 开发**：MCP、RAG、Function Calling，2026 核心竞争力
5. **工程化全链路**：构建、测试、部署、监控，体现 3 年经验素养
6. **算法能力**：力扣 Hot 100 完成 60+ 题
7. **面试实战能力**：经过模拟面试，能自信流利地展示自己
8. **手写能力**：Promise.all、防抖、柯里化、bind、深拷贝等高频手写题信手拈来
9. **CSS 布局功力**：BFC、Flex、Grid、居中方案全面掌握
10. **Git 工作流**：rebase vs merge、CI/CD pipeline 能清晰讲解

---

## 🏆 最终寄语

> **30 天，从"会用"到"精通"，从"背八股"到"讲原理"。**
>
> 面试不是终点，而是新征程的起点。
> 带着这 30 天的积累，去拿到你心仪的 Offer 吧！
>
> **加油，你已经准备好了！** 🔥✨

---

_📖 30 天前端面试冲刺 — Day 30 终章_
