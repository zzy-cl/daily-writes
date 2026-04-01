# 04/04 — TypeScript 核心（Day 4）

> **阶段**：第一阶段 前端基础强化
> **今日目标**：掌握 TypeScript 基础类型系统、泛型、类型守卫，手写 Utility Types
> **投入时间**：上午 2h / 下午 2h / 晚上 3h 算法

---

## 知识点 1：基础类型与类型系统

### 1.1 基础类型一览

```ts
// 原始类型
let str: string = 'hello';
let num: number = 42;
let bool: boolean = true;
let nul: null = null;
let undef: undefined = undefined;
let sym: symbol = Symbol('id');
let big: bigint = 100n;

// 特殊类型
let anyVal: any = 'anything';       // 任意类型，关闭检查
let unknownVal: unknown = 'hello';  // 类型安全的 any
let neverRet: never;                // 永不存在的值
let voidRet: void = undefined;      // 函数无返回值

// 数组
let arr1: number[] = [1, 2, 3];
let arr2: Array<string> = ['a', 'b'];
let tuple: [string, number] = ['Penny', 21]; // 固定长度和类型

// 对象
let obj: { name: string; age: number } = { name: 'Penny', age: 21 };
```

### 1.2 never / unknown / void 区别 ⭐⚠️

| 类型 | 含义 | 赋值规则 | 使用场景 |
|------|------|---------|---------|
| `void` | 函数无返回值 | 可以赋 `undefined`（strict关闭时） | 无返回值的函数 |
| `never` | 永远不会到达 | 什么都不能赋值给它 | 抛错函数、穷尽检查 |
| `unknown` | 未知类型 | 任何值可以赋给它，但它只能赋给 `any` 和 `unknown` | 替代 `any`，安全的外部输入 |

```ts
// ✅ void — 没有 return 或 return undefined
function log(msg: string): void {
  console.log(msg);
}

// ✅ never — 永远不会结束
function throwError(msg: string): never {
  throw new Error(msg);
}

function infiniteLoop(): never {
  while (true) {}
}

// ✅ never 用于穷尽检查 ⭐
type Shape = 'circle' | 'square';

function getArea(shape: Shape) {
  switch (shape) {
    case 'circle': return Math.PI * 100;
    case 'square': return 100;
    default:
      // 如果新增了 shape 类型但没处理，这里会报错
      const _exhaustive: never = shape;
      //    ~~~~~~~~~~~~~~ Type '"triangle"' is not assignable to type 'never'
      return _exhaustive;
  }
}

// ✅ unknown — 必须类型收窄后才能使用 ⭐
function process(input: unknown) {
  // ❌ input.toUpperCase(); // Error! unknown 上不能调用方法

  if (typeof input === 'string') {
    // ✅ 收窄后可以使用
    return input.toUpperCase();
  }
}
```

### 1.3 联合类型与交叉类型

```ts
// 联合类型 A | B — 值可以是 A 或 B
type ID = string | number;
let id: ID = 42;
id = 'abc';

// 交叉类型 A & B — 必须同时满足 A 和 B
type HasName = { name: string };
type HasAge = { age: number };
type Person = HasName & HasAge; // { name: string; age: number }

const p: Person = { name: 'Penny', age: 21 }; // ✅
// const bad: Person = { name: 'Penny' }; // ❌ 缺少 age

// ⚠️ 交叉原始类型会变成 never
type Impossible = string & number; // never
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| `any` vs `unknown` 区别？ | any 关闭类型检查；unknown 保持类型安全，需要收窄后使用 |
| 什么时候返回 `never`？ | 抛错函数、死循环、穷尽性检查 |
| `void` vs `undefined`？ | void 表示"不关心返回值"，undefined 是一个具体值 |

---

## 知识点 2：interface vs type 别名 ⭐

### 2.1 基本对比

```ts
// interface — 定义对象形状
interface User {
  name: string;
  age: number;
  email?: string;       // 可选属性
  readonly id: string;  // 只读属性
}

// type — 定义类型别名（更通用）
type User2 = {
  name: string;
  age: number;
  email?: string;
  readonly id: string;
};
```

### 2.2 核心区别对比表

| 特性 | interface | type |
|------|-----------|------|
| 扩展方式 | `extends` | `&` 交叉类型 |
| 合并声明 | ✅ 同名 interface 会自动合并 | ❌ 不行 |
| 联合类型 | ❌ 不支持 | ✅ `type A = B \| C` |
| 元组 | ❌ 不支持 | ✅ `type T = [string, number]` |
| 映射类型 | ❌ 不支持 | ✅ `type T = { [K in keyof U]: ... }` |
| 原始类型别名 | ❌ 不支持 | ✅ `type ID = string \| number` |
| 性能 | 延迟类型检查，大型项目略优 | 即时类型检查 |
| 调试 | 错误信息更清晰 | 交叉类型错误信息可能不友好 |

### 2.3 扩展语法对比

```ts
// interface 扩展
interface Animal {
  name: string;
}
interface Dog extends Animal {
  bark(): void;
}

