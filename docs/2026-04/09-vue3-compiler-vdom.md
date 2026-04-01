# 04/09 — 编译优化与虚拟 DOM（Day 9）

> **阶段**：第二阶段 Vue 3
> **今日目标**：掌握 Vue 3 编译时优化策略与 Diff 算法改进
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：编译优化四大策略 ⭐

Vue 3 在编译阶段做了大量优化，将运行时的负担转移到编译期：

```
Vue 2: 模板 → render 函数 → 运行时 Diff 全量比较
Vue 3: 模板 → 编译优化 → render 函数（携带优化信息）→ 靶向更新
```

### 1.1 静态提升（HoistStatic）⭐

模板中的静态节点在编译时被提升到 render 函数外部，只创建一次：

```vue
<template>
  <div>
    <p>这是静态内容</p>     <!-- 静态节点，被提升 -->
    <p>{{ msg }}</p>         <!-- 动态节点，不提升 -->
  </div>
</template>

<!-- 编译后（简化示意） -->
<script>
// 静态节点提升到 render 外部 — 只创建一次
const _hoisted_1 = /*#__PURE__*/_createVNode("p", null, "这是静态内容", -1 /* HOISTED */)

function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("div", null, [
    _hoisted_1,  // 复用已创建的 VNode
    _createVNode("p", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
  ]))
}
</script>
```

**效果**：静态节点的 VNode 只创建一次，更新时直接复用，不再参与 Diff。

⚠️ **注意**：不是所有静态节点都提升。如果节点数量太多或嵌套太深，提升成本可能高于收益，Vue 会做权衡。

### 1.2 PatchFlag（补丁标记）⭐

Vue 3 在编译时为每个动态节点标记变化类型，Diff 时只比较标记的属性：

```vue
<template>
  <!-- 编译时标记 PatchFlag -->
  <p>{{ msg }}</p>           <!-- TEXT = 1 -->
  <p :class="cls"></p>       <!-- CLASS = 2 -->
  <p :style="sty"></p>       <!-- STYLE = 4 -->
  <p :id="id"></p>           <!-- PROPS = 8 -->
  <p :id="id" :class="cls"></p> <!-- FULL_PROPS = 16 -->
  <p @click="fn"></p>        <!-- 编译时已静态绑定，无需标记 -->
</template>
```

**PatchFlag 枚举值（位运算组合）**：

```js
export const enum PatchFlags {
  TEXT = 1,           // 1      — 动态文本内容
  CLASS = 2,          // 10     — 动态 class
  STYLE = 4,          // 100    — 动态 style
  PROPS = 8,          // 1000   — 动态属性（除 class/style）
  FULL_PROPS = 16,    // 10000  — 有动态 key 的属性，需全量 Diff
  HYDRATE_EVENTS = 32,// 100000 — 需要 hydrate 的事件监听
  STABLE_FRAGMENT = 64,
  KEYED_FRAGMENT = 128,
  UNKEYED_FRAGMENT = 256,
  NEED_PATCH = 512,   // 非 props 的动态绑定（如 ref）
  DYNAMIC_SLOTS = 1024, // 动态插槽
  HOISTED = -1,       // 静态节点
  BAIL = -2           // Diff 算法应完全跳过该节点
}
```

**运行时 Diff 时的判断**：

```js
// Diff 时检查 PatchFlag
if (patchFlag > 0) {
  // 有标记 → 靶向更新
  if (patchFlag & PatchFlags.TEXT) {
    // 只更新文本
    hostSetElementText(el, n2.children)
  }
  if (patchFlag & PatchFlags.CLASS) {
    // 只更新 class
    hostPatchProp(el, 'class', ...)
  }
  if (patchFlag & PatchFlags.STYLE) {
    // 只更新 style
    hostPatchProp(el, 'style', ...)
  }
} else {
  // 无标记 → 全量 Diff
  // ...
}
```

### 1.3 Block Tree ⭐

Vue 3 引入 Block 概念，将动态节点收集到一个"扁平数组"中，Diff 时直接按索引比较：

