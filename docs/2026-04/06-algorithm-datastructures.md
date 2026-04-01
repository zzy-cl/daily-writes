# 04/06 — 算法专项 + 数据结构（Day 6）

> **阶段**：第一阶段 前端基础强化
> **今日目标**：速刷核心数据结构（链表/栈/队列/哈希表/二叉树），手写 LRU Cache，攻克链表经典三题
> **投入时间**：上午 2h / 下午 2h / 晚上 3h 算法

---

## 知识点 1：链表（Linked List）

### 1.1 链表 vs 数组

| 特性 | 数组 | 链表 |
|------|------|------|
| 内存 | 连续 | 分散 |
| 随机访问 | ✅ O(1) | ❌ O(n) |
| 头部插入 | O(n) | O(1) |
| 尾部插入 | O(1)（有空间）| O(1)（有尾指针）|
| 中间插入 | O(n) | O(1)（已知前驱）|
| 空间开销 | 小 | 每个节点多一个指针 |

### 1.2 链表节点定义

```ts
// 单链表节点
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// 双链表节点
class DoublyListNode {
  val: number;
  prev: DoublyListNode | null;
  next: DoublyListNode | null;
  constructor(val: number) {
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}
```

### 1.3 虚拟头节点技巧 ⭐🔑

```ts
// 很多链表题目用 dummy 节点简化边界处理
// ❌ 不用 dummy：需要单独处理 head 被删除的情况
// ✅ 用 dummy：统一处理

function removeElements(head: ListNode | null, val: number): ListNode | null {
  const dummy = new ListNode(0, head); // 虚拟头节点
  let prev = dummy;

  while (prev.next) {
    if (prev.next.val === val) {
      prev.next = prev.next.next; // 删除
    } else {
      prev = prev.next;
    }
  }
  return dummy.next; // 返回 dummy.next 即为新 head
}
```

### 面试 Q&A

| 问题 | 答案 |
|------|------|
| 什么时候用链表不用数组？ | 频繁头部插入/删除、不确定大小、需要 O(1) 插入 |
| 虚拟头节点的作用？ | 避免 head 被删除/替换时的特殊处理 |
| 如何判断链表有环？ | 快慢指针（Floyd 判圈算法）|

---

## 知识点 2：栈 / 队列 / 哈希表

### 2.1 栈（Stack）— LIFO

```ts
// JS 中可用数组模拟
class Stack<T> {
  private data: T[] = [];

  push(val: T) { this.data.push(val); }
  pop(): T | undefined { return this.data.pop(); }
  peek(): T | undefined { return this.data[this.data.length - 1]; }
  get size() { return this.data.length; }
  get empty() { return this.data.length === 0; }
}

// 应用：括号匹配、单调栈（下一个更大元素）、DFS
```

### 2.2 队列（Queue）— FIFO

```ts
// ⚠️ 数组的 shift() 是 O(n)，用链表实现更好
// 或者用双端队列模拟
class Queue<T> {
  private data: T[] = [];
  private front = 0; // 用指针避免 shift()

  enqueue(val: T) { this.data.push(val); }
  dequeue(): T | undefined {
    if (this.front >= this.data.length) return undefined;
    return this.data[this.front++];
  }
  peek(): T | undefined { return this.data[this.front]; }
  get size() { return this.data.length - this.front; }
}

// 应用：BFS、滑动窗口最大值（单调队列）
```

### 2.3 哈希表 ⭐

```ts
// JS 中 Object / Map 都可以作为哈希表

// 字母频率统计模板
function charCount(s: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const ch of s) {
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  return map;
}

// 两数之和：用 Map 一次遍历
function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
  // 时间 O(n)，空间 O(n)
}
```

---

## 知识点 3：二叉树基础

### 3.1 二叉树节点定义

```ts
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val: number, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
```

### 3.2 三种遍历 ⭐

