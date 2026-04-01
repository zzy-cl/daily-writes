# 04/22 — 🔧 构建工具与工程化

> 🕐 预计 4-5h | 知识点 2.5h + 手写题 1h + 算法 1.5h

---

## 📌 知识点1：Vite 原理

### 🔑 核心架构：为什么 Vite 这么快？

```
传统打包器（Webpack）：           Vite：
┌─────────────┐                  ┌─────────────┐
│ 分析所有依赖  │                  │ 按需编译     │
│ 打包所有模块  │ ──慢──          │ 浏览器请求时  │ ──快──
│ 生成 bundle  │                  │ 才编译对应文件 │
└─────────────┘                  └─────────────┘
```

**关键差异**：
- Webpack：启动时打包所有文件 → 启动慢
- Vite：利用浏览器原生 ESM，按需编译 → 启动快

### 🔑 ESBuild 预构建（开发环境）

```
作用：
1. 将 CommonJS/UMD 转换为 ESM（如 require('lodash')）
2. 将大量小文件合并（如 lodash 内部几百个小模块 → 一个文件）
3. 预构建结果缓存在 node_modules/.vite

为什么用 ESBuild？
- Go 语言编写，比 JS 快 10-100 倍
- 用于：依赖预构建、TS/JSX 转译、代码压缩（build.minify）
```

### 🔑 Rollup 生产构建

```
生产环境为什么用 Rollup？
- ESBuild 不支持 CSS 代码分割、CSS 提取
- Rollup 的 Tree Shaking 更成熟
- 输出更干净的 ESM/CJS bundle
- 插件生态丰富（Vite 插件基于 Rollup 插件接口）

Vite 的生产构建 = Rollup + @rollup/plugin-commonjs + ...
```

### 🔑 HMR 原理（热模块替换）

```
┌──────────┐     WebSocket     ┌──────────┐
│  浏览器   │ ←──────────────→ │  Vite    │
│          │   file-changed    │  Server  │
│  HMR API │ ←──────────────── │          │
└──────────┘   update payload  └──────────┘

流程：
1. 文件修改 → Vite Server 检测到变化
2. 通过 WebSocket 发送 `{ type: 'update', updates: [...] }`
3. 浏览器收到 → 动态 import 新模块
4. 执行 module.hot.accept() 回调 → 局部更新 DOM
5. 不刷新整个页面，保留应用状态
```

**与 Webpack HMR 对比**：
| | Vite HMR | Webpack HMR |
|---|---|---|
| 速度 | 基于 ESM，极快 | 需要重新构建模块图 |
| 实现 | 原生 ESM + WebSocket | HMR Runtime + WebSocket |
| 配置 | 开箱即用 | 需配置 HotModuleReplacementPlugin |

### 🔑 Vite 插件钩子

```
// Vite 插件基于 Rollup 插件接口扩展
export default function myPlugin() {
  return {
    // 插件名称
    name: 'my-plugin',

    // ⚡ 构建相关（Rollup 通用）
    resolveId(source) {},        // 解析模块路径
    load(id) {},                 // 加载模块内容
    transform(code, id) {},      // 转换模块代码

    // 🔧 Vite 专属钩子
    config(config) {},           // 修改 Vite 配置
    configureServer(server) {},  // 配置开发服务器（添加中间件）
    transformIndexHtml(html) {}, // 转换 index.html
    handleHotUpdate(ctx) {},     // 自定义 HMR 更新逻辑
  };
}
```

### ⚠️ Vite 常见问题

- ❌ 开发/生产环境不一致：开发用 ESBuild，生产用 Rollup，可能有行为差异
- ❌ 非 ESM 依赖需要在 `optimizeDeps.include` 中手动指定
- ❌ 旧浏览器兼容需要 `@vitejs/plugin-legacy`

---

## 📌 知识点2：Webpack 5 核心

### 🔑 Loader vs Plugin

