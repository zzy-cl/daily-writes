# 04/01 — JS 执行机制与闭包（Day 1）

> **阶段**：第一阶段 JS/TS 核心夯实
> **今日目标**：作用域链 + 闭包 + this 指向 + 原型链，手写 5 道核心题
> **投入时间**：上午 2h / 下午 2h / 晚上 30-45min 算法

---

## 知识点 1：作用域与作用域链

### 什么是作用域

作用域决定了**变量和函数的可访问范围**。JS 采用**词法作用域**（静态作用域）——作用域在代码编写时就确定了，而不是运行时。

```javascript
// 全局作用域
const globalVar = 'I am global'

function outer() {
  // outer 函数作用域
  const outerVar = 'I am outer'

  function inner() {
    // inner 函数作用域
    const innerVar = 'I am inner'
    console.log(globalVar) // ✅ 可以访问全局
    console.log(outerVar)  // ✅ 可以访问 outer
    console.log(innerVar)  // ✅ 可以访问自己
  }

  inner()
  // console.log(innerVar) // ❌ ReferenceError — inner 的变量 outer 访问不了
}

outer()
```

### 作用域链

当访问一个变量时，JS 引擎会**从当前作用域开始，逐层向外查找**，直到全局作用域。这条查找链就是**作用域链**。

```javascript
const a = 1

function foo() {
  const b = 2
  function bar() {
    const c = 3
    console.log(a + b + c) // 查找顺序: bar → foo → global
  }
  bar()
}
foo() // 6
```

> 🔑 **关键理解**：作用域链是在**函数定义时**确定的，不是调用时。这就是闭包的基础。

### 三种作用域

| 类型 | ES 版本 | 特点 |
|------|---------|------|
| 全局作用域 | ES5+ | 最外层，任何地方都能访问 |
| 函数作用域 | ES5+ | `var` 声明的变量属于函数作用域 |
| 块级作用域 | ES6+ | `let`/`const` 在 `{}` 内形成独立作用域 |

```javascript
// var — 函数作用域
function test() {
  if (true) {
    var x = 10
  }
  console.log(x) // 10 — var 不受块限制
}

// let/const — 块级作用域
function test2() {
  if (true) {
    let y = 10
  }
  // console.log(y) // ReferenceError — y 被限制在 if 块内
}
```

### var 的变量提升（Hoisting）

```javascript
// var 的声明会提升，但赋值不会
console.log(a) // undefined（不是 ReferenceError！）
var a = 10
console.log(a) // 10

// 等价于：
var a           // 声明提升到顶部
console.log(a)  // undefined
a = 10          // 赋值留在原地
console.log(a)  // 10

// let/const 也有提升，但在声明前访问会报错（暂时性死区 TDZ）
// console.log(b) // ReferenceError: Cannot access 'b' before initialization
let b = 20
```

> ⚠️ **面试常问**：`let` 和 `const` 有没有变量提升？
> 答：有提升，但存在**暂时性死区（TDZ）**——从进入作用域到声明语句之间，变量不能被访问。所以实际效果等同于"没有提升"。

---

## 知识点 2：闭包（Closure）

### 执行上下文基础

理解闭包之前，先理解**执行上下文（Execution Context）**和**调用栈（Call Stack）**：

```javascript
function a() {
  function b() {
    console.log('b')
  }
  b()
}
a()
```

调用栈变化：
```
1. push 全局上下文
2. push a 的执行上下文（包含 a 的变量对象、作用域链、this）
3. push b 的执行上下文
4. b 执行完毕 → pop b
5. a 执行完毕 → pop a
6. 全局上下文一直存在
```

每个执行上下文包含三部分：
- **变量对象（VO）**：存放当前作用域的变量、函数声明
- **作用域链**：当前 VO + 所有父级 VO
- **this 指向**

### 什么是闭包

**闭包 = 函数 + 它被创建时的词法作用域环境**。

简单说：一个函数可以访问它**定义时**所在作用域的变量，即使那个作用域的外层函数已经执行完毕。

```javascript
function createCounter() {
  let count = 0 // 这个变量被闭包"记住"了

  return function () {
    count++
    return count
  }
}

const counter = createCounter()
console.log(counter()) // 1
console.log(counter()) // 2
console.log(counter()) // 3
// createCounter 已经执行完了，但 count 没有被销毁！
```

