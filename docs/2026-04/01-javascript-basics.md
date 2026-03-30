# 04/01 — JavaScript 基础

> 变量声明、数据类型、类型判断、运算符

---

## 知识点 1：变量声明 var / let / const

### var

```javascript
var name = 'Orion'
console.log(name) // 'Orion'

// 问题1: 可以重复声明
var age = 18
var age = 20 // 不报错！

// 问题2: 函数作用域，不是块作用域
if (true) {
  var x = 10
}
console.log(x) // 10 — 泄露到外部了！

// 问题3: 变量提升
console.log(y) // undefined（不是报错）
var y = 5
```

### let

```javascript
// 块作用域
if (true) {
  let a = 1
}
// console.log(a) // ReferenceError: a is not defined

// 不能重复声明
let b = 1
// let b = 2 // SyntaxError: Identifier 'b' has already been declared

// 暂时性死区 (TDZ)
// console.log(c) // ReferenceError — 在声明前不能访问
let c = 3
```

### const

```javascript
// 必须初始化，不能重新赋值
const PI = 3.14159
// PI = 3 // TypeError: Assignment to constant variable

// ⚠️ 注意：const 保证的是变量绑定不变，不是值不变
const obj = { name: 'Orion' }
obj.name = 'Penny' // 可以！修改的是对象内容
// obj = {} // 不行！不能重新赋值

const arr = [1, 2, 3]
arr.push(4) // 可以！
// arr = [] // 不行！
```

### 🔑 核心原则

> **默认用 `const`，需要重新赋值时用 `let`，永远不用 `var`。**

---

## 知识点 2：数据类型

JavaScript 有 **8 种数据类型**：

### 原始类型（7 种）

| 类型 | 示例 | typeof |
|------|------|--------|
| `string` | `'hello'` | `"string"` |
| `number` | `42`, `3.14`, `NaN`, `Infinity` | `"number"` |
| `bigint` | `9007199254740993n` | `"bigint"` |
| `boolean` | `true`, `false` | `"boolean"` |
| `undefined` | `undefined` | `"undefined"` |
| `null` | `null` | `"object"` ⚠️ |
| `symbol` | `Symbol('id')` | `"symbol"` |

### 引用类型（1 种）

| 类型 | 示例 | typeof |
|------|------|--------|
| `object` | `{}`, `[]`, `function(){}` | `"object"` 或 `"function"` |

### ⚠️ 经典陷阱

```javascript
typeof null      // "object" — 这是 JS 的历史 Bug！
typeof function // "function" — 函数是特殊的对象
typeof []       // "object" — 数组也是对象
typeof NaN      // "number" — NaN 是 "Not a Number" 但类型是 number

// 判断 null 的正确方式
value === null

// 判断数组
Array.isArray([1, 2, 3]) // true

// 判断 NaN
Number.isNaN(NaN) // true
isNaN('hello')    // true — 注意：isNaN 会先类型转换！
Number.isNaN('hello') // false — 更严格
```

---

## 知识点 3：类型判断方式对比

| 方法 | 用途 | 缺点 |
|------|------|------|
| `typeof` | 基本类型判断 | `null` 返回 `"object"`，数组返回 `"object"` |
| `instanceof` | 判断原型链 | 跨 iframe 失效 |
| `Object.prototype.toString.call()` | 最精确 | 写法繁琐 |
| `Array.isArray()` | 判断数组 | 只能判断数组 |
| `Number.isNaN()` | 判断 NaN | 只能判断 NaN |

```javascript
// 最精确的类型判断
Object.prototype.toString.call('str')     // "[object String]"
Object.prototype.toString.call(42)        // "[object Number]"
Object.prototype.toString.call(null)      // "[object Null]"
Object.prototype.toString.call([])        // "[object Array]"
Object.prototype.toString.call({})        // "[object Object]"
Object.prototype.toString.call(() => {})  // "[object Function]"
```

---

## 知识点 4：运算符

### == vs ===

```javascript
// == (宽松相等) — 会做类型转换
1 == '1'        // true — 字符串 '1' 转成数字 1
0 == false      // true — false 转成 0
'' == false     // true — 都转成 0
null == undefined // true — 特殊规则
null == 0       // false — null 只 == undefined

// === (严格相等) — 不做类型转换
1 === '1'       // false
0 === false     // false
null === undefined // false
```

### 🔑 核心原则

> **永远用 `===`，不用 `==`。**

### 短路运算

```javascript
// || — 返回第一个真值
const name = '' || 'default'  // 'default'
const port = 3000 || 8080     // 3000

// ?? (空值合并) — 只在 null/undefined 时生效
const a = 0 || 'default'   // 'default' — 0 是假值
const b = 0 ?? 'default'   // 0 — 0 不是 null/undefined
const c = null ?? 'default' // 'default'

// && — 返回第一个假值
const d = 1 && 2 && 3  // 3
const e = 1 && 0 && 3  // 0
```

---

## 易错点总结

| # | 易错点 | 正确理解 |
|---|--------|----------|
| 1 | `typeof null === "object"` | 这是 JS 的 Bug，不是设计 |
| 2 | `const` 不能改值 | `const` 保证绑定不变，对象/数组内容可以改 |
| 3 | `var` 有变量提升 | 声明提升到作用域顶部，但赋值不提升 |
| 4 | `NaN !== NaN` | NaN 是唯一不等于自身的值 |
| 5 | `==` 做类型转换 | 用 `===` 避免隐式转换陷阱 |
| 6 | `0`, `''`, `false`, `null`, `undefined`, `NaN` 都是假值 | 其他全是真值（包括空数组 `[]` 和空对象 `{}`） |

---

## 算法题

### 题目：两数之和 (LeetCode #1)

> 给定一个整数数组 `nums` 和一个整数目标值 `target`，找出数组中和为目标值的两个整数的下标。

**示例：**
```
输入：nums = [2, 7, 11, 15], target = 9
输出：[0, 1]
解释：nums[0] + nums[1] = 2 + 7 = 9
```

### 解法一：暴力枚举 — O(n²)

```javascript
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j]
      }
    }
  }
}
```

### 解法二：哈希表 — O(n) ✅ 推荐

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

**思路：**
- 遍历数组，对于每个元素，计算 `target - nums[i]` = 需要找的另一个数
- 用 Map 存已经遍历过的数和它的下标
- 如果 Map 里有需要的那个数，直接返回两个下标
- 时间 O(n)，空间 O(n)

### 今日算法关键词

`哈希表` · `空间换时间` · `Map 数据结构`

---

## 今日总结

- ✅ 变量声明：`const` > `let` >> `var`
- ✅ 8 种数据类型，`typeof null` 是 Bug
- ✅ 类型判断：`typeof` + `Array.isArray()` + `Object.prototype.toString.call()`
- ✅ 比较用 `===`，`??` 比 `||` 更适合处理默认值
- ✅ 算法：哈希表解决两数之和