```
Loader：文件转换器（module.rules）
├── 作用：把 A 类型文件 → B 类型（如 TS → JS，SASS → CSS）
├── 执行：从右到左，从下到上
└── 示例：babel-loader, css-loader, ts-loader

Plugin：构建扩展器（plugins）
├── 作用：扩展 Webpack 功能（打包优化、资源管理、注入变量）
├── 执行：在构建生命周期的钩子上注册
└── 示例：HtmlWebpackPlugin, MiniCssExtractPlugin, DefinePlugin
```

```js
// webpack.config.js 核心配置
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',     // ✅ Loader：处理 .ts/.tsx 文件
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({    // ✅ Plugin：生成 HTML
      template: './src/index.html',
    }),
  ],
};
```

### 🔑 Module Federation（模块联邦）

Webpack 5 新特性，实现**微前端运行时模块共享**。

```js
// App A（提供者）
new ModuleFederationPlugin({
  name: 'appA',
  filename: 'remoteEntry.js',
  exposes: {
    './Button': './src/components/Button',
  },
  shared: ['react', 'react-dom'], // 共享依赖，避免重复加载
});

// App B（消费者）
new ModuleFederationPlugin({
  name: 'appB',
  remotes: {
    appA: 'appA@http://localhost:3001/remoteEntry.js',
  },
});

// App B 中使用
const Button = React.lazy(() => import('appA/Button'));
```

### 🔑 持久化缓存

```js
// Webpack 5 持久化缓存 — 二次构建速度提升 10x+
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename], // 配置文件变化时失效
    },
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
  },
};
```

### 🔑 splitChunks 优化策略

```js
optimization: {
  splitChunks: {
    chunks: 'all',           // 对所有 chunk 生效
    minSize: 20000,          // 最小 20KB 才拆分
    maxAsyncRequests: 30,    // 最大并行请求数
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: -10,
      },
      common: {
        minChunks: 2,        // 至少被 2 个 chunk 引用
        priority: -20,
        reuseExistingChunk: true,
      },
    },
  },
},
```

### ⚠️ Webpack vs Vite 选型

| 场景 | 推荐 | 原因 |
|------|------|------|
| 新项目（2024+） | ✅ Vite | 更快、更简单 |
| 遗留项目 | ✅ Webpack | 已有配置，迁移成本高 |
| 微前端（MF） | ✅ Webpack | Module Federation 成熟 |
| Node SSR 构建 | ✅ Vite | SSR 支持更好 |
| 需要极致定制 | ✅ Webpack | 插件生态更丰富 |

---

## 📌 知识点3：Monorepo 方案

### 🔑 三种主流方案对比

| 特性 | pnpm workspace | Turborepo | Lerna |
|------|---------------|-----------|-------|
| 核心能力 | 依赖管理 | 任务编排 | 版本管理 + 发布 |
| 幽灵依赖 | ✅ 天然隔离 | ❌ 需配合 pnpm | ❌ |
| 构建缓存 | ❌ | ✅ 远程/本地缓存 | ❌ |
| 增量构建 | ❌ | ✅ 依赖图感知 | ❌ |
| 包发布 | ❌ | ❌ | ✅ |
| 组合使用 | + Turborepo | + pnpm | + pnpm/nx |

### 🔑 pnpm workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// packages/ui/package.json
{
  "name": "@myorg/ui",
  "dependencies": {
    "@myorg/utils": "workspace:*"  // ✅ workspace 协议引用
  }
}
```

### 🔑 Turborepo 配置

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],    // 先构建依赖
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    }
  }
}
```

**Turbo 核心优势**：
- 🔑 **依赖图感知**：自动分析包之间的依赖关系，并行构建
- 🔑 **远程缓存**：`turbo build` 结果缓存到云端，CI/CD 共享
- 🔑 **增量构建**：只重新构建变化的包

### ⚠️ Monorepo 易错点