// type 扩展
type AnimalType = { name: string };
type DogType = AnimalType & { bark(): void };

// ✅ interface 可以 extends type
interface Cat extends AnimalType {
  meow(): void;
}

// ✅ type 也可以 & interface
type CatType = Animal & { meow(): void };
```

### 2.4 声明合并（仅 interface）

```ts
interface Config {
  host: string;
}
interface Config {
  port: number;
}
// 自动合并为 { host: string; port: number }
const config: Config = { host: 'localhost', port: 3000 }; // ✅

// ⚠️ 常见应用：扩展 Window 对象
declare global {
  interface Window {
    myApp: { version: string };
  }
}
```

### 2.5 何时用哪个？🔑

| 场景 | 推荐 | 原因 |
|------|------|------|
| 定义对象结构 / class 实现 | **interface** | 声明合并、extends 清晰 |
| 联合类型、元组、映射类型 | **type** | 更灵活 |
| 原始类型别名 | **type** | interface 做不到 |
| 公共 API / 库的类型定义 | **interface** | 用户可扩展 |
| 函数签名 | **type** | 更简洁 |

---

## 知识点 3：泛型 ⭐🔑

### 3.1 基本概念

```ts
// 泛型 = 类型的变量 — 让函数/类/接口支持多种类型

// ❌ 不用泛型 — 失去类型信息
function first(arr: any[]): any {
  return arr[0];
}
const num = first([1, 2, 3]); // num 是 any

// ✅ 用泛型 — 保留类型信息
function first<T>(arr: T[]): T {
  return arr[0];
}
const num2 = first([1, 2, 3]);     // num2 是 number ✅
const str = first(['a', 'b']);     // str 是 string ✅
```

### 3.2 泛型约束 extends ⭐

```ts
// 约束 T 必须有 length 属性
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length); // ✅ 安全访问
  return arg;
}

logLength('hello');    // ✅ string 有 length
logLength([1, 2, 3]);  // ✅ 数组有 length
logLength({ length: 5, value: 'data' }); // ✅
// logLength(42);      // ❌ number 没有 length

// keyof 约束 ⭐
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: 'Penny', age: 21 };
getProperty(person, 'name'); // 返回类型是 string
getProperty(person, 'age');  // 返回类型是 number
// getProperty(person, 'email'); // ❌ 'email' 不在 keyof person 中
```

### 3.3 泛型默认值

```ts
// 给泛型参数设置默认值
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 不指定时默认 any
const res1: ApiResponse = { code: 0, data: 'anything', message: 'ok' };

// 指定时更精确
interface User { id: number; name: string }
const res2: ApiResponse<User> = { code: 0, data: { id: 1, name: 'Penny' }, message: 'ok' };
// res2.data.id ✅ — 类型安全
```

### 3.4 多泛型参数

```ts
// Map 函数的泛型
function map<T, U>(arr: T[], fn: (item: T, index: number) => U): U[] {
  const result: U[] = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(fn(arr[i], i));
  }
  return result;
}

const lengths = map(['hello', 'world'], s => s.length); // number[]
// T = string, U = number
console.log(lengths); // [5, 5]

const booleans = map([1, 2, 3], n => n > 1); // boolean[]
console.log(booleans); // [false, true, true]
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| 泛型的作用？ | 在编译时保留类型信息，实现代码复用而不丢失类型安全 |
| `extends` 在泛型中什么意思？ | 约束泛型参数必须满足某个结构 |
| `keyof` 怎么配合泛型用？ | `K extends keyof T` 限制 K 只能是 T 的属性名 |
| 泛型和 any 的区别？ | any 丢失类型信息，泛型保留类型信息 |

---

## 知识点 4：类型守卫 ⭐

### 4.1 typeof 守卫

```ts
function padLeft(value: string, padding: string | number): string {
  if (typeof padding === 'number') {
    // 这里 padding 被收窄为 number
    return ' '.repeat(padding) + value;
  }
  // 这里 padding 被收窄为 string
  return padding + value;
}
```

### 4.2 instanceof 守卫

```ts
function logValue(x: Date | string) {
  if (x instanceof Date) {
    console.log(x.toISOString()); // x 是 Date
  } else {
    console.log(x.toUpperCase()); // x 是 string
  }
}
```

### 4.3 in 守卫

```ts
interface Fish { swim(): void }
interface Bird { fly(): void }

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim(); // 收窄为 Fish
  } else {
    animal.fly();  // 收窄为 Bird
  }
}
```