```ts
// 前序遍历（根 → 左 → 右）
function preorder(root: TreeNode | null): number[] {
  if (!root) return [];
  return [root.val, ...preorder(root.left), ...preorder(root.right)];
}

// 中序遍历（左 → 根 → 右）— BST 中序是有序的
function inorder(root: TreeNode | null): number[] {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}

// 后序遍历（左 → 右 → 根）
function postorder(root: TreeNode | null): number[] {
  if (!root) return [];
  return [...postorder(root.left), ...postorder(root.right), root.val];
}

// 层序遍历（BFS）
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue: TreeNode[] = [root];

  while (queue.length) {
    const levelSize = queue.length;
    const level: number[] = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
```

### 3.3 BFS vs DFS 选择指南 🔑

| 场景 | 推荐 | 原因 |
|------|------|------|
| 最短路径 / 层序 | BFS | 逐层扩展，先到先得 |
| 路径存在 / 回溯 | DFS | 递归直观 |
| 全部路径 | DFS + 回溯 | 天然记录路径 |
| 最小深度 | BFS | 一碰到叶子就返回 |

---

## 🔧 手写题

### 手写题 1：LRU 缓存 ⭐🔑

```ts
/**
 * LRU (Least Recently Used) 缓存
 * get/put 都是 O(1) 时间复杂度
 *
 * 数据结构：Map（保持插入顺序 + O(1) 查找）
 *
 * @example
 * const cache = new LRUCache(2);
 * cache.put(1, 1);    // 缓存: {1=1}
 * cache.put(2, 2);    // 缓存: {1=1, 2=2}
 * cache.get(1);       // 1, 缓存: {2=2, 1=1} — 1被访问移到最后
 * cache.put(3, 3);    // 淘汰 2（最久未使用）, 缓存: {1=1, 3=3}
 * cache.get(2);       // -1（已被淘汰）
 */
class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    // 1. 设置容量上限
    this.capacity = capacity;
    // 2. Map 保持插入顺序（ES6+ 特性）
    //    最近使用的在末尾，最久未使用的在头部
    this.cache = new Map();
  }

  get(key: number): number {
    // 3. 如果 key 不存在返回 -1
    if (!this.cache.has(key)) return -1;
    // 4. 存在则先删除再重新 set（移到最新位置）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: number, value: number): void {
    // 5. 如果 key 已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 6. 插入新值
    this.cache.set(key, value);
    // 7. 超出容量，删除最久未使用的（Map 的第一个 key）
    if (this.cache.size > this.capacity) {
      // Map.keys().next().value 获取第一个 key（最久未使用）
      const oldestKey = this.cache.keys().next().value!;
      this.cache.delete(oldestKey);
    }
  }
}

// 测试
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));    // 1
cache.put(3, 3);              // 淘汰 key=2
console.log(cache.get(2));    // -1
cache.put(4, 4);              // 淘汰 key=1
console.log(cache.get(1));    // -1
console.log(cache.get(3));    // 3
console.log(cache.get(4));    // 4
```

**为什么用 Map 而不是手写双向链表？**

| 方案 | get | put | 实现复杂度 | 实际表现 |
|------|-----|-----|-----------|---------|
| Map（利用插入顺序）| O(1) | O(1) | ✅ 简单 | 生产常用 |
| 双向链表 + 哈希表 | O(1) | O(1) | ❌ 复杂 | 面试考察 |

> 面试时如果面试官要求"不使用 Map 的插入顺序特性"，才需要手写双向链表版本。

### 手写题 2：前缀和数组