```vue
<template>
  <div>                          <!-- Block 根节点 -->
    <p>static</p>                <!-- 静态，被提升 -->
    <p :class="cls"></p>         <!-- 动态节点 → 收集到 Block 的 dynamicChildren -->
    <div>
      <span>{{ msg }}</span>     <!-- 嵌套的动态节点 → 也被收集 -->
    </div>
  </div>
</template>

<!-- 编译后 -->
function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("div", null, [
    _hoisted_1,
    _createVNode("p", { class: _ctx.cls }, null, 2 /* CLASS */),
    _createVNode("div", null, [
      _createVNode("span", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
    ])
  ]))
}
```

**Block 的作用**：

```
Vue 2 的 Diff: 树形遍历，从根节点逐层比较
  div
  ├── p (比较)
  ├── div (比较)
  │   └── span (比较)

Vue 3 的 Block Diff: 扁平数组，直接按索引比较
  dynamicChildren = [p动态, span动态]
  → 只比较这两个节点，跳过所有静态内容
```

### 1.4 事件缓存（CacheHandler）

内联事件处理函数在每次渲染时会创建新函数引用。Vue 3 通过缓存避免不必要的更新：

```vue
<template>
  <button @click="onClick">click</button>
</template>

<!-- 编译后 -->
function render(_ctx, _cache) {
  return (_openBlock(), _createBlock("button", {
    onClick: _cache[1] || (_cache[1] = (...args) => _ctx.onClick(...args))
  }, "click"))
}
// _cache[1] 只在首次创建，后续渲染复用同一个函数引用
```

⚠️ **注意**：事件缓存仅对 `@click="handler"` 有效，内联函数 `@click="handler($event)"` 无法缓存：

```vue
<!-- ✅ 可缓存 -->
<button @click="onClick">click</button>

<!-- ❌ 不可缓存（内联函数每次新创建） -->
<button @click="onClick($event)">click</button>
```

### 编译优化总结表

| 优化策略 | 作用 | 编译期/运行时 |
|---------|------|-------------|
| 静态提升 | 静态节点只创建一次 | 编译期标记 + 运行时复用 |
| PatchFlag | 标记动态属性类型 | 编译期标记 + 运行时靶向 Diff |
| Block Tree | 扁平化动态节点集合 | 编译期收集 + 运行时扁平 Diff |
| 事件缓存 | 复用事件处理函数引用 | 编译期生成缓存代码 |

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Vue 3 编译优化做了哪些事情？ | 静态提升、PatchFlag、Block Tree、事件缓存四大策略 |
| PatchFlag 如何标记动态节点？ | 位运算标记 TEXT=1, CLASS=2, STYLE=4, PROPS=8 等，Diff 时用 & 判断 |
| 什么是 Block？解决了什么问题？ | Block 将模板中所有动态子节点收集到扁平数组，Diff 时跳过静态节点 |
| Vue 3 为什么比 Vue 2 快？ | 编译时优化减少运行时 Diff 量，Proxy 代替 defineProperty，Tree-shaking |

---

## 知识点 2：Vue 3 Diff 算法 ⭐

### 2.1 Vue 2 的双端 Diff

Vue 2 使用双端比较（头头、尾尾、头尾、尾头），四个指针向中间靠拢：

```
旧: [A, B, C, D, E]
新: [D, B, E, A, C]

步骤:
1. 头头比较: A vs D → 不同
2. 尾尾比较: E vs C → 不同
3. 头尾比较: A vs C → 不同
4. 尾头比较: E vs D → 不同
5. 用新节点 D 在旧列表中查找 → 找到，移动到头部
...反复移动，直到处理完
```

### 2.2 Vue 3 的快速 Diff ⭐

Vue 3 的 Diff 算法分五步：

```
步骤 1: 预处理 — 从头开始比较相同前缀
步骤 2: 预处理 — 从尾开始比较相同后缀
步骤 3: 新节点都处理完了 → 删除旧列表多余节点
步骤 4: 旧节点都处理完了 → 新增新列表节点
步骤 5: 最长递增子序列 — 最小化 DOM 移动
```

