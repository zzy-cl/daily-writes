# 04/28 — 算法冲刺 + 简历优化 + 行为面试（Day 28）

> **阶段**：第四阶段 工程化 + 冲刺
> **今日目标**：高频错题重做 + 简历优化 + 行为面试 STAR 法则
> **投入时间**：上午 2h 算法 / 下午 2h 简历+行为面试

---

## 知识点 1：高频错题重做清单

### 🎯 必做错题 TOP 5

| # | 题目 | 类型 | 关键思路 | 限时 |
|---|------|------|----------|------|
| 42 | 接雨水 | 双指针/栈 | 双指针 O(n) 空间 O(1) | 15min |
| 72 | 编辑距离 | 二维 DP | 增/删/改三种操作 | 15min |
| 300 | 最长递增子序列 | 贪心+二分 | tails 数组维护最小末尾 | 15min |
| 41 | 缺失的第一个正数 | 原地哈希 | 值 i 放到索引 i-1 | 15min |
| 152 | 乘积最大子数组 | DP | 同时维护 max 和 min | 15min |

### 重做策略

```
1. 先读题，不要立刻看题解
2. 用 2 分钟回忆思路（口述或写伪代码）
3. 如果思路清晰 → 限时 15 分钟写完
4. 如果卡住 → 标记 ❌，只看关键提示，再试一次
5. 第二次仍卡 → 看题解，用自己的话写注释
```

---

## 知识点 2：简历优化 ⭐

### 2.1 项目描述 STAR 法则

| 要素 | 含义 | 示例 |
|------|------|------|
| **S** (Situation) | 背景/场景 | "在电商项目中，首页加载时间超过 5 秒" |
| **T** (Task) | 任务/目标 | "需要将 LCP 优化到 2.5 秒以内" |
| **A** (Action) | 行动/做法 | "实施了代码分割、图片懒加载、CDN 分发" |
| **R** (Result) | 结果/数据 | "LCP 降至 1.8 秒，跳出率降低 15%" |

### 2.2 ❌ vs ✅ 项目描述对比

```markdown
❌ 差的描述：
"负责公司官网前端开发，使用 React + TypeScript"

✅ 好的描述：
"S：公司官网首屏加载 >5s，移动端体验差
 T：将 LCP 优化至 2.5s 内，提升移动端体验
 A：(1) 用 React.lazy 实现路由级代码分割，首屏 JS 减少 60%
     (2) 图片转 WebP + 响应式 + 懒加载
     (3) 引入 Sentry 监控性能指标
 R：LCP 从 5.2s 降至 1.9s，移动端跳出率降低 18%"
```

### 2.3 简历项目描述模板

```markdown
## [项目名] — [你的角色]
**技术栈**：React 18 / TypeScript / Zustand / Vite / Playwright

**项目描述**：[一句话说清做什么]

**核心贡献**：
- [动词] + [具体做了什么] + [量化结果]
  - 例：优化首页性能，通过代码分割 + 图片优化，LCP 从 5s 降至 1.9s
- [动词] + [具体做了什么] + [量化结果]
  - 例：设计组件库体系（基础/通用/业务三层），复用率提升 40%
- [动词] + [具体做了什么] + [量化结果]
  - 例：搭建 E2E 测试体系，覆盖核心流程 85%，线上 Bug 减少 30%
```

### 2.4 常见动词库

| 类别 | 推荐动词 |
|------|----------|
| **优化** | 优化、重构、提升、降低、缩减、加速 |
| **设计** | 设计、架构、规划、搭建、抽象 |
| **开发** | 开发、实现、封装、构建、集成 |
| **协作** | 主导、推动、协调、带领、培训 |

---

## 知识点 3：行为面试 STAR 法则 ⭐

### 3.1 高频行为面试题

| 题目 | STAR 要点 |
|------|-----------|
| 最有挑战的项目？ | S：项目背景 → T：核心难点 → A：解决方案 → R：最终结果 |
| 如何处理团队冲突？ | S：冲突场景 → T：需要解决的问题 → A：沟通/协调方式 → R：达成的共识 |
| 一次失败的经历？ | S：项目背景 → T：预期目标 → A：出了什么问题、如何补救 → R：学到了什么 |
| 如何学习新技术？ | S：遇到的技术挑战 → T：需要快速掌握 → A：学习路径（文档→实践→分享） → R：多快上手 |
| 如何优化代码质量？ | S：代码问题 → T：质量目标 → A：具体措施（lint/test/review） → R：指标改善 |

### 3.2 STAR 回答示例