```ts
/**
 * 前缀和：快速计算子数组和
 *
 * prefixSum[i] = nums[0] + nums[1] + ... + nums[i-1]
 * 区间和 [l, r] = prefixSum[r+1] - prefixSum[l]
 */
class PrefixSum {
  private prefix: number[];

  constructor(nums: number[]) {
    // 1. 构建前缀和数组（长度 n+1，prefix[0]=0）
    this.prefix = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
      this.prefix[i + 1] = this.prefix[i] + nums[i];
    }
  }

  /**
   * 查询区间 [left, right] 的和
   * @param {number} left - 起始索引（包含）
   * @param {number} right - 结束索引（包含）
   * @returns {number}
   */
  query(left: number, right: number): number {
    // 2. O(1) 查询
    return this.prefix[right + 1] - this.prefix[left];
  }
}

// 测试
const ps = new PrefixSum([1, 2, 3, 4, 5]);
console.log(ps.query(0, 2)); // 6 (1+2+3)
console.log(ps.query(1, 3)); // 9 (2+3+4)
console.log(ps.query(2, 4)); // 12 (3+4+5)

// ⚠️ 前缀和适用于多次区间求和查询（预处理 O(n)，查询 O(1)）
// 如果只有一次查询，直接遍历即可
```

### 手写题 3：差分数组

```ts
/**
 * 差分数组：快速对区间做增减操作
 *
 * diff[i] = nums[i] - nums[i-1]（diff[0] = nums[0]）
 * 对 [l, r] 每个元素 +val：
 *   diff[l] += val, diff[r+1] -= val
 */
class Difference {
  private diff: number[];

  constructor(nums: number[]) {
    // 1. 构建差分数组
    this.diff = new Array(nums.length).fill(0);
    this.diff[0] = nums[0];
    for (let i = 1; i < nums.length; i++) {
      this.diff[i] = nums[i] - nums[i - 1];
    }
  }

  /**
   * 区间 [left, right] 每个元素加 val
   */
  increment(left: number, right: number, val: number): void {
    // 2. O(1) 修改
    this.diff[left] += val;
    if (right + 1 < this.diff.length) {
      this.diff[right + 1] -= val;
    }
  }

  /**
   * 返回还原后的结果数组
   */
  result(): number[] {
    // 3. 从差分数组还原
    const res = new Array(this.diff.length);
    res[0] = this.diff[0];
    for (let i = 1; i < this.diff.length; i++) {
      res[i] = res[i - 1] + this.diff[i];
    }
    return res;
  }
}

// 测试
const d = new Difference([1, 2, 3, 4, 5]);
d.increment(1, 3, 2); // [1,2,3,4,5] → [1,4,5,6,5]
console.log(d.result()); // [1, 4, 5, 6, 5]
```

---

## 💻 算法题

### 算法题 1：反转链表（LeetCode #206）⭐

**思路**：三指针法。遍历链表，逐个将节点的 next 指向前一个节点。

```ts
/**
 * @param {ListNode | null} head
 * @return {ListNode | null}
 */
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;

  while (curr) {
    const next = curr.next; // 1. 暂存下一个节点
    curr.next = prev;       // 2. 反转指向
    prev = curr;            // 3. prev 前进
    curr = next;            // 4. curr 前进
  }
  return prev; // 5. prev 就是新的 head
  // 时间 O(n)，空间 O(1)
}

// 测试：构建链表 1→2→3→4→5
const node5 = new ListNode(5);
const node4 = new ListNode(4, node5);
const node3 = new ListNode(3, node4);
const node2 = new ListNode(2, node3);
const node1 = new ListNode(1, node2);

const reversed = reverseList(node1);
// 5→4→3→2→1
let curr = reversed;
const vals: number[] = [];
while (curr) { vals.push(curr.val); curr = curr.next; }
console.log(vals); // [5, 4, 3, 2, 1]
```

| 解法 | 时间 | 空间 | 特点 |
|------|------|------|------|
| 迭代（三指针）| O(n) | O(1) | ✅ 最常用 |
| 递归 | O(n) | O(n) | 优雅但有栈溢出风险 |

---

### 算法题 2：回文链表（LeetCode #234）

**思路**：快慢指针找中点 → 反转后半部分 → 逐个比较。空间 O(1)。