### 闭包的本质

```
┌─ createCounter 执行完毕 ──────────────┐
│  执行上下文已从调用栈弹出              │
│  但 count 变量没有被 GC 回收           │
│  因为返回的函数仍然引用着它            │
└──────────────────────────────────────┘
         ↑
    内部函数的作用域链
    仍然指向这个变量对象
```

普通函数执行完 → 变量对象被 GC 回收。
有闭包引用 → 变量对象**不会被回收**，因为还有引用指向它。

### 闭包的应用场景

**1. 数据封装 / 私有变量**

```javascript
function createUser(name) {
  let _password = 'default123' // 外部无法直接访问

  return {
    getName: () => name,
    checkPassword: (input) => input === _password,
    changePassword: (old, newPwd) => {
      if (old === _password) {
        _password = newPwd
        return true
      }
      return false
    }
  }
}

const user = createUser('Orion')
user.getName()           // 'Orion'
user._password            // undefined — 访问不到
user.checkPassword('123') // false
```

**2. 函数工厂**

```javascript
function multiplier(factor) {
  return function (number) {
    return number * factor // factor 被闭包保留
  }
}

const double = multiplier(2)
const triple = multiplier(3)

double(5)  // 10
triple(5)  // 15
```

**3. 防抖 / 节流**（见下面的手写部分）

**4. 循环中的闭包（经典面试题）**

```javascript
// ❌ 问题代码
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i) // 输出: 3, 3, 3
  }, 1000)
}
// 原因：var 没有块作用域，三个回调共享同一个 i
// 1秒后循环已结束，i 变成了 3

// ✅ 解法 1：用 let（每个块有自己的 i）
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i) // 输出: 0, 1, 2
  }, 1000)
}

// ✅ 解法 2：用闭包（IIFE）创建独立作用域
for (var i = 0; i < 3; i++) {
  ;(function (j) {
    // 每次 IIFE 创建新的变量对象，j 各自独立
    setTimeout(() => {
      console.log(j) // 输出: 0, 1, 2
    }, 1000)
  })(i)
}
```

### 闭包的内存泄漏

```javascript
function leak() {
  const hugeData = new Array(1000000).fill('🔥')
  return function () {
    // 即使 hugeData 没被使用，它也不会被回收
    // 因为整个变量对象都被保留了
    console.log('closure exists')
  }
}

// ✅ 解决方案：不再使用时解除引用
let fn = leak()
fn = null // hugeData 可以被 GC 回收了
```

> ⚠️ **面试必答**：闭包本身不是内存泄漏，**不当使用闭包**才导致内存泄漏。及时解除不再需要的引用即可。

### 闭包高频面试追问

| 问题 | 答案 |
|------|------|
| 闭包什么时候会内存泄漏？ | 当闭包引用了大对象且闭包长期不释放时 |
| 如何检测闭包造成的内存泄漏？ | Chrome DevTools → Memory 面板 → Heap Snapshot |
| 闭包和 GC 的关系？ | 闭包使变量对象不被 GC 回收（有强引用） |
| 模块化（ESM/CJS）用了闭包吗？ | 是的，每个模块文件被包裹在一个函数中 |

---

## 知识点 3：this 指向

### 四条绑定规则（优先级递增）

```javascript
// 1️⃣ 默认绑定 — 独立函数调用
function foo() {
  console.log(this) // 非严格模式: window，严格模式: undefined
}
foo()

// 2️⃣ 隐式绑定 — 作为对象方法调用
const obj = {
  name: 'Penny',
  say() {
    console.log(this.name) // 'Penny' — this 指向 obj
  }
}
obj.say()

// 3️⃣ 显式绑定 — call / apply / bind
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`)
}

const person = { name: 'Orion' }
greet.call(person, 'Hello')    // 'Hello, Orion'
greet.apply(person, ['Hi'])    // 'Hi, Orion'

const bound = greet.bind(person)
bound('Hey')                    // 'Hey, Orion'

