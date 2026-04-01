# 04/05 — TypeScript 进阶与类型体操（Day 5）

> **阶段**：第一阶段 前端基础强化
> **今日目标**：掌握条件类型、infer、分布式条件类型、映射类型，完成 10 道类型体操实战
> **投入时间**：上午 2h / 下午 2h / 晚上 3h 算法

---

## 知识点 1：条件类型（Conditional Types）⭐

### 1.1 基本语法

```ts
// 语法：T extends U ? X : Y
// 类似于 JS 的三元表达式，但作用于类型层面

type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'
type C = IsString<'hello'>; // 'yes' — 字面量类型也是 string 的子类型
```

### 1.2 条件类型的分配律（Distributive）⭐⚠️

```ts
// 🔑 当 T 是联合类型时，条件类型会自动分发到每个成员
type ToArray<T> = T extends any ? T[] : never;

type D = ToArray<string | number>;
// 等价于：ToArray<string> | ToArray<number>
// = string[] | number[]

// ⚠️ 如果不想分发，用方括号包裹
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type E = ToArrayNonDist<string | number>;
// = (string | number)[] — 不再分发
```

⚠️ **易错点**：分布式条件类型只在 T 是**裸类型参数**时生效。`[T] extends [U]` 或 `T & {}` 可以阻止分发。

### 1.3 条件类型与 never

```ts
// 从联合类型中排除 never（因为 never 是所有类型的子类型）
type T1 = string | never;  // string
type T2 = number | never;  // number

// 条件类型中的 never 分发
type Filter<T, U> = T extends U ? T : never;
type OnlyStrings = Filter<string | number | boolean, string>;
// = string — number 和 boolean 都返回 never 被自动排除
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| 条件类型的分配律是什么？ | T 是联合类型时，自动分发到每个成员分别求值 |
| 如何阻止分配律？ | 用 `[T] extends [U]` 或 `T & {}` 包裹 |
| `never extends T` 是什么？ | true（因为 never 是所有类型的子类型） |

---

## 知识点 2：infer 关键字 ⭐🔑

### 2.1 基本概念

```ts
// infer 在条件类型的 extends 子句中声明一个类型变量
// TypeScript 会尝试推断这个位置的类型

// 获取函数返回值类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = ReturnType<() => string>;       // string
type B = ReturnType<(x: number) => boolean>; // boolean

// 获取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type C = Parameters<(a: string, b: number) => void>;
// [a: string, b: number]
```

### 2.2 infer 的各种位置 ⭐

```ts
// 1. 函数返回值
type GetReturn<T> = T extends (...args: any) => infer R ? R : never;

// 2. 数组元素类型
type Elem<T> = T extends (infer E)[] ? E : never;
type D = Elem<string[]>;   // string
type E = Elem<number[]>;   // number

// 3. Promise 内部类型
type Awaited<T> = T extends Promise<infer U> ? U : T;
type F = Awaited<Promise<string>>; // string

// 4. 元组第一个元素
type First<T> = T extends [infer F, ...any[]] ? F : never;
type G = First<[1, 2, 3]>; // 1

// 5. 字符串第一个字符
type FirstChar<T> = T extends `${infer F}${string}` ? F : never;
type H = FirstChar<'hello'>; // 'h'

// 6. 字符串剩余部分
type Shift<T> = T extends `${string}${infer R}` ? R : never;
type I = Shift<'hello'>; // 'ello'
```

### 2.3 多个 infer

```ts
// 当有多个 infer 时，从左到右推断
type Split<S extends string, Sep extends string> =
  S extends `${infer Before}${Sep}${infer After}`
    ? [Before, After]
    : never;

type J = Split<'hello-world', '-'>; // ['hello', 'world']
type K = Split<'a.b.c', '.'>;       // ['a', 'b.c']

// ⚠️ 多个同位置的 infer：推断为交叉类型
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends
  (k: infer I) => void ? I : never;

type L = UnionToIntersection<{ a: 1 } | { b: 2 }>;
// = { a: 1 } & { b: 2 }
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| infer 的作用？ | 在条件类型中声明类型变量，让 TS 自动推断该位置的类型 |
| infer 能用在哪里？ | 只能在条件类型的 extends 子句中 |
| 多个同位置 infer 推断为什么？ | 交叉类型 |

---

## 知识点 3：映射类型 + keyof 高级用法 ⭐

### 3.1 基本映射类型