```js
/**
 * Vue 3 快速 Diff 算法（简化版）
 */
function patchKeyedChildren(c1, c2, container) {
  let i = 0
  let e1 = c1.length - 1  // 旧列表最后索引
  let e2 = c2.length - 1  // 新列表最后索引

  // 1. 从头比较 — 找到第一个不同的位置
  while (i <= e1 && i <= e2) {
    if (isSameVNode(c1[i], c2[i])) {
      patch(c1[i], c2[i])
    } else {
      break
    }
    i++
  }
  // i = 2 → 前两个节点相同

  // 2. 从尾比较 — 找到第一个不同的位置
  while (i <= e1 && i <= e2) {
    if (isSameVNode(c1[e1], c2[e2])) {
      patch(c1[e1], c2[e2])
    } else {
      break
    }
    e1--
    e2--
  }

  // 3. 旧列表处理完了，新列表还有剩余 → 新增
  if (i > e1) {
    while (i <= e2) {
      mount(c2[i], container)
      i++
    }
  }
  // 4. 新列表处理完了，旧列表还有剩余 → 删除
  else if (i > e2) {
    while (i <= e1) {
      unmount(c1[i])
      i++
    }
  }
  // 5. 新旧都有剩余 → 最长递增子序列
  else {
    // 构建新列表的 key → index 映射
    const keyToNewIndexMap = new Map()
    for (let j = i; j <= e2; j++) {
      keyToNewIndexMap.set(c2[j].key, j)
    }

    // 遍历旧列表剩余节点，在新列表中查找
    let patched = 0
    const toBePatched = e2 - i + 1
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

    for (let j = i; j <= e1; j++) {
      const newIndex = keyToNewIndexMap.get(c1[j].key)
      if (newIndex === undefined) {
        // 旧节点在新列表中不存在 → 删除
        unmount(c1[j])
      } else {
        // 记录新旧索引映射
        newIndexToOldIndexMap[newIndex - i] = j + 1
        patch(c1[j], c2[newIndex])
        patched++
      }
    }

    // 最长递增子序列 — 决定哪些节点不需要移动
    const increasingSeq = getSequence(newIndexToOldIndexMap)
    let j = increasingSeq.length - 1

    // 从后往前遍历，移动或新增节点
    for (let k = toBePatched - 1; k >= 0; k--) {
      const newIndex = k + i
      if (newIndexToOldIndexMap[k] === 0) {
        // 新节点 → 新增
        mount(c2[newIndex], container)
      } else if (k !== increasingSeq[j]) {
        // 不在最长递增子序列中 → 移动
        move(c2[newIndex], container)
      } else {
        // 在最长递增子序列中 → 不动
        j--
      }
    }
  }
}
```

### 2.3 最长递增子序列（LIS）⭐

**问题**：给定一组新旧索引映射，找出不需要移动的节点集合。

```
newIndexToOldIndexMap = [5, 3, 4, 0]
代表：新列表第0项对应旧列表第5项，第1项对应第3项...

最长递增子序列: [3, 4] → 索引 1 和 2 的节点不需要移动
其他节点（索引 0 和 3）需要移动
```

```js
/**
 * 求最长递增子序列（贪心 + 二分）
 * @param {number[]} nums
 * @return {number[]} LIS 的索引序列
 * 时间复杂度 O(n log n)，空间复杂度 O(n)
 */
function getSequence(nums) {
  const n = nums.length
  if (n === 0) return []

  const tails = []    // tails[i] 表示长度为 i+1 的递增子序列末尾最小值
  const prevIdx = new Array(n).fill(-1) // 前驱索引
  const tailsIdx = [] // tails 中存储的是 nums 的索引

  for (let i = 0; i < n; i++) {
    const num = nums[i]
    if (num === 0) continue // 跳过新增节点标记

    // 二分查找 num 在 tails 中的位置
    let left = 0, right = tails.length
    while (left < right) {
      const mid = (left + right) >> 1
      if (nums[tailsIdx[mid]] < num) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (left >= tails.length) {
      tailsIdx.push(i)
    } else {
      tailsIdx[left] = i
    }

    if (left > 0) {
      prevIdx[i] = tailsIdx[left - 1]
    }
  }

  // 回溯构建 LIS
  const result = []
  let k = tailsIdx[tailsIdx.length - 1]
  while (k !== -1) {
    result.unshift(k)
    k = prevIdx[k]
  }

  return result
}

// 测试
console.log(getSequence([10, 9, 2, 5, 3, 7, 101, 18]))
// 输出: [2, 3, 4, 6] → 对应值 [2, 3, 7, 101]
```