// 4️⃣ new 绑定
function Person(name) {
  this.name = name // this 指向新创建的对象
}
const p = new Person('Dalia')
console.log(p.name) // 'Dalia'
```

### 优先级

```
new 绑定 > 显式绑定 > 隐式绑定 > 默认绑定
```

### 隐式绑定丢失（高频面试坑！）

```javascript
const obj = {
  name: 'Penny',
  say() {
    console.log(this.name)
  }
}

// 正常调用
obj.say() // 'Penny' ✅

// ❌ 赋值给变量后调用 — 隐式绑定丢失！
const fn = obj.say
fn() // undefined — this 变成了 window

// ❌ 作为回调传递 — 隐式绑定丢失！
function callFn(fn) {
  fn() // 这里是独立函数调用，走默认绑定
}
callFn(obj.say) // undefined

// ✅ 解决方案 1：bind
callFn(obj.say.bind(obj)) // 'Penny'

// ✅ 解决方案 2：箭头函数包装
const fn2 = () => obj.say()
fn2() // 'Penny'
```

> 🔑 **记住**：只要函数不是**直接作为对象的方法调用**，隐式绑定就可能丢失。

### 箭头函数的 this

```javascript
const obj = {
  name: 'Penny',
  // 普通函数：this 指向调用者
  normal() {
    console.log(this.name) // 'Penny'
  },
  // 箭头函数：this 继承定义时外层作用域
  arrow: () => {
    console.log(this.name) // undefined — 继承的是全局的 this
  }
}

obj.normal() // 'Penny'
obj.arrow()  // undefined

// 箭头函数的经典用途：定时器中保持 this
const timer = {
  seconds: 0,
  start() {
    // ❌ 普通函数 this 丢失
    // setInterval(function() { this.seconds++ }, 1000)

    // ✅ 箭头函数继承外层 this（这里的外层是 start 方法，this 指向 timer）
    setInterval(() => {
      this.seconds++
    }, 1000)
  }
}
```

> 🔑 **记住**：箭头函数没有自己的 `this`，不能用作构造函数，没有 `arguments` 对象。

### this 指向面试速查表

| 场景 | this 指向 |
|------|-----------|
| `fn()` | window（严格模式 undefined） |
| `obj.fn()` | obj |
| `fn.call(ctx)` / `fn.apply(ctx)` / `fn.bind(ctx)()` | ctx |
| `new Fn()` | 新创建的对象 |
| `() => {}` | 外层作用域的 this |
| `setTimeout(function(){})` | window |
| `setTimeout(() => {})` | 外层作用域的 this |
| DOM 事件回调 `el.onclick = function(){}` | 触发事件的 DOM 元素 |

---

## 知识点 4：原型链与继承

### 原型链基础

```
实例.__proto__  →  构造函数.prototype  →  Object.prototype  →  null

person.__proto__       === Person.prototype    ✅
Person.prototype.__proto__ === Object.prototype ✅
Object.prototype.__proto__  === null            ✅
```

```javascript
function Person(name) {
  this.name = name
}
Person.prototype.sayHello = function () {
  console.log(`Hello, I'm ${this.name}`)
}

const p = new Person('Orion')
p.sayHello() // 'Hello, I'm Orion'