### 4.4 自定义类型谓词 ⭐

```ts
// 语法：paramName is Type
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: string | number) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // ✅ value 是 string
  } else {
    console.log(value.toFixed(2));    // ✅ value 是 number
  }
}

// 判别联合（Discriminated Union）⭐
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; sideLength: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2; // shape 被收窄
    case 'square':
      return shape.sideLength ** 2;
  }
}
```

### 4.5 可辨识联合（Discriminated Union）⭐🔑

```ts
// 前端常见场景：API 请求状态
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function render<T>(state: RequestState<T>) {
  switch (state.status) {
    case 'idle':     return '准备请求';
    case 'loading':  return '加载中...';
    case 'success':  return `数据: ${state.data}`; // ✅ 有 data
    case 'error':    return `错误: ${state.error}`; // ✅ 有 error
  }
}
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| 类型守卫的几种方式？ | typeof、instanceof、in、自定义谓词、判别联合 |
| 什么是判别联合？ | 用公共字段（如 `status`、`kind`）区分联合类型的成员 |
| 自定义类型谓词的返回值？ | `param is Type`（布尔值 + 类型断言） |

---

## 🔧 手写题（6 道 Utility Types）

### 手写题 1：`MyPartial<T>`

```ts
/**
 * 将 T 的所有属性变为可选
 * 原理：映射类型 + 修饰符 ?
 */
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 测试
interface User {
  name: string;
  age: number;
}

type PartialUser = MyPartial<User>;
// 等价于 { name?: string; age?: number }

const user: PartialUser = { name: 'Penny' }; // ✅ age 可选
```

### 手写题 2：`MyRequired<T>`

```ts
/**
 * 将 T 的所有属性变为必选（移除 ?）
 * 原理：映射类型 + 修饰符 -?
 */
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// 测试
interface Config {
  host?: string;
  port?: number;
}

type StrictConfig = MyRequired<Config>;
// { host: string; port: number }

// const cfg: StrictConfig = { host: 'localhost' }; // ❌ 缺少 port
const cfg: StrictConfig = { host: 'localhost', port: 3000 }; // ✅
```

### 手写题 3：`MyReadonly<T>`

```ts
/**
 * 将 T 的所有属性变为只读
 * 原理：映射类型 + 修饰符 readonly
 */
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 测试
type ReadonlyUser = MyReadonly<User>;
const rUser: ReadonlyUser = { name: 'Penny', age: 21 };
// rUser.name = 'Dalia'; // ❌ Cannot assign to 'name' because it is a read-only property
```

### 手写题 4：`MyPick<T, K>`

```ts
/**
 * 从 T 中挑选指定属性 K
 * 原理：映射类型 + 泛型约束 K extends keyof T
 */
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 测试
type UserName = MyPick<User, 'name'>;
// { name: string }

type UserNameAge = MyPick<User, 'name' | 'age'>;
// { name: string; age: number }
```

### 手写题 5：`MyOmit<T, K>`

```ts
/**
 * 从 T 中排除指定属性 K
 * 原理：Pick + Exclude
 */
type MyOmit<T, K extends keyof T> = MyPick<T, Exclude<keyof T, K>>;

// 等价写法（更直观）：
type MyOmit2<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

// 测试
type UserWithoutAge = MyOmit<User, 'age'>;
// { name: string }
```

### 手写题 6：MyExclude / MyExtract / MyReturnType

```ts
/**
 * MyExclude<T, U> — 从联合类型 T 中排除可赋给 U 的类型
 * 原理：分布式条件类型
 */
type MyExclude<T, U> = T extends U ? never : T;

// 测试
type T1 = MyExclude<'a' | 'b' | 'c', 'a'>;  // 'b' | 'c'
type T2 = MyExclude<'a' | 'b' | 'c', 'a' | 'b'>; // 'c'

/**
 * MyExtract<T, U> — 从联合类型 T 中提取可赋给 U 的类型
 */
type MyExtract<T, U> = T extends U ? T : never;

// 测试
type T3 = MyExtract<'a' | 'b' | 'c', 'a' | 'f'>; // 'a'

/**
 * MyReturnType<T> — 获取函数类型的返回值类型
 * 原理：infer 推断
 */
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : never;