### 2.4 Vue 2 vs Vue 3 Diff 对比

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 算法 | 双端比较 | 快速 Diff + LIS |
| 时间复杂度 | O(n²) 最坏 | O(n log n) 最坏 |
| 静态节点 | 每次都参与 Diff | 跳过（Block + 静态提升） |
| 动态节点 | 全量比较属性 | PatchFlag 靶向比较 |
| 移动策略 | 复用 + 插入 | LIS 最小化移动 |

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Vue 3 Diff 算法的五步？ | 预处理前缀 → 预处理后缀 → 处理新增 → 处理删除 → LIS 处理乱序 |
| 为什么用最长递增子序列？ | 找出不需要移动的节点集合，最小化 DOM 操作次数 |
| Vue 3 Diff 的时间复杂度？ | 最坏 O(n log n)（LIS 二分部分），实际大部分情况接近 O(n) |
| PatchFlag 在 Diff 中的作用？ | 跳过无标记节点，有标记的只比较标记属性，大幅减少比较量 |

---

## 知识点 3：VNode 类型与 Fragment/Teleport

### 3.1 VNode 类型

```js
export const enum ShapeFlags {
  ELEMENT = 1,           // 普通元素
  FUNCTIONAL_COMPONENT = 2,
  STATEFUL_COMPONENT = 4,
  TEXT_CHILDREN = 8,     // 子节点是文本
  ARRAY_CHILDREN = 16,   // 子节点是数组
  SLOTS_CHILDREN = 32,   // 子节点是插槽
  TELEPORT = 64,         // Teleport 组件
  SUSPENSE = 128,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}
```

### 3.2 Fragment — 多根节点模板

Vue 3 支持多根节点模板，编译后包裹 Fragment：

```vue
<template>
  <header>Header</header>
  <main>Content</main>  <!-- 多根节点 ✅ -->
  <footer>Footer</footer>
</template>

<!-- 编译后 -->
function render() {
  return (_openBlock(), _createBlock(_Fragment, null, [
    _createVNode("header", null, "Header"),
    _createVNode("main", null, "Content"),
    _createVNode("footer", null, "Footer")
  ]))
}
```

### 3.3 Teleport — DOM 传送

```vue
<template>
  <button @click="showModal = true">Open</button>
  <Teleport to="body">
    <div v-if="showModal" class="modal">
      <p>模态框内容</p>
    </div>
  </Teleport>
</template>
```

Teleport 在 DOM 层面将内容挂载到指定位置，但保持 Vue 组件树的父子关系。

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Fragment 是什么？ | 允许多根节点模板，渲染时不生成额外 DOM 包裹元素 |
| Teleport 的使用场景？ | 模态框、通知、Tooltip 等需要脱离当前 DOM 层级的组件 |
| Teleport 和 Portal 区别？ | Teleport 是 Vue 3 内置，Portal 是 React 概念；Teleport 保持组件树关系 |

---

## 🔧 手写题（2 道）

### 手写题 1：最长递增子序列