```markdown
Q：最有挑战的项目？

S（背景）：
在电商大促项目中，需要在 2 周内将首页性能优化到 LCP < 2.5s，
当时 LCP 是 5.2 秒，页面有 20+ 个组件、3 个轮播图。

T（任务）：
我负责前端性能优化，目标是不改动设计稿的前提下优化加载速度。

A（行动）：
1. 分析 Lighthouse 报告，定位到最大的 contentful paint 是首屏轮播图
2. 实施了以下优化：
   - 首屏轮播图从 <img> 改为 <picture> + WebP + preload
   - 非首屏组件用 React.lazy 做路由级代码分割
   - 第三方 SDK（客服、统计）延迟加载
   - API 响应启用 Brotli 压缩
3. 每天用 Performance API 监控优化效果

R（结果）：
- LCP 从 5.2s 降至 1.8s（降低 65%）
- 大促当天 PV 提升 22%，跳出率降低 18%
- 总结了优化经验，在团队内做了分享
```

### 3.3 行为面试注意事项

| ✅ 做 | ❌ 不做 |
|-------|---------|
| 用具体数字量化结果 | 只说"效果很好" |
| 强调团队协作 | 把功劳全归自己 |
| 承认不足并说明改进 | 回避问题或过度谦虚 |
| 保持 2-3 分钟的回答长度 | 讲太长（>5分钟）或太短（<30秒） |

---

## 🔧 手写题（1 道）

### 手写题：实现 LRU Cache

```js
/**
 * LRU（最近最少使用）缓存
 * 使用 Map 保持插入顺序，天然支持 LRU 语义
 */
class LRUCache {
  /**
   * @param {number} capacity - 缓存容量
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map 保持插入顺序
  }

  /**
   * 获取缓存值
   * @param {string|number} key
   * @returns {*} 值或 -1
   */
  get(key) {
    // 1. 不存在返回 -1
    if (!this.cache.has(key)) return -1;

    // 2. 存在：移到最新（删除后重新插入）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存值
   * @param {string|number} key
   * @param {*} value
   */
  put(key, value) {
    // 3. 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 4. 插入到最新位置
    this.cache.set(key, value);

    // 5. 超出容量，删除最旧的（Map 第一个）
    if (this.cache.size > this.capacity) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }

  /**
   * @returns {number} 当前缓存大小
   */
  get size() {
    return this.cache.size;
  }
}

// 测试
const cache = new LRUCache(3);
cache.put('a', 1);
cache.put('b', 2);
cache.put('c', 3);
console.log(cache.get('a')); // 1（a 变为最新）
cache.put('d', 4);           // 容量满，淘汰最旧的 b
console.log(cache.get('b')); // -1（已被淘汰）
console.log(cache.get('a')); // 1
console.log(cache.size);     // 3
```

---

## 💻 算法题 — 高频错题重做（含完整代码）

> 今日重做以下经典题，每道限时 15 分钟。

### #42 接雨水 — 双指针法

```javascript
/**
 * 双指针 — O(n) 时间 / O(1) 空间
 * 核心：当前位置能接的水 = min(左侧最高, 右侧最高) - 当前高度
 */
function trap(height) {
  let left = 0, right = height.length - 1
  let leftMax = 0, rightMax = 0, water = 0

  while (left < right) {
    leftMax = Math.max(leftMax, height[left])
    rightMax = Math.max(rightMax, height[right])

    if (leftMax < rightMax) {
      water += leftMax - height[left]
      left++
    } else {
      water += rightMax - height[right]
      right--
    }
  }
  return water
}

console.log(trap([0,1,0,2,1,0,1,3,2,1,2,1])) // 6
```

⚠️ **易错**：`leftMax < rightMax` 决定移动哪边指针，不是比较 height[left] 和 height[right]。

### #72 编辑距离 — 二维 DP

```javascript
/**
 * dp[i][j] = word1[0..i-1] 变成 word2[0..j-1] 的最少操作数
 * 操作：插入、删除、替换
 */
function minDistance(word1, word2) {
  const m = word1.length, n = word2.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  // 边界：空字符串 → 需要全部插入/删除
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] // 字符相同，不需要操作
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 删除
          dp[i][j - 1] + 1,    // 插入
          dp[i - 1][j - 1] + 1 // 替换
        )
      }
    }
  }
  return dp[m][n]
}

console.log(minDistance('horse', 'ros')) // 3
```

### #300 最长递增子序列 — 贪心 + 二分