```ts
// 语法：{ [K in keyof T]: ... }
// 遍历 T 的所有属性，对每个属性的类型进行变换

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]; // 移除 readonly
};

type Optional<T> = {
  [K in keyof T]?: T[K]; // 添加可选
};

// 配合 as 重映射 ⭐
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

### 3.2 用 as 过滤键 ⭐🔑

```ts
// 过滤掉特定类型的属性
type RemoveByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

type OnlyStrings = RemoveByType<Person, number>;
// { name: string } — age 被过滤掉

// 只保留方法
type Methods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// 过滤掉 symbol 键
type StringKeys<T> = {
  [K in keyof T as K extends string ? K : never]: T[K];
};
```

### 3.3 深度映射类型

```ts
// 深度 Readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface Config {
  db: {
    host: string;
    port: number;
  };
  cache: {
    ttl: number;
  };
}

type FrozenConfig = DeepReadonly<Config>;
// FrozenConfig.db.host 是 readonly
// FrozenConfig.db.port 也是 readonly
```

### 3.4 as const ⭐🔑

```ts
// as const 将值推断为字面量类型
const arr = [1, 2, 3] as const;
// 类型：readonly [1, 2, 3]
// 不能修改：arr.push(4); // ❌
// 不能重新赋值：arr[0] = 10; // ❌

const obj = { name: 'Penny', age: 21 } as const;
// 类型：{ readonly name: 'Penny'; readonly age: 21 }

// 使用场景 1：配合 typeof 获取精确类型
type Arr = typeof arr; // readonly [1, 2, 3]
type Obj = typeof obj; // { readonly name: 'Penny'; readonly age: 21 }

// 使用场景 2：const assertion 配合映射类型
const ROUTES = {
  home: '/',
  about: '/about',
  contact: '/contact',
} as const;

type RoutePath = typeof ROUTES[keyof typeof ROUTES];
// '/' | '/about' | '/contact'

// 使用场景 3：防止数组/对象字面量被拓宽
function doSomething(x: readonly [1, 2, 3]) {}
doSomething([1, 2, 3] as const); // ✅
// doSomething([1, 2, 3]); // ❌ 类型不匹配
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| `as const` 的作用？ | 推断为最精确的字面量类型，且添加 readonly |
| 映射类型中 `as` 子句的作用？ | 可以重映射键名、过滤键（返回 never） |
| 如何实现深度 Readonly？ | 递归映射类型 + 条件判断 object |

---

## 🔧 手写题：10 道类型体操实战

### 1. `MyAwaited<T>` — 获取 Promise 内部类型

```ts
/**
 * 递归展开 Promise 类型（支持嵌套 Promise）
 * @example MyAwaited<Promise<Promise<string>>> → string
 */
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;

// 测试
type A1 = MyAwaited<Promise<string>>;           // string
type A2 = MyAwaited<Promise<Promise<number>>>;  // number
type A3 = MyAwaited<Promise<Promise<Promise<boolean>>>>; // boolean
```

### 2. `MyIf<C, T, F>` — 条件类型选择

```ts
/**
 * 根据布尔条件选择类型
 * @example MyIf<true, 'a', 'b'> → 'a'
 */
type MyIf<C extends boolean, T, F> = C extends true ? T : F;

// 测试
type B1 = MyIf<true, 'a', 'b'>;   // 'a'
type B2 = MyIf<false, 'a', 'b'>;  // 'b'
```

### 3. `MyConcat<T, U>` — 元组拼接

```ts
/**
 * 拼接两个元组类型
 */
type MyConcat<T extends any[], U extends any[]> = [...T, ...U];

// 测试
type C1 = MyConcat<[1, 2], [3, 4]>; // [1, 2, 3, 4]
type C2 = MyConcat<['a'], [1, true]>; // ['a', 1, true]
```

### 4. `MyIncludes<T, U>` — 元组是否包含

```ts
/**
 * 判断元组 T 是否包含类型 U
 */
type MyIncludes<T extends any[], U> = T extends [infer F, ...infer R]
  ? F extends U
    ? true
    : MyIncludes<R, U>
  : false;

// 测试
type D1 = MyIncludes<[1, 2, 3], 2>;    // true
type D2 = MyIncludes<[1, 2, 3], 4>;    // false
type D3 = MyIncludes<[string, number], string>; // true
```

### 5. `MyPush<T, U> / MyUnshift<T, U>`

```ts
/**
 * 元组末尾添加元素 / 头部添加元素
 */
type MyPush<T extends any[], U> = [...T, U];
type MyUnshift<T extends any[], U> = [U, ...T];

// 测试
type E1 = MyPush<[1, 2], 3>;    // [1, 2, 3]
type E2 = MyUnshift<[1, 2], 0>; // [0, 1, 2]
```