```js
/**
 * 求最长递增子序列的索引
 * 贪心 + 二分查找
 * @param {number[]} nums - 输入数组
 * @return {number[]} - LIS 中元素在原数组中的索引
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(n)
 */
function getLISIndices(nums) {
  const n = nums.length
  if (n === 0) return []

  // 1. tails[i] = 长度为 i+1 的递增子序列的末尾元素值
  const tails = []
  // 2. prev[i] = nums[i] 在 LIS 中的前驱元素索引
  const prev = new Array(n).fill(-1)
  // 3. tailIndices[i] = tails[i] 对应的 nums 索引
  const tailIndices = []

  for (let i = 0; i < n; i++) {
    // 4. 二分查找 nums[i] 在 tails 中的插入位置
    let lo = 0, hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (tails[mid] < nums[i]) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }

    // 5. 更新或追加
    tails[lo] = nums[i]
    tailIndices[lo] = i
    if (lo > 0) {
      prev[i] = tailIndices[lo - 1]
    }
  }

  // 6. 回溯构建 LIS
  const result = []
  let k = tailIndices[tails.length - 1]
  while (k !== -1) {
    result.unshift(k)
    k = prev[k]
  }

  return result
}

// ====== 测试用例 ======
console.log(getLISIndices([10, 9, 2, 5, 3, 7, 101, 18]))
// 输出: [2, 4, 5, 6] → 值为 [2, 3, 7, 101]

console.log(getLISIndices([0, 1, 0, 3, 2, 3]))
// 输出: [0, 1, 3, 4] → 值为 [0, 1, 3, 3] 或 [0, 1, 2, 3]

console.log(getLISIndices([7, 7, 7, 7, 7]))
// 输出: [0] → 只有一个

console.log(getLISIndices([]))
// 输出: []
```

### 手写题 2：mini Diff 算法（快速 Diff）

```js
/**
 * Vue 3 风格的简化快速 Diff 算法
 * 仅处理 key 相同节点的移动
 */
function quickDiff(oldList, newList) {
  const moves = [] // 记录需要的移动操作
  let i = 0

  // 1. 从头比较
  while (i < oldList.length && i < newList.length && oldList[i] === newList[i]) {
    i++
  }

  // 2. 从尾比较
  let oldEnd = oldList.length - 1
  let newEnd = newList.length - 1
  while (oldEnd >= i && newEnd >= i && oldList[oldEnd] === newList[newEnd]) {
    oldEnd--
    newEnd--
  }

  // 3. 旧列表处理完 → 新增
  if (i > oldEnd) {
    for (let j = i; j <= newEnd; j++) {
      moves.push({ type: 'add', value: newList[j], index: j })
    }
    return moves
  }

  // 4. 新列表处理完 → 删除
  if (i > newEnd) {
    for (let j = i; j <= oldEnd; j++) {
      moves.push({ type: 'remove', value: oldList[j], index: j })
    }
    return moves
  }

  // 5. 构建 key 映射
  const keyToNewIdx = new Map()
  for (let j = i; j <= newEnd; j++) {
    keyToNewIdx.set(newList[j], j)
  }

  // 6. 标记删除和记录映射
  const source = new Array(newEnd - i + 1).fill(-1)
  for (let j = i; j <= oldEnd; j++) {
    const newIdx = keyToNewIdx.get(oldList[j])
    if (newIdx !== undefined) {
      source[newIdx - i] = j
    } else {
      moves.push({ type: 'remove', value: oldList[j], index: j })
    }
  }

  // 7. LIS 找出不需要移动的节点
  const lis = getLISIndices(source)
  const lisSet = new Set(lis)

  // 8. 标记需要移动的节点
  for (let k = 0; k < source.length; k++) {
    if (source[k] === -1) {
      moves.push({ type: 'add', value: newList[k + i], index: k + i })
    } else if (!lisSet.has(k)) {
      moves.push({ type: 'move', value: newList[k + i], to: k + i })
    }
  }

  return moves
}

// 复用前面的 getLISIndices
function getLISIndices(nums) {
  const n = nums.length
  if (n === 0) return []
  const tails = []
  const prev = new Array(n).fill(-1)
  const tailIndices = []

  for (let i = 0; i < n; i++) {
    if (nums[i] === 0) continue // Vue 3 用 0 标记新增节点
    let lo = 0, hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (nums[tailsIdxOf(mid)] < nums[i]) lo = mid + 1
      else hi = mid
    }
    function tailsIdxOf(idx) { return tailIndices[idx] }

    tails[lo] = nums[i]
    tailIndices[lo] = i
    if (lo > 0) prev[i] = tailIndices[lo - 1]
  }

  const result = []
  let k = tailIndices[tails.length - 1]
  while (k !== undefined && k !== -1) {
    result.unshift(k)
    k = prev[k]
  }
  return result
}

// ====== 测试用例 ======
console.log(quickDiff(['A', 'B', 'C', 'D', 'E'], ['D', 'B', 'E', 'A', 'C']))
// 预期: D 移到头部，其余需根据 LIS 确定位置

console.log(quickDiff(['A', 'B', 'C'], ['A', 'B', 'C']))
// 输出: [] — 无变化

console.log(quickDiff(['A', 'B'], ['A', 'B', 'C']))
// 输出: [{ type: 'add', value: 'C', index: 2 }]
```