- ❌ 幽灵依赖：pnpm 天然隔离，npm/yarn 需要额外配置
- ❌ 循环依赖：包 A 依赖 B，B 又依赖 A → 构建失败
- ❌ 版本管理：统一版本 vs 独立版本策略选择

---

## 💻 手写题

### 手写题1：手写简易 Vite 插件

> 📝 实现一个插件：将 `.md` 文件转换为 React 组件

```js
// vite-plugin-markdown.js
import { readFileSync } from 'fs';

export default function markdownPlugin() {
  return {
    name: 'vite-plugin-markdown',

    // ✅ 1. 解析 .md 文件的导入
    resolveId(source) {
      if (source.endsWith('.md')) {
        return source; // 返回原始路径，标记为已解析
      }
    },

    // ✅ 2. 加载 .md 文件内容
    load(id) {
      if (!id.endsWith('.md')) return null;

      const content = readFileSync(id, 'utf-8');

      // 将 Markdown 转换为 React 组件
      const code = `
        import React from 'react';

        const content = ${JSON.stringify(content)};

        export default function MarkdownComponent() {
          return React.createElement('div', {
            className: 'markdown-body',
            dangerouslySetInnerHTML: { __html: content }
          });
        }

        export const raw = ${JSON.stringify(content)};
      `;

      return code;
    },

    // ✅ 3. 处理 HMR
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.md')) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return []; // 告诉 Vite 不需要额外处理
      }
    },
  };
}

// 使用方式
// vite.config.js
// import markdownPlugin from './vite-plugin-markdown';
// export default { plugins: [markdownPlugin()] }
```

### 手写题2：手写简易 Webpack Loader

> 📝 实现一个 Loader：将 `console.log` 替换为自定义 logger

```js
// console-loader.js
// Webpack Loader 就是一个函数，接收源码，返回转换后的源码

module.exports = function consoleLoader(source) {
  // ✅ 获取 options（从 webpack.config.js 传入）
  const options = this.getOptions() || {};
  const prefix = options.prefix || '[MyApp]';

  // ✅ this.callback 支持异步和 source map
  const callback = this.async();

  // 将 console.log 替换为带前缀的版本
  const result = source.replace(
    /console\.log\((.*?)\)/g,
    `console.log('${prefix}', $1)`
  );

  // ✅ 返回转换后的代码和 source map
  callback(null, result);
};

// 使用方式
// webpack.config.js
// {
//   test: /\.js$/,
//   use: {
//     loader: './console-loader.js',
//     options: { prefix: '[Dev]' }
//   }
// }
```

⚠️ **Loader 编写注意**：
- ✅ 用 `this.async()` 处理异步操作
- ✅ 用 `this.getOptions()` 获取配置
- ❌ 不要在 Loader 中做有副作用的事
- ❌ 不要返回 Promise（用 callback 模式）

---

## 💻 算法题

### 算法1：#322 零钱兑换（Coin Change）⭐

**题目**：给定不同面额的硬币 `coins` 和一个总金额 `amount`，计算凑成总金额所需的**最少硬币数**。不能凑成返回 -1。

**思路**：完全背包问题，`dp[i]` 表示凑成金额 i 的最少硬币数。

```js
/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
  // dp[i] = 凑成金额 i 的最少硬币数
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // 🔑 凑成 0 元需要 0 个硬币

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        // ✅ 状态转移：选这个硬币 + 剩余金额的最优解
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
};

// 测试
console.log(coinChange([1, 5, 11], 15)); // 3 (5+5+5)
console.log(coinChange([2], 3));          // -1
console.log(coinChange([1], 0));          // 0
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(amount × coins.length) |
| 空间 | O(amount) |

---

### 算法2：#139 单词拆分（Word Break）⭐

**题目**：给定字符串 `s` 和字典 `wordDict`，判断 `s` 是否可以被拆分为字典中的单词。

**思路**：`dp[i]` 表示 `s[0..i-1]` 是否可拆分。

```js
/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
var wordBreak = function(s, wordDict) {
  const wordSet = new Set(wordDict);
  const n = s.length;

  // dp[i] = s 的前 i 个字符能否被拆分
  const dp = new Array(n + 1).fill(false);
  dp[0] = true; // 🔑 空串可以被拆分

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      // ✅ 如果 dp[j] 为 true，且 s[j..i-1] 在字典中
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break; // 找到一种拆法即可
      }
    }
  }

  return dp[n];
};