```javascript
/**
 * tails[i] = 长度为 i+1 的递增子序列的最小末尾元素
 * 贪心：维护尽可能小的末尾，贪心地延长序列
 */
function lengthOfLIS(nums) {
  const tails = []

  for (const num of nums) {
    let left = 0, right = tails.length
    while (left < right) {
      const mid = (left + right) >> 1
      if (tails[mid] < num) left = mid + 1
      else right = mid
    }
    tails[left] = num // 替换或追加
  }
  return tails.length
}

console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])) // 4
```

⚠️ **易错**：tails 数组不是最终的 LIS 序列！它只是辅助计算长度。

### #41 缺失的第一个正数 — 原地哈希

```javascript
/**
 * 将值 i 放到索引 i-1 的位置
 * 然后第一个 nums[i] !== i+1 的位置就是答案
 */
function firstMissingPositive(nums) {
  const n = nums.length

  // 1. 将值放到正确位置
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      [nums[nums[i] - 1], nums[i]] = [nums[i], nums[nums[i] - 1]]
    }
  }

  // 2. 找第一个不匹配的位置
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1
  }
  return n + 1
}

console.log(firstMissingPositive([1, 2, 0]))       // 3
console.log(firstMissingPositive([3, 4, -1, 1]))   // 2
console.log(firstMissingPositive([7, 8, 9, 11]))   // 1
```

### #152 乘积最大子数组 — 同时维护 max 和 min

```javascript
/**
 * 因为负数×负数=正数，需要同时维护当前最大值和最小值
 */
function maxProduct(nums) {
  let max = nums[0], min = nums[0], result = nums[0]

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < 0) [max, min] = [min, max] // 负数交换

    max = Math.max(nums[i], max * nums[i])
    min = Math.min(nums[i], min * nums[i])
    result = Math.max(result, max)
  }
  return result
}

console.log(maxProduct([2, 3, -2, 4]))  // 6
console.log(maxProduct([-2, 0, -1]))    // 0
```

⚠️ **易错**：遇到负数要先交换 max 和 min，否则计算会出错。

### #200 岛屿数量（新增）— BFS/DFS

```javascript
/**
 * 遍历网格，遇到 '1' 就 DFS 把整个岛屿标记为 '0'，计数+1
 * O(m×n) 时间 / O(m×n) 空间（最坏情况递归栈）
 */
function numIslands(grid) {
  if (!grid.length) return 0
  const m = grid.length, n = grid[0].length
  let count = 0

  function dfs(i, j) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === '0') return
    grid[i][j] = '0' // 标记已访问
    dfs(i + 1, j)
    dfs(i - 1, j)
    dfs(i, j + 1)
    dfs(i, j - 1)
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === '1') {
        count++
        dfs(i, j)
      }
    }
  }
  return count
}

const grid = [
  ['1','1','0','0','0'],
  ['1','1','0','0','0'],
  ['0','0','1','0','0'],
  ['0','0','0','1','1']
]
console.log(numIslands(grid)) // 3
```

---

## 💻 新增算法题：#236 二叉树的最近公共祖先

```javascript
/**
 * 递归 — O(n) 时间 / O(h) 空间
 * 后序遍历：左右子树分别查找 p 和 q
 * - 左右都找到 → 当前节点就是 LCA
 * - 只有一边找到 → 返回那一边的结果
 */
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root

  const left = lowestCommonAncestor(root.left, p, q)
  const right = lowestCommonAncestor(root.right, p, q)

  if (left && right) return root // p 和 q 分别在两侧
  return left || right // 都在同一侧
}

const tree = {
  val: 3,
  left: { val: 5, left: { val: 6 }, right: { val: 2, left: { val: 7 }, right: { val: 4 } } },
  right: { val: 1, left: { val: 0 }, right: { val: 8 } }
}
const p = tree.left        // 节点 5
const q = tree.right       // 节点 1
console.log(lowestCommonAncestor(tree, p, q).val) // 3
```

⚠️ **易错**：返回条件 `root === p || root === q` 不能写成 `root.val === p.val`（值可能重复）。

---

## 🎤 行为面试 STAR 示例（扩展）

### 示例 1：最有挑战的性能优化

```markdown
S（场景）：电商首页在大促期间加载时间 >5s，用户流失率高达 40%
T（任务）：2 周内将 LCP 优化到 2.5s 以内
A（行动）：
  1. 用 Lighthouse 分析，定位最大 Contentful Paint 是首屏轮播图
  2. 实施优化：
     - 轮播图从 <img> 改为 <picture> + WebP + preload
     - React.lazy 做路由级代码分割，首屏 JS 减少 60%
     - 第三方 SDK（客服/统计）延迟加载
     - 接入 Brotli 压缩
  3. 每天用 Performance API 监控优化效果
R（结果）：LCP 从 5.2s 降至 1.8s，大促当天 PV 提升 22%，跳出率降低 18%
```