---

## 💻 算法题

### LeetCode #35 — 搜索插入位置

**思路**：标准二分查找，找到目标值返回索引；找不到返回插入位置（即第一个大于目标的位置）。

```js
/**
 * 搜索插入位置 — 二分查找
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 * 时间复杂度 O(log n)，空间复杂度 O(1)
 */
function searchInsert(nums, target) {
  let left = 0, right = nums.length - 1

  while (left <= right) {
    const mid = (left + right) >> 1
    if (nums[mid] < target) {
      left = mid + 1
    } else if (nums[mid] > target) {
      right = mid - 1
    } else {
      return mid
    }
  }

  return left // left 就是插入位置
}

// 测试
console.log(searchInsert([1, 3, 5, 6], 5)) // 2
console.log(searchInsert([1, 3, 5, 6], 2)) // 1
console.log(searchInsert([1, 3, 5, 6], 7)) // 4
```

### LeetCode #33 — 搜索旋转排序数组

**思路**：旋转数组一半有序一半无序。二分后判断哪半有序，再决定搜索方向。

```js
/**
 * 搜索旋转排序数组
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 * 时间复杂度 O(log n)，空间复杂度 O(1)
 */
function search(nums, target) {
  let left = 0, right = nums.length - 1

  while (left <= right) {
    const mid = (left + right) >> 1

    if (nums[mid] === target) return mid

    // 左半部分有序
    if (nums[left] <= nums[mid]) {
      if (target >= nums[left] && target < nums[mid]) {
        right = mid - 1
      } else {
        left = mid + 1
      }
    }
    // 右半部分有序
    else {
      if (target > nums[mid] && target <= nums[right]) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
  }

  return -1
}

// 测试
console.log(search([4, 5, 6, 7, 0, 1, 2], 0)) // 4
console.log(search([4, 5, 6, 7, 0, 1, 2], 3)) // -1
```

### LeetCode #153 — 寻找旋转排序数组最小值

**思路**：最小值一定在无序的那一半。比较 `nums[mid]` 和 `nums[right]` 确定收缩方向。

```js
/**
 * 寻找旋转排序数组中的最小值
 * @param {number[]} nums
 * @return {number}
 * 时间复杂度 O(log n)，空间复杂度 O(1)
 */
function findMin(nums) {
  let left = 0, right = nums.length - 1

  while (left < right) {
    const mid = (left + right) >> 1

    if (nums[mid] > nums[right]) {
      // 最小值在 mid 右边
      left = mid + 1
    } else {
      // 最小值在 mid 或左边
      right = mid
    }
  }

  return nums[left]
}

// 测试
console.log(findMin([3, 4, 5, 1, 2])) // 1
console.log(findMin([4, 5, 6, 7, 0, 1, 2])) // 0
console.log(findMin([11, 13, 15, 17])) // 11 — 未旋转
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| 静态提升 HoistStatic | 静态 VNode 提升到 render 外，只创建一次 | ⭐⭐⭐⭐ |
| PatchFlag | 编译时标记动态属性类型，运行时靶向 Diff | ⭐⭐⭐⭐⭐ |
| Block Tree | 扁平收集动态子节点，跳过静态节点的 Diff | ⭐⭐⭐⭐⭐ |
| 事件缓存 CacheHandler | 缓存内联事件函数引用，避免无意义更新 | ⭐⭐⭐ |
| Vue 3 快速 Diff | 预处理前缀/后缀 + LIS 最小化移动 | ⭐⭐⭐⭐⭐ |
| 最长递增子序列 | 贪心+二分 O(n log n)，找出不需要移动的节点 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 10）

明天是合并日，内容较多：**Composition API + Pinia**。学习 `setup` 语法糖、Composables 封装模式、Pinia 状态管理，以及手写简易 Pinia。这是 Vue 3 日常开发的核心技能 💪