// 属性查找链: p → Person.prototype → Object.prototype → null
// 找到就返回，到 null 还没找到 → undefined
```

### new 操作符的完整过程（面试必问）

```javascript
function myNew(Constructor, ...args) {
  // 1. 创建新对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype)

  // 2. 执行构造函数，this 指向新对象
  const result = Constructor.apply(obj, args)

  // 3. 如果构造函数返回了对象，就用返回值；否则用新对象
  return (typeof result === 'object' && result !== null) ? result : obj
}
```

### instanceof 原理

```javascript
// A instanceof B：沿着 A 的原型链查找，是否有 B.prototype
function myInstanceOf(left, right) {
  let proto = Object.getPrototypeOf(left)
  const prototype = right.prototype

  while (proto !== null) {
    if (proto === prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
  return false
}

// 测试
myInstanceOf([], Array)   // true
myInstanceOf([], Object)  // true — Array.prototype.__proto__ === Object.prototype
myInstanceOf(1, Number)   // false — 原始类型没有原型链
```

### ES5 组合继承（寄生组合继承）

```javascript
function Animal(name) {
  this.name = name
}
Animal.prototype.eat = function () {
  console.log(`${this.name} is eating`)
}

function Dog(name, breed) {
  Animal.call(this, name) // ① 继承属性（借用父构造函数）
  this.breed = breed
}

// ② 继承方法（Object.create 避免调用两次父构造函数）
Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.constructor = Dog // ③ 修复 constructor 指向

Dog.prototype.bark = function () {
  console.log(`${this.name}: Woof!`)
}

const d = new Dog('Buddy', 'Labrador')
d.eat()  // 'Buddy is eating'
d.bark() // 'Buddy: Woof!'
```

> ⚠️ 为什么用 `Object.create` 而不是 `Dog.prototype = new Animal()`？
> 因为 `new Animal()` 会执行一次 Animal 构造函数，可能导致不必要的副作用。`Object.create` 只创建原型链关联，不执行构造函数。

### ES6 class（语法糖）

```javascript
class Animal {
  constructor(name) {
    this.name = name
  }
  eat() {
    console.log(`${this.name} is eating`)
  }
  // 静态方法 — 只能通过类本身调用，实例不能调用
  static create(name) {
    return new Animal(name)
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name) // 必须先调用 super，等价于 Animal.call(this, name)
    this.breed = breed
  }
  bark() {
    console.log(`${this.name}: Woof!`)
  }
}

// 私有字段（ES2022+）
class BankAccount {
  #balance = 0 // 私有字段，外部无法直接访问

  deposit(amount) {
    this.#balance += amount
  }

  getBalance() {
    return this.#balance
  }
}
```

> ⚠️ **面试追问**：class 本质上还是基于原型的继承，`extends` 的底层就是 `Object.create()` + `super` 调用。

---

## 🔧 手写题（5 道）

### 1. 手写 call

```javascript
Function.prototype.myCall = function (ctx, ...args) {
  // 1. 处理 ctx 为 null/undefined 的情况（默认指向 window）
  ctx = ctx ?? globalThis

  // 2. 用 Symbol 避免属性名冲突
  const fn = Symbol('fn')
  ctx[fn] = this

  // 3. 执行函数，this 指向 ctx
  const result = ctx[fn](...args)

  // 4. 清理临时属性
  delete ctx[fn]

  return result
}

// 测试
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`
}
greet.myCall({ name: 'Orion' }, 'Hello', '!') // 'Hello, Orion!'
```

### 2. 手写 apply

```javascript
Function.prototype.myApply = function (ctx, args = []) {
  ctx = ctx ?? globalThis
  const fn = Symbol('fn')
  ctx[fn] = this
  const result = ctx[fn](...args)
  delete ctx[fn]
  return result
}
```

### 3. 手写 bind（重点！支持 new 调用）

```javascript
Function.prototype.myBind = function (ctx, ...args) {
  const self = this

  function bound(...moreArgs) {
    // 如果是 new 调用（new.target 不为 undefined），this 指向新对象
    // 不应该绑定到 ctx 上
    if (new.target) {
      return new self(...args, ...moreArgs)
    }
    // 普通调用：绑定到 ctx
    return self.apply(ctx, [...args, ...moreArgs])
  }

  // 维护原型链：bound 的 prototype 应该能访问原函数的 prototype
  if (self.prototype) {
    bound.prototype = Object.create(self.prototype)
  }

  return bound
}

// 测试 1：普通绑定
const bound = greet.myBind({ name: 'Penny' }, 'Hi')
bound('!') // 'Hi, Penny!'

// 测试 2：支持 new
function Person(name, age) {
  this.name = name
  this.age = age
}
Person.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}, ${this.age} years old`)
}

const BoundPerson = Person.myBind(null, 'Orion')
const p = new BoundPerson(18)
p.sayHi() // "Hi, I'm Orion, 18 years old"
console.log(p instanceof Person) // true — 原型链保持正确
```

### 4. 手写防抖 debounce

```javascript
/**
 * 防抖：事件停止触发 delay 毫秒后才执行
 * @param {Function} fn 需要防抖的函数
 * @param {number} delay 延迟时间（ms）
 * @param {boolean} immediate 是否立即执行（首帧触发）
 */