// 测试
function getUser() { return { name: 'Penny', age: 21 }; }
type UserReturn = MyReturnType<typeof getUser>;
// { name: string; age: number }
```

### Utility Types 总结表

| Utility Type | 作用 | 原理 |
|-------------|------|------|
| `Partial<T>` | 所有属性可选 | `?` 修饰符 |
| `Required<T>` | 所有属性必选 | `-?` 移除可选 |
| `Readonly<T>` | 所有属性只读 | `readonly` 修饰符 |
| `Pick<T, K>` | 挑选属性 | 映射 + 约束 |
| `Omit<T, K>` | 排除属性 | Pick + Exclude |
| `Exclude<T, U>` | 排除联合成员 | 分布式条件类型 |
| `Extract<T, U>` | 提取联合成员 | 分布式条件类型 |
| `ReturnType<T>` | 获取返回值类型 | `infer` 推断 |
| `Record<K, V>` | 构造键值对类型 | 映射类型 |
| `NonNullable<T>` | 排除 null/undefined | 条件类型 |

---

## 💻 算法题

### 算法题 1：最大子数组和（LeetCode #53）

**思路**：Kadane 算法。维护当前子数组的和 `currentSum`，如果 `currentSum` 变为负数则重新开始。负数累加只会拖累后续更大的值。

```ts
/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums: number[]): number {
  let maxSum = nums[0];    // 全局最大
  let currentSum = nums[0]; // 当前子数组和

  for (let i = 1; i < nums.length; i++) {
    // 要么继续累加，要么从当前重新开始
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
  // 时间 O(n)，空间 O(1)
}

// 测试
console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6 ([4,-1,2,1])
console.log(maxSubArray([1])); // 1
console.log(maxSubArray([-1])); // -1
```

---

### 算法题 2：合并区间（LeetCode #56）

**思路**：按左端点排序，然后贪心合并重叠区间。

```ts
/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;

  // 按左端点排序
  intervals.sort((a, b) => a[0] - b[0]);

  const result: number[][] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    const current = intervals[i];

    if (current[0] <= last[1]) {
      // 有重叠：合并，右端点取较大值
      last[1] = Math.max(last[1], current[1]);
    } else {
      // 无重叠：直接加入
      result.push(current);
    }
  }
  return result;
  // 时间 O(n log n)（排序），空间 O(n)
}

// 测试
console.log(merge([[1, 3], [2, 6], [8, 10], [15, 18]]));
// [[1, 6], [8, 10], [15, 18]]

console.log(merge([[1, 4], [4, 5]]));
// [[1, 5]]

console.log(merge([[1, 4], [0, 4]]));
// [[0, 4]]
```

---

### 算法题 3：轮转数组（LeetCode #189）

**思路**：三次翻转法。先整体翻转，再分别翻转前 k 个和后面的部分。

```ts
/**
 Do not return anything, modify nums in-place instead.
 */
function rotate(nums: number[], k: number): void {
  const n = nums.length;
  k = k % n; // 处理 k > n 的情况

  if (k === 0) return;

  // 1. 整体翻转
  reverse(nums, 0, n - 1);
  // 2. 翻转前 k 个
  reverse(nums, 0, k - 1);
  // 3. 翻转后面的部分
  reverse(nums, k, n - 1);

  function reverse(arr: number[], left: number, right: number) {
    while (left < right) {
      [arr[left], arr[right]] = [arr[right], arr[left]];
      left++;
      right--;
    }
  }
  // 时间 O(n)，空间 O(1)
}

// 测试
const arr1 = [1, 2, 3, 4, 5, 6, 7];
rotate(arr1, 3);
console.log(arr1); // [5, 6, 7, 1, 2, 3, 4]

const arr2 = [-1, -100, 3, 99];
rotate(arr2, 2);
console.log(arr2); // [3, 99, -1, -100]
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| never / unknown / void | never=永不存在，unknown=安全的any，void=无返回 | ⭐⭐⭐⭐⭐ |
| interface vs type | interface 扩展和合并，type 更灵活通用 | ⭐⭐⭐⭐⭐ |
| 泛型 | 类型的变量，extends 约束，keyof 配合 | ⭐⭐⭐⭐⭐ |
| 类型守卫 | typeof / instanceof / in / 自定义谓词 / 判别联合 | ⭐⭐⭐⭐ |
| Utility Types | Partial/Pick/Omit/Exclude/ReturnType 实现原理 | ⭐⭐⭐⭐⭐ |
| Kadane 算法 | 维护当前和，负则重新开始 | ⭐⭐⭐⭐ |

### 🔑 今日关键收获
1. `unknown` 是 `any` 的安全替代品 — 强制类型收窄
2. 泛型的核心价值：**代码复用 + 类型安全**，不是炫技
3. Utility Types 全部基于映射类型 + 条件类型 + infer
4. 判别联合是前端处理复杂状态（如 API 状态机）的最佳模式

---

## 📌 明天预告（Day 5）

Day 5 进入 **TypeScript 进阶与类型体操**：
- 条件类型、infer、分布式条件类型
- 映射类型 + keyof 高级用法
- 10 道类型体操实战

准备好挑战 TypeScript 的高级战场了！🎯
