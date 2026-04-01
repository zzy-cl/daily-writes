# 04/01 — JS 执行机制与闭包（Day 1）

> **阶段**：第一阶段 JS/TS 核心夯实
> **今日目标**：作用域链 + 闭包 + this 指向 + 原型链，手写 5 道核心题

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

---

## 知识点 2：闭包（Closure）

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
    return number * factor
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

// ✅ 解法 1：用 let
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i) // 输出: 0, 1, 2
  }, 1000)
}

// ✅ 解法 2：用闭包（IIFE）
for (var i = 0; i < 3; i++) {
  ;(function (j) {
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
    console.log('closure exists')
  }
}

// ✅ 解决方案：不再使用时解除引用
let fn = leak()
fn = null // hugeData 可以被 GC 回收了
```

> ⚠️ **面试必答**：闭包本身不是内存泄漏，**不当使用闭包**才导致内存泄漏。及时解除不再需要的引用即可。

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

    // ✅ 箭头函数继承外层 this
    setInterval(() => {
      this.seconds++
    }, 1000)
  }
}
```

> 🔑 **记住**：箭头函数没有自己的 `this`，不能用作构造函数，没有 `arguments` 对象。

---

## 知识点 4：原型链与继承

### 原型链基础

```
实例 → 构造函数的 prototype → Object.prototype → null

person.__proto__ === Person.prototype
Person.prototype.__proto__ === Object.prototype
Object.prototype.__proto__ === null
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

// 查找链: p → Person.prototype → Object.prototype → null
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
```

### ES5 组合继承

```javascript
function Animal(name) {
  this.name = name
}
Animal.prototype.eat = function () {
  console.log(`${this.name} is eating`)
}

function Dog(name, breed) {
  Animal.call(this, name) // 继承属性
  this.breed = breed
}

Dog.prototype = Object.create(Animal.prototype) // 继承方法
Dog.prototype.constructor = Dog

Dog.prototype.bark = function () {
  console.log(`${this.name}: Woof!`)
}

const d = new Dog('Buddy', 'Labrador')
d.eat()  // 'Buddy is eating'
d.bark() // 'Buddy: Woof!'
```

### ES6 class（语法糖）

```javascript
class Animal {
  constructor(name) {
    this.name = name
  }
  eat() {
    console.log(`${this.name} is eating`)
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name) // 必须先调用 super
    this.breed = breed
  }
  bark() {
    console.log(`${this.name}: Woof!`)
  }
}
```

> ⚠️ **面试追问**：class 本质上还是基于原型的继承，`extends` 的底层就是 `Object.create()` + `super` 调用。

---

## 🔧 手写题（5 道）

### 1. 手写 call

```javascript
Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx ?? window
  const fn = Symbol('fn') // 避免属性名冲突
  ctx[fn] = this
  const result = ctx[fn](...args)
  delete ctx[fn]
  return result
}

// 测试
function greet(greeting) {
  return `${greeting}, ${this.name}`
}
greet.myCall({ name: 'Orion' }, 'Hello') // 'Hello, Orion'
```

### 2. 手写 apply

```javascript
Function.prototype.myApply = function (ctx, args = []) {
  ctx = ctx ?? window
  const fn = Symbol('fn')
  ctx[fn] = this
  const result = ctx[fn](...args)
  delete ctx[fn]
  return result
}
```

### 3. 手写 bind

```javascript
Function.prototype.myBind = function (ctx, ...args) {
  const self = this
  return function bound(...moreArgs) {
    // 如果是 new 调用，this 指向新对象，不绑定 ctx
    if (new.target) {
      return new self(...args, ...moreArgs)
    }
    return self.apply(ctx, [...args, ...moreArgs])
  }
}

// 支持 new 的测试
function Person(name, age) {
  this.name = name
  this.age = age
}
const BoundPerson = Person.myBind(null, 'Orion')
const p = new BoundPerson(18)
console.log(p.name, p.age) // 'Orion', 18
```

### 4. 手写防抖 debounce

```javascript
function debounce(fn, delay, immediate = false) {
  let timer = null

  return function (...args) {
    const context = this

    if (immediate && !timer) {
      fn.apply(context, args)
    }

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
function throttle(fn, interval) {
  let lastTime = 0
  let timer = null

  return function (...args) {
    const context = this
    const now = Date.now()

    if (now - lastTime >= interval) {
      // 时间戳版：立即执行
      fn.apply(context, args)
      lastTime = now
    } else if (!timer) {
      // 定时器版：保证最后一次也会执行
      timer = setTimeout(() => {
        fn.apply(context, args)
        lastTime = Date.now()
        timer = null
      }, interval - (now - lastTime))
    }
  }
}

// 使用场景：resize 事件，限制频率
window.addEventListener('resize', throttle(function () {
  console.log('窗口大小变化')
}, 200))
```

### 防抖 vs 节流 区别

| | 防抖 debounce | 节流 throttle |
|---|--------------|--------------|
| 原理 | 停止触发后等 N 秒再执行 | 固定频率执行，N 秒内只执行一次 |
| 适用 | 搜索框输入、窗口 resize 结束 | 滚动事件、拖拽、resize 频率限制 |
| 比喻 | 电梯关门——有人进来就重新等 | 地铁闸机——固定间隔放行 |

---

## 💻 算法题

### #1 两数之和 (LeetCode Easy)

> 给定数组 `nums` 和目标值 `target`，找出和为 `target` 的两个数的下标。

**哈希表解法 — O(n)：**

```javascript
function twoSum(nums, target) {
  const map = new Map()

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]

    if (map.has(complement)) {
      return [map.get(complement), i]
    }

    map.set(nums[i], i)
  }
}
```

**思路**：遍历数组，用 Map 存 `{值: 下标}`，每次检查 `target - 当前值` 是否已在 Map 中。

---

### #49 字母异位词分组 (LeetCode Medium)

> 将字母异位词（字母相同但排列不同）分组。

**排序法 — O(n·k·logk)：**

```javascript
function groupAnagrams(strs) {
  const map = new Map()

  for (const str of strs) {
    const key = str.split('').sort().join('') // 排序后作为 key
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key).push(str)
  }

  return Array.from(map.values())
}
```

**思路**：字母异位词排序后的字符串相同，用排序结果作为 Map 的 key 来分组。

---

### #128 最长连续序列 (LeetCode Medium)

> 给定未排序数组，找出最长连续序列的长度。要求 O(n)。

**HashSet 解法：**

```javascript
function longestConsecutive(nums) {
  const set = new Set(nums)
  let maxLen = 0

  for (const num of set) {
    // 只从序列的起点开始计数
    if (!set.has(num - 1)) {
      let current = num
      let len = 1

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

**思路**：用 Set 存所有数字，只从"没有前驱"的数字开始向后数，避免重复计算。

---

## 📝 今日总结

| 知识点 | 核心要点 |
|--------|----------|
| 作用域链 | 从内向外逐层查找，定义时确定（词法作用域） |
| 闭包 | 函数 + 词法环境，用于数据封装、函数工厂、防抖节流 |
| this 指向 | 4 条规则：默认 < 隐式 < 显式 < new；箭头函数无自己的 this |
| 原型链 | 实例 → prototype → Object.prototype → null |
| 防抖 | 停止触发后等 N 秒执行（搜索框） |
| 节流 | 固定频率执行（滚动/拖拽） |
| 算法 | 哈希表是解题利器，`Map` 的 `has/get/set` 是 O(1) |