function debounce(fn, delay, immediate = false) {
  let timer = null

  return function (...args) {
    const context = this // 保留调用者的 this

    // 立即执行模式：第一次触发立即执行，之后等停止后才能再执行
    if (immediate && !timer) {
      fn.apply(context, args)
    }

    // 每次触发都清除上一次的定时器
    clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null
      if (!immediate) {
        fn.apply(context, args)
      }
    }, delay)
  }
}

// 使用场景：搜索框输入停止 300ms 后发请求
const searchInput = document.getElementById('search')
searchInput.addEventListener('input', debounce(function () {
  console.log('搜索:', this.value)
}, 300))
```

### 5. 手写节流 throttle

```javascript
/**
 * 节流：固定频率执行，interval 毫秒内最多执行一次
 * 结合时间戳 + 定时器，保证首次立即执行 + 最后一次也会执行
 * @param {Function} fn 需要节流的函数
 * @param {number} interval 间隔时间（ms）
 */
function throttle(fn, interval) {
  let lastTime = 0
  let timer = null

  return function (...args) {
    const context = this
    const now = Date.now()

    // 距上次执行已超过间隔 → 立即执行
    if (now - lastTime >= interval) {
      fn.apply(context, args)
      lastTime = now
    } else if (!timer) {
      // 还在间隔内 → 设一个定时器，保证最后一次触发也会执行
      timer = setTimeout(() => {
        fn.apply(context, args)
        lastTime = Date.now()
        timer = null
      }, interval - (now - lastTime))
    }
    // 如果已有定时器在等 → 不做任何事（等待执行）
  }
}

// 使用场景：滚动事件，限制频率
window.addEventListener('scroll', throttle(function () {
  console.log('滚动位置:', window.scrollY)
}, 200))
```

### 防抖 vs 节流 对比

| | 防抖 debounce | 节流 throttle |
|---|--------------|--------------|
| 原理 | 停止触发后等 N 秒再执行 | 固定频率执行，N 秒内只执行一次 |
| 适用 | 搜索框输入、窗口 resize 结束后 | 滚动事件、拖拽、resize 频率限制 |
| 比喻 | 电梯关门——有人进来就重新等 | 地铁闸机——固定间隔放行 |
| 首次触发 | 延迟执行（除非 immediate） | 立即执行 |
| 最后一次 | 会执行 | 会执行（定时器兜底版） |

### 6. 手写柯里化 curry

```javascript
/**
 * 柯里化：将多参数函数转换为一系列单参数函数
 * 支持分步传参，参数够了才执行
 * @param {Function} fn 原始函数
 */
function curry(fn) {
  return function curried(...args) {
    // 如果传入的参数已经够了，直接执行原函数
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    }
    // 参数不够，返回一个新函数继续接收参数
    return function (...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs])
    }
  }
}

// 测试
function add(a, b, c) {
  return a + b + c
}

const curriedAdd = curry(add)

curriedAdd(1)(2)(3)     // 6
curriedAdd(1, 2)(3)     // 6
curriedAdd(1)(2, 3)     // 6
curriedAdd(1, 2, 3)     // 6