### 6. `MyFlat<T>` — 数组扁平化

```ts
/**
 * 递归展开嵌套数组
 * @example MyFlat<[1, [2, [3]]]> → [1, 2, 3]
 */
type MyFlat<T extends any[]> = T extends [infer F, ...infer R]
  ? F extends any[]
    ? [...MyFlat<F>, ...MyFlat<R>]
    : [F, ...MyFlat<R>]
  : [];

// 测试
type F1 = MyFlat<[1, [2, [3]]]>;        // [1, 2, 3]
type F2 = MyFlat<[[1, 2], [3, 4]]>;     // [1, 2, 3, 4]
type F3 = MyFlat<[1, [2, [3, [4]]]]>;   // [1, 2, 3, [4]] — 浅扁平化时如此
```

### 7. `MyCapitalize<S>` — 首字母大写

```ts
/**
 * 将字符串首字母转大写（模板字面量类型）
 */
type MyCapitalize<S extends string> =
  S extends `${infer F}${infer R}`
    ? `${Uppercase<F>}${R}`
    : S;

// 测试
type G1 = MyCapitalize<'hello'>;  // 'Hello'
type G2 = MyCapitalize<'world'>;  // 'World'
type G3 = MyCapitalize<''>;       // ''
```

### 8. `MyReplace<S, From, To>` — 字符串替换

```ts
/**
 * 替换字符串中第一个匹配的子串
 */
type MyReplace<
  S extends string,
  From extends string,
  To extends string
> = From extends ''
  ? S
  : S extends `${infer Before}${From}${infer After}`
    ? `${Before}${To}${After}`
    : S;

// 测试
type H1 = MyReplace<'hello world', 'world', 'TS'>; // 'hello TS'
type H2 = MyReplace<'foobarbar', 'bar', 'baz'>;    // 'foobazbar'
type H3 = MyReplace<'hello', 'x', 'y'>;            // 'hello' — 无匹配
```

### 9. `MyTrimLeft<S>` — 去除左侧空白

```ts
/**
 * 递归去除字符串左侧空白
 */
type Space = ' ' | '\n' | '\t';

type MyTrimLeft<S extends string> =
  S extends `${Space}${infer R}`
    ? MyTrimLeft<R>
    : S;

type MyTrimRight<S extends string> =
  S extends `${infer R}${Space}`
    ? MyTrimRight<R>
    : S;

type MyTrim<S extends string> = MyTrimRight<MyTrimLeft<S>>;

// 测试
type I1 = MyTrimLeft<'  hello'>;   // 'hello'
type I2 = MyTrimRight<'hello  '>;  // 'hello'
type I3 = MyTrim<'  hello  '>;     // 'hello'
```

### 10. `MyEqual<A, B>` — 类型严格相等 ⭐

```ts
/**
 * 判断两个类型是否完全相等（包括 readonly 和可选性）
 * 原理：利用函数参数的双向协变推断
 */
type MyEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

// 测试
type J1 = MyEqual<string, string>;       // true
type J2 = MyEqual<string, number>;       // false
type J3 = MyEqual<{ a: 1 }, { a: 1 }>;  // true
type J4 = MyEqual<any, string>;          // false — any 特殊
type J5 = MyEqual<any, unknown>;         // false
```

### 类型体操总结

| 题目 | 核心技巧 |
|------|---------|
| Awaited | 递归 + infer |
| If | 条件类型 |
| Concat | 元组展开 |
| Includes | 递归 + 条件类型 |
| Push/Unshift | 元组展开 |
| Flat | 递归 + infer |
| Capitilize | 模板字面量 + Uppercase |
| Replace | 模板字面量 + infer |
| Trim | 递归 + 模板字面量 |
| Equal | 函数类型推断 |

---

## 💻 算法题

### 算法题 1：矩阵置零（LeetCode #73）

**思路**：用第一行和第一列做标记。先记录第一行/列本身是否有零，再遍历矩阵将含零的行列标记到第一行/列，最后根据标记置零。