### 示例 2：跨团队技术冲突处理

```markdown
S（场景）：后端团队提议将所有 API 响应改为 GraphQL，前端团队有不同意见
T（任务）：需要在不影响项目进度的前提下达成共识
A（行动）：
  1. 组织了一次技术评审会，双方各自陈述优劣
  2. 我提出折中方案：核心数据流用 GraphQL，简单 CRUD 保持 REST
  3. 做了 POC 验证，对比两种方案的开发效率和性能差异
  4. 整理了迁移成本评估文档
R（结果）：团队采纳折中方案，开发效率提升 15%，没有额外延期
```

### 示例 3：紧急线上 Bug 处理

```markdown
S（场景）：周五晚上收到告警，支付页面白屏，影响约 30% 用户
T（任务）：快速定位并修复问题，同时安抚用户
A（行动）：
  1. 第一时间通过 Sentry 错误栈定位到是第三方支付 SDK 版本更新导致
  2. 15 分钟内发布 hotfix：锁定 SDK 版本 + 降级方案
  3. 事后写了 Postmortem：为什么会发生、怎么预防、改进措施
  4. 推动团队建立了依赖版本锁定 + CI 兼容性检查
R（结果）：30 分钟恢复服务，用户投诉 <5 人，后续再未发生类似问题
```

⚠️ **行为面试易错**：
- ❌ 只说"我做了 X"，不说结果 → 必须有量化数据
- ❌ 把团队功劳全归自己 → "我主导，团队协作"
- ❌ 回避失败经历 → 展示反思和成长
- ✅ 保持 2-3 分钟，不要讲太长

---

## 📝 简历技术栈描述规范

### ❌ vs ✅ 描述对比

| 类别 | ❌ 差的描述 | ✅ 好的描述 |
|------|-----------|-----------|
| 技术栈 | "熟悉 Vue、React、TypeScript" | "主力 Vue 3 + TS，React 18 有 2 个项目经验，熟悉 Zustand/Pinia 状态管理" |
| 项目经历 | "负责公司官网开发" | "主导公司官网重构，Vue 3 + Vite，首屏 LCP 从 5s 优化到 1.9s" |
| 工具链 | "会用 Git、Webpack" | "日常 Git Flow 工作流，Vite 5 为主要构建工具，配置过 Monorepo（pnpm workspace）" |
| AI 方向 | "了解 AI" | "实践 MCP 协议暴露工具给 AI Agent，用 RAG 做知识库问答系统" |

### 简历技术栈模板

```markdown
## 技术能力

**主力栈**：Vue 3 + TypeScript + Vite + Pinia
**也能写**：React 18 + Next.js + Zustand
**工程化**：Monorepo (pnpm) + Vitest + Playwright + GitHub Actions
**网络/安全**：HTTP/2、CSP、JWT 鉴权
**AI 方向**：MCP 协议、RAG 集成、Prompt Engineering
**其他**：Node.js (Express)、Docker、Linux 基础
```

---

## 📝 今日总结（更新版）

| 知识点 | 核心要点 | 面试频率 |
|--------|----------|----------|
| STAR 法则 | Situation → Task → Action → Result，必须有数字 | ⭐⭐⭐⭐⭐ |
| 简历量化 | 用数字说话（降低 65%、提升 22%） | ⭐⭐⭐⭐⭐ |
| 行为面试 | 强调协作、承认不足、保持 2-3 分钟 | ⭐⭐⭐⭐ |
| LRU Cache | Map 保持顺序，O(1) get/put | ⭐⭐⭐⭐ |
| 接雨水 | 双指针，较矮的一侧决定水量 | ⭐⭐⭐⭐⭐ |
| 编辑距离 | 二维 DP，增删改三种操作 | ⭐⭐⭐⭐ |
| 岛屿数量 | DFS/BFS 遍历网格，标记已访问 | ⭐⭐⭐⭐ |
| LCA | 后序递归，左右子树分别找 | ⭐⭐⭐⭐ |
| 简历技术栈 | 主力栈 + 也能写 + 工程化 + 方向 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 29）

**全真模拟面试** — 第一轮基础八股 + AI 代码审查（20 题），第二轮项目讲解 + 系统设计（2-3 个场景题），晚上第三轮算法题 3 道（Medium，限时 30 分钟每道）。