// 实际应用：参数复用
const add10 = curriedAdd(10)
add10(5)(3) // 18 — 10 + 5 + 3
```

**柯里化的原理**：利用**闭包**保存已传入的参数，每次返回新函数直到参数数量满足要求。

> 🔑 **面试追问**：柯里化和偏函数（Partial Application）的区别？
> - 柯里化：每次只接收一个参数，返回新函数（一元函数链）
> - 偏函数：可以一次接收多个参数，固定一部分参数后返回新函数

---

## 💻 算法题

### #1 两数之和 (LeetCode Easy)

> 给定数组 `nums` 和目标值 `target`，找出和为 `target` 的两个数的下标。

**哈希表解法 — O(n) 时间 / O(n) 空间：**

```javascript
function twoSum(nums, target) {
  // Map 存 { 已遍历的值: 对应下标 }
  const map = new Map()

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i] // 需要找的"另一半"

    if (map.has(complement)) {
      // 找到了！complement 的下标 + 当前下标
      return [map.get(complement), i]
    }

    // 没找到，把当前值存进 Map，供后续查找
    map.set(nums[i], i)
  }
}
```

**思路**：遍历数组，用 Map 存 `{值: 下标}`，每次检查 `target - 当前值` 是否已在 Map 中。一次遍历即可，是**空间换时间**的典型应用。

| 复杂度 | 暴力 O(n²) | 哈希表 O(n) |
|--------|-----------|------------|
| 时间 | 双层循环 | 单次遍历 + Map 查找 O(1) |
| 空间 | O(1) | O(n) 存 Map |

---

### #49 字母异位词分组 (LeetCode Medium)

> 将字母异位词（字母相同但排列不同）分组。

**排序法 — O(n·k·logk) 时间 / O(n·k) 空间：**

```javascript
function groupAnagrams(strs) {
  const map = new Map()

  for (const str of strs) {
    // 关键：字母异位词排序后结果相同 → 用排序结果作为分组 key
    const key = str.split('').sort().join('')
    // 例如 "eat" → "aet", "tea" → "aet", "ate" → "aet"

    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key).push(str)
  }

  return Array.from(map.values())
}
```

**进阶解法（计数法）— O(n·k) 时间，不需要排序：**

```javascript
function groupAnagrams(strs) {
  const map = new Map()

  for (const str of strs) {
    // 用 26 位计数数组作为 key（每个字母出现次数）
    const count = new Array(26).fill(0)
    for (const char of str) {
      count[char.charCodeAt(0) - 97]++
    }
    const key = count.join(',') // "1,0,0,...,2,0" 作为唯一 key

    if (!map.has(key)) map.set(key, [])
    map.get(key).push(str)
  }

  return Array.from(map.values())
}
```

| 复杂度 | 排序法 | 计数法 |
|--------|--------|--------|
| 时间 | O(n·k·logk) | O(n·k) |
| 空间 | O(n·k) | O(n·k) |

---

### #128 最长连续序列 (LeetCode Medium)

> 给定未排序数组，找出最长连续序列的长度。要求 **O(n)**。

**HashSet 解法 — O(n) 时间 / O(n) 空间：**

```javascript
function longestConsecutive(nums) {
  const set = new Set(nums) // 去重 + O(1) 查找
  let maxLen = 0

  for (const num of set) {
    // 关键优化：只从序列的"起点"开始计数
    // 起点 = 没有前驱（num-1 不在 set 中）
    if (!set.has(num - 1)) {
      let current = num
      let len = 1

      // 从起点开始向后数，找到连续序列的长度
      while (set.has(current + 1)) {
        current++
        len++
      }

      maxLen = Math.max(maxLen, len)
    }
  }

  return maxLen
}
```

**为什么是 O(n) 而不是 O(n²)**：
- 外层 for 遍历每个元素
- 内层 while 虽然也在遍历，但**每个元素最多只被访问一次**
- 只有当 `num` 是序列起点时才进入 while，连续区间内的数字会直接跳过
- 所以总的遍历次数 = 元素个数 = O(n)

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|----------|---------|
| 作用域链 | 从内向外逐层查找，定义时确定（词法作用域） | ⭐⭐⭐ |
| 变量提升 | var 提升声明 + undefined；let/const 有 TDZ | ⭐⭐⭐ |
| 闭包 | 函数 + 词法环境，用于数据封装/工厂/防抖节流 | ⭐⭐⭐⭐⭐ |
| this 指向 | 4 条规则 + 隐式绑定丢失 + 箭头函数 this | ⭐⭐⭐⭐⭐ |
| 原型链 | `__proto__` → prototype → Object.prototype → null | ⭐⭐⭐⭐ |
| new 原理 | 创建对象 → 绑定原型 → 执行构造函数 → 返回 | ⭐⭐⭐⭐ |
| 防抖/节流 | 搜索框 vs 滚动，区别要能口述 | ⭐⭐⭐⭐ |
| 柯里化 | 闭包保存参数，分步传参 | ⭐⭐⭐ |
| 算法 | 哈希表/Map/Set 是 O(1) 查找利器 | ⭐⭐⭐⭐⭐ |

**明天预告（Day 2）**：JS 异步与 Promise — Event Loop、手写 Promise、async/await