// 测试
console.log(wordBreak('leetcode', ['leet', 'code']));  // true
console.log(wordBreak('applepenapple', ['apple', 'pen'])); // true
console.log(wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat'])); // false
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(n² × m) — n=字符串长度，m=平均单词查找时间 |
| 空间 | O(n) |

---

### 算法3：#300 最长递增子序列（LIS）⭐⭐

**题目**：给定整数数组 `nums`，找到其中最长严格递增子序列的长度。

**思路1（DP）**：`dp[i]` = 以 `nums[i]` 结尾的 LIS 长度。O(n²)

**思路2（贪心 + 二分）**：维护递增序列 `tails`，用二分查找优化。O(n log n)

```js
/**
 * 方法1：动态规划 O(n²)
 */
var lengthOfLIS = function(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(1); // 每个元素自身长度至少为 1

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
};

/**
 * 方法2：贪心 + 二分查找 O(n log n) ⭐ 面试推荐
 */
var lengthOfLISOptimized = function(nums) {
  const tails = []; // tails[i] = 长度为 i+1 的递增子序列的最小末尾

  for (const num of nums) {
    // ✅ 二分查找 num 应该插入的位置
    let left = 0, right = tails.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (tails[mid] < num) left = mid + 1;
      else right = mid;
    }
    tails[left] = num; // 替换或追加
  }

  return tails.length; // tails 的长度就是 LIS 长度
};

// 测试
console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // 4 ([2,3,7,101] 或 [2,3,7,18])
console.log(lengthOfLIS([0, 1, 0, 3, 2, 3]));            // 4
```

| 方法 | 时间 | 空间 | 面试推荐 |
|------|------|------|---------|
| DP | O(n²) | O(n) | ⭐ 基础 |
| 贪心+二分 | O(n log n) | O(n) | ⭐⭐⭐ 推荐 |

⚠️ **易错**：`tails` 数组存的不是真正的 LIS，只是长度是对的。

---

## 📋 解法对比表

| 题目 | 方法1 | 方法2 | 最优解 |
|------|-------|-------|--------|
| #322 零钱兑换 | 递归+备忘录 O(S·n) | DP O(S·n) | ✅ DP |
| #139 单词拆分 | 递归+记忆化 | DP O(n²·m) | ✅ DP |
| #300 LIS | DP O(n²) | 贪心+二分 O(n log n) | ✅ 贪心+二分 |

---

## 📋 总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Vite 原理 | ESBuild 预构建 + ESM 按需加载 + Rollup 生产构建 | ⭐⭐⭐⭐ |
| Vite HMR | WebSocket + 动态 import + 模块边界 | ⭐⭐⭐ |
| Vite 插件 | 基于 Rollup 接口 + Vite 专属钩子 | ⭐⭐⭐ |
| Webpack Loader vs Plugin | Loader 转文件，Plugin 扩展功能 | ⭐⭐⭐⭐⭐ |
| Module Federation | 运行时模块共享，微前端 | ⭐⭐⭐ |
| 持久化缓存 | filesystem 类型，加速二次构建 | ⭐⭐⭐ |
| splitChunks | cacheGroups 拆包策略 | ⭐⭐⭐⭐ |
| Monorepo | pnpm workspace + Turborepo 组合 | ⭐⭐⭐ |

---

## 🔮 明日预告

**Day 23 — 网络协议与安全**
- HTTP/1.1 → HTTP/2 → HTTP/3 演进
- XSS / CSRF 攻击与防御
- CSP、CORS 安全配置