```ts
/**
 * @param {ListNode | null} head
 * @return {boolean}
 */
function isPalindrome(head: ListNode | null): boolean {
  if (!head || !head.next) return true;

  // 1. 快慢指针找中点
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;
  while (fast?.next?.next) {
    slow = slow!.next;
    fast = fast.next.next;
  }

  // 2. 反转后半部分
  let prev: ListNode | null = null;
  let curr = slow!.next;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // 3. 比较前半部分和反转后的后半部分
  let p1: ListNode | null = head;
  let p2: ListNode | null = prev;
  while (p1 && p2) {
    if (p1.val !== p2.val) return false;
    p1 = p1.next;
    p2 = p2.next;
  }
  return true;
  // 时间 O(n)，空间 O(1)
}

// 测试
const a = new ListNode(1, new ListNode(2, new ListNode(2, new ListNode(1))));
console.log(isPalindrome(a)); // true

const b = new ListNode(1, new ListNode(2));
console.log(isPalindrome(b)); // false
```

---

### 算法题 3：环形链表 II（LeetCode #142）⭐

**思路**：Floyd 判圈算法（快慢指针）。第一次相遇后，将一个指针放回头部，两个指针同速前进，再次相遇的点就是入环点。

**数学证明**：
- 设头到环入口距离 a，环入口到相遇点距离 b，环长 c
- 相遇时：slow 走了 a+b，fast 走了 a+b+nc
- fast 速度是 slow 的 2 倍：2(a+b) = a+b+nc → a+b = nc → a = nc-b = (n-1)c + (c-b)
- 所以从 head 和相遇点同速走，会在入口相遇

```ts
/**
 * @param {ListNode | null} head
 * @return {ListNode | null}
 */
function detectCycle(head: ListNode | null): ListNode | null {
  let slow = head, fast = head;

  // 1. 第一次相遇（如果有环）
  while (fast?.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      // 2. 找到相遇点，一个指针回起点
      let ptr = head;
      while (ptr !== slow) {
        ptr = ptr!.next;
        slow = slow!.next;
      }
      return ptr; // 入环点
    }
  }
  return null; // 无环
  // 时间 O(n)，空间 O(1)
}

// 测试
const c1 = new ListNode(3);
const c2 = new ListNode(2);
const c3 = new ListNode(0);
const c4 = new ListNode(-4);
c1.next = c2; c2.next = c3; c3.next = c4; c4.next = c2; // 环在 c2
console.log(detectCycle(c1)); // ListNode { val: 2, ... }

const noLoop = new ListNode(1, new ListNode(2));
console.log(detectCycle(noLoop)); // null
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| 链表 | 虚拟头节点、快慢指针、三指针反转 | ⭐⭐⭐⭐⭐ |
| 栈/队列 | 单调栈、BFS 队列、用数组/链表实现 | ⭐⭐⭐⭐ |
| 哈希表 | 两数之和模板、频率统计 | ⭐⭐⭐⭐⭐ |
| 二叉树遍历 | 前/中/后序递归、层序 BFS | ⭐⭐⭐⭐⭐ |
| LRU Cache | Map 利用插入顺序，O(1) get/put | ⭐⭐⭐⭐⭐ |
| 前缀和/差分 | 预处理 O(n) → 查询/修改 O(1) | ⭐⭐⭐ |
| Floyd 判圈 | 快慢指针找环 + 找入口 | ⭐⭐⭐⭐⭐ |

### 🔑 今日关键收获
1. 链表题的核心：**dummy 节点**简化边界 + **快慢指针**解决中点/环
2. LRU 的关键：Map 的 `keys().next().value` 获取最久未使用
3. 前缀和适用于多次区间求和查询（预处理 O(n)，查询 O(1)）
4. Floyd 判圈的数学直觉：a = (n-1)c + (c-b)

---

## 📌 明天预告（Day 7）

Day 7 是 **第一周复盘日**（轻量日，2-3h）：
- 整理本周错题和难点
- 口述 JS 基础题 10 道
- 回顾力扣错题

冲刺完一周，复盘才是真正的加速器！📚