```ts
/**
 * Do not return anything, modify matrix in-place instead.
 */
function setZeroes(matrix: number[][]): void {
  const m = matrix.length, n = matrix[0].length;
  let firstRowZero = false, firstColZero = false;

  // 1. 检查第一行和第一列本身是否有零
  for (let j = 0; j < n; j++) {
    if (matrix[0][j] === 0) firstRowZero = true;
  }
  for (let i = 0; i < m; i++) {
    if (matrix[i][0] === 0) firstColZero = true;
  }

  // 2. 用第一行/列标记其他行列
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][j] === 0) {
        matrix[i][0] = 0; // 标记该行
        matrix[0][j] = 0; // 标记该列
      }
    }
  }

  // 3. 根据标记置零（从内部开始，避免覆盖标记）
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      if (matrix[i][0] === 0 || matrix[0][j] === 0) {
        matrix[i][j] = 0;
      }
    }
  }

  // 4. 处理第一行和第一列
  if (firstRowZero) {
    for (let j = 0; j < n; j++) matrix[0][j] = 0;
  }
  if (firstColZero) {
    for (let i = 0; i < m; i++) matrix[i][0] = 0;
  }
  // 时间 O(m×n)，空间 O(1)
}

// 测试
const mat = [[1, 1, 1], [1, 0, 1], [1, 1, 1]];
setZeroes(mat);
console.log(mat); // [[1,0,1],[0,0,0],[1,0,1]]
```

---

### 算法题 2：螺旋矩阵（LeetCode #54）

**思路**：模拟法。维护上下左右四个边界，按右→下→左→上循环遍历，每走完一行/列收缩边界。

```ts
/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    // 右
    for (let j = left; j <= right; j++) result.push(matrix[top][j]);
    top++;

    // 下
    for (let i = top; i <= bottom; i++) result.push(matrix[i][right]);
    right--;

    // 左
    if (top <= bottom) {
      for (let j = right; j >= left; j--) result.push(matrix[bottom][j]);
      bottom--;
    }

    // 上
    if (left <= right) {
      for (let i = bottom; i >= top; i--) result.push(matrix[i][left]);
      left++;
    }
  }
  return result;
  // 时间 O(m×n)，空间 O(1)
}

// 测试
console.log(spiralOrder([[1,2,3],[4,5,6],[7,8,9]]));
// [1,2,3,6,9,8,7,4,5]

console.log(spiralOrder([[1,2,3,4],[5,6,7,8],[9,10,11,12]]));
// [1,2,3,4,8,12,11,10,9,5,6,7]
```

---

### 算法题 3：旋转图像（LeetCode #48）

**思路**：先沿主对角线翻转（转置），再左右翻转。等价于顺时针旋转 90°。

```ts
/**
 * Do not return anything, modify matrix in-place instead.
 */
function rotate(matrix: number[][]): void {
  const n = matrix.length;

  // 1. 转置（沿主对角线翻转）
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // 2. 左右翻转（每行水平镜像）
  for (let i = 0; i < n; i++) {
    let left = 0, right = n - 1;
    while (left < right) {
      [matrix[i][left], matrix[i][right]] = [matrix[i][right], matrix[i][left]];
      left++;
      right--;
    }
  }
  // 时间 O(n²)，空间 O(1)
}

// 测试
const img = [[1,2,3],[4,5,6],[7,8,9]];
rotate(img);
console.log(img); // [[7,4,1],[8,5,2],[9,6,3]]

// 公式验证：matrix[i][j] → matrix[j][n-1-i]
// 转置后 matrix[i][j] → matrix[j][i]
// 左右翻转后 matrix[j][i] → matrix[j][n-1-i] ✅
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| 条件类型 | `T extends U ? X : Y`，联合类型自动分发 | ⭐⭐⭐⭐⭐ |
| infer | 在 extends 中声明类型变量，自动推断 | ⭐⭐⭐⭐⭐ |
| 分布式条件类型 | 联合类型自动分发，`[T]` 阻止分发 | ⭐⭐⭐⭐ |
| 映射类型 + as | 重映射键名、过滤键（返回 never） | ⭐⭐⭐⭐ |
| as const | 精确字面量类型，readonly | ⭐⭐⭐⭐⭐ |
| 模板字面量类型 | 字符串类型运算，`${infer}` 推断 | ⭐⭐⭐ |

### 🔑 今日关键收获
1. `infer` 是 TypeScript 类型推断的核心工具，类似"类型层面的变量声明"
2. 分布式条件类型在联合类型上自动分发 — 既是特性也是陷阱
3. 映射类型 + `as` 可以实现键过滤、键重命名、类型变换
4. 类型体操的本质：递归 + 条件类型 + infer + 模板字面量

---

## 📌 明天预告（Day 6）

Day 6 进入 **算法专项 + 数据结构**：
- 链表、栈/队列、哈希表、二叉树基础
- 手写 LRU 缓存
- 反转链表、回文链表、环形链表

算法决战日！⚔️
