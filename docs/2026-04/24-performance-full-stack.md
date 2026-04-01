# 04/24 — ⚡ 性能优化全链路

> 🕐 预计 4-5h | 知识点 2.5h + 手写题 1h + 算法 1.5h

---

## 📌 知识点1：Web Vitals 核心指标

### 🔑 核心指标体系

```
┌─────────────────────────────────────────────────────────┐
│                   Google Web Vitals                     │
├──────────┬──────────┬──────────┬────────────────────────┤
│   LCP    │   FID    │   CLS    │  其他指标               │
│ 最大内容  │ 首次输入  │ 累积布局  │                        │
│ 绘制     │ 延迟      │ 偏移     │ FCP, TTFB, TBT, INP   │
├──────────┼──────────┼──────────┼────────────────────────┤
│ ≤2.5s ✅ │ ≤100ms ✅│ ≤0.1 ✅ │                        │
│ ≤4s 🟡   │ ≤300ms 🟡│ ≤0.25 🟡│                        │
│ >4s ❌   │ >300ms ❌│ >0.25 ❌│                        │
└──────────┴──────────┴──────────┴────────────────────────┘
```

### ⭐ LCP（Largest Contentful Paint）— 最大内容绘制

**含义**：视口中最大内容元素完成渲染的时间。

```js
// ✅ 监测 LCP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1]; // LCP 可能多次触发，取最后一次
  console.log('LCP:', lastEntry.startTime, lastEntry.element);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

**LCP 常见元素**：`<img>`、`<video>` 海报图、带背景图的元素、文本块

**优化手段**：
| 问题 | 优化 |
|------|------|
| 图片加载慢 | 预加载 (`<link rel="preload">`)、WebP/AVIF、CDN |
| 服务端响应慢 | SSR/SSG、边缘渲染、CDN 缓存 |
| JS 阻塞渲染 | 代码分割、defer/async、关键 CSS 内联 |
| 字体加载慢 | `font-display: swap`、预加载字体文件 |

### ⭐ FID / INP — 交互响应延迟

```
FID（First Input Delay）：首次交互的延迟
- 只测量第一次交互
- 2024 起被 INP 取代

INP（Interaction to Next Paint）：所有交互的响应延迟
- 测量页面生命周期中最差的交互延迟（P98）
- 包括：输入延迟 + 处理时间 + 渲染延迟
```

```js
// ✅ 监测 INP
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    // processingEnd - startTime = 输入延迟 + 处理时间
    // duration = 完整的交互到绘制时间
    console.log('INP:', entry.duration, entry.name);
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
```

**INP 优化**：
- 拆分长任务（`scheduler.yield()` / `requestIdleCallback`）
- 减少主线程 JS 执行时间
- 使用 `startTransition` 降低更新优先级

### ⭐ CLS（Cumulative Layout Shift）— 累积布局偏移

**含义**：页面可见内容发生意外移动的程度。

```
CLS 计算公式：
  布局偏移分数 = 影响分数 × 距离分数
  影响分数 = 受影响区域 / 视口面积
  距离分数 = 元素移动的最大距离 / 视口高度
```

```js
// ✅ 监测 CLS
let clsValue = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (!entry.hadRecentInput) { // 排除用户主动触发的布局变化
      clsValue += entry.value;
    }
  }
  console.log('CLS:', clsValue);
}).observe({ type: 'layout-shift', buffered: true });
```

**CLS 常见原因和优化**：

| 原因 | 优化 |
|------|------|
| 图片/视频无尺寸 | 始终设置 `width`/`height` 或 `aspect-ratio` |
| 动态注入内容 | 预留空间（skeleton/placeholder） |
| Web 字体导致 FOUT | `font-display: optional` 或预加载 |
| 动画导致重排 | 用 `transform` 代替 `top/left` |
| 广告 iframe | 预留固定尺寸容器 |

### 🔑 使用 web-vitals 库监测

```js
import { onLCP, onFID, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,     // LCP / FID / CLS ...
    value: metric.value,   // 指标值
    rating: metric.rating, // good / needs-improvement / poor
    id: metric.id,
    delta: metric.delta,
  });

  // ✅ 使用 sendBeacon 保证页面卸载时也能发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  }
}

onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
```

---

## 📌 知识点2：加载优化

### 🔑 代码分割（Code Splitting）

```js
// ✅ 1. 路由级别分割（最常见）
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// ✅ 2. 条件分割（按需加载）
async function loadChart() {
  const { Chart } = await import('./Chart');
  return new Chart(container, data);
}

// ✅ 3. Webpack 魔法注释（命名 chunk）
const Editor = lazy(() => import(
  /* webpackChunkName: "editor" */
  /* webpackPrefetch: true */  // 空闲时预加载
  './Editor'
));
```

### 🔑 Tree Shaking

```
原理：基于 ES Module 静态分析，移除未使用的导出

前提条件：
✅ 必须使用 ESM（import/export）
✅ 不能有副作用（sideEffects: false）
✅ 生产模式自动启用

❌ 以下情况 Tree Shaking 失效：
- CommonJS（require/module.exports）
- 有副作用的导入：import './polyfill'
- 动态访问：obj[variable]
```

```json
// package.json — 声明无副作用
{
  "sideEffects": false  // 全部无副作用
  // 或指定有副作用的文件
  "sideEffects": ["*.css", "*.global.js"]
}
```

### 🔑 图片优化

```
图片格式选型：
┌────────┬────────────────────┬──────────────────────┐
│ 格式   │ 特点               │ 适用场景              │
├────────┼────────────────────┼──────────────────────┤
│ JPEG   │ 有损压缩，体积小    │ 照片、复杂图像        │
│ PNG    │ 无损压缩，支持透明  │ Logo、需要透明背景    │
│ WebP   │ 有损+无损，体积小30%│ ✅ 现代浏览器首选     │
│ AVIF   │ 最新格式，压缩最优  │ 追求极致压缩          │
│ SVG    │ 矢量图，无限缩放    │ 图标、简单图形        │
└────────┴────────────────────┴──────────────────────┘
```

```html
<!-- ✅ 响应式图片 -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="..." width="800" height="600" loading="lazy">
</picture>

<!-- ✅ 懒加载 -->
<img src="placeholder.jpg" data-src="real-image.jpg" loading="lazy">

<!-- ✅ 预加载关键图片 -->
<link rel="preload" as="image" href="hero.webp">
```

### 🔑 预加载策略

```html
<!-- 🔑 preload：立即加载，高优先级 -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="font.woff2" as="font" crossorigin>
<link rel="preload" href="hero.webp" as="image">

<!-- 🔑 prefetch：空闲时加载，低优先级（下一页可能用到） -->
<link rel="prefetch" href="next-page.js">

<!-- 🔑 preconnect：提前建立连接（DNS + TCP + TLS） -->
<link rel="preconnect" href="https://cdn.example.com">
<link rel="dns-prefetch" href="https://api.example.com"> <!-- 兼容旧浏览器 -->
```

### 🔑 CDN 优化

```
CDN 核心价值：
✅ 就近访问 — 用户连接最近的节点
✅ 减少延迟 — 边缘缓存，不回源
✅ 负载均衡 — 分散源站压力
✅ DDoS 防护 — 分布式架构天然抗攻击

CDN 缓存策略：
├── 静态资源（JS/CSS/图片）：Cache-Control: max-age=31536000 + 文件名 hash
├── HTML 文件：Cache-Control: no-cache（每次都验证）
└── API 接口：Cache-Control: no-store（不缓存）
```

---

## 📌 知识点3：运行时优化

### 🔑 长任务拆分

```js
// ❌ 主线程阻塞
function processLargeArray(arr) {
  for (const item of arr) {
    heavyComputation(item); // 阻塞主线程！
  }
}

// ✅ 方案1：使用 scheduler.yield()（Chrome 129+）
async function processLargeArray(arr) {
  for (const item of arr) {
    heavyComputation(item);
    await scheduler.yield(); // 🔑 让出主线程
  }
}

// ✅ 方案2：requestIdleCallback
function processWithIdle(arr, index = 0) {
  requestIdleCallback((deadline) => {
    while (index < arr.length && deadline.timeRemaining() > 0) {
      heavyComputation(arr[index++]);
    }
    if (index < arr.length) processWithIdle(arr, index);
  });
}

// ✅ 方案3：setTimeout 分片
function processInChunks(arr, chunkSize = 100) {
  let index = 0;
  function chunk() {
    const end = Math.min(index + chunkSize, arr.length);
    for (; index < end; index++) {
      heavyComputation(arr[index]);
    }
    if (index < arr.length) {
      setTimeout(chunk, 0); // 🔑 每批让出主线程
    }
  }
  chunk();
}
```

### 🔑 Web Worker

```js
// main.js — 主线程
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
});

// 发送数据
worker.postMessage({ type: 'compute', data: largeArray });

// 接收结果
worker.onmessage = (e) => {
  console.log('Worker 结果:', e.data);
};

// 错误处理
worker.onerror = (err) => {
  console.error('Worker 错误:', err);
};
```

```js
// worker.js — Worker 线程
self.onmessage = (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'compute':
      const result = heavyComputation(data);
      self.postMessage(result); // 发回结果
      break;
  }
};

function heavyComputation(data) {
  // CPU 密集型计算，不会阻塞主线程
  return data.reduce((sum, n) => sum + n * n, 0);
}
```

### 🔑 虚拟列表

```
原理：只渲染可视区域内的元素

┌──────────────────────┐
│  可视区域（viewport）  │
│  ┌──────────────────┐ │
│  │ Item 50          │ │  ← 只渲染这些
│  │ Item 51          │ │
│  │ Item 52          │ │
│  │ Item 53          │ │
│  └──────────────────┘ │
│  ↑ offset = 50 × 40px │
│                       │
│  Buffer: 上下各多渲染 5 个│
└──────────────────────┘

React 库推荐：react-window、react-virtuoso、@tanstack/virtual
```

```js
// ✅ 使用 react-window
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={400}          // 可视区域高度
      itemCount={items.length}
      itemSize={50}         // 每项高度
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 🔑 Sentry 监控接入

```js
// ✅ Sentry 初始化
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/yyy',
  integrations: [
    Sentry.browserTracingIntegration(), // 性能追踪
    Sentry.replayIntegration(),         // Session Replay
  ],
  tracesSampleRate: 0.1,    // 10% 的请求采样性能数据
  replaysSessionSampleRate: 0.01, // 1% 的 Session Replay
  replaysOnErrorSampleRate: 1.0,  // 出错时 100% 录制
  environment: process.env.NODE_ENV,
});

// ✅ 手动捕获错误
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'checkout' },
    extra: { cartItems: items },
  });
}

// ✅ 添加面包屑（调试上下文）
Sentry.addBreadcrumb({
  category: 'navigation',
  message: '用户跳转到支付页面',
  level: 'info',
});
```

---

## 💻 手写题

### 手写题1：手写性能监控 SDK

```js
/**
 * 📝 轻量级前端性能监控 SDK
 * 
 * 功能：
 * 1. 收集 Web Vitals 指标
 * 2. 捕获 JS 错误
 * 3. 监控资源加载
 * 4. 上报到服务端
 */

class PerfMonitor {
  constructor(options = {}) {
    this.endpoint = options.endpoint || '/api/perf';
    this.appId = options.appId || 'default';
    this.sampleRate = options.sampleRate || 1; // 采样率
    this.metrics = [];
    this.sessionId = this.generateSessionId();

    if (Math.random() > this.sampleRate) return; // 采样

    this.initWebVitals();
    this.initErrorTracking();
    this.initResourceTiming();
    this.initPageLifecycle();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ✅ Web Vitals 收集
  initWebVitals() {
    // LCP
    this.observe('largest-contentful-paint', (entries) => {
      const last = entries[entries.length - 1];
      this.record('LCP', last.startTime, { element: last.element?.tagName });
    });

    // CLS
    let clsValue = 0;
    this.observe('layout-shift', (entries) => {
      entries.forEach(e => {
        if (!e.hadRecentInput) clsValue += e.value;
      });
      this.record('CLS', clsValue);
    });

    // FCP
    this.observe('paint', (entries) => {
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      if (fcp) this.record('FCP', fcp.startTime);
    });
  }

  // ✅ 错误监控
  initErrorTracking() {
    // JS 错误
    window.addEventListener('error', (e) => {
      this.record('ERROR', 1, {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
      });
    });

    // Promise 未捕获错误
    window.addEventListener('unhandledrejection', (e) => {
      this.record('UNHANDLED_REJECTION', 1, {
        reason: String(e.reason),
      });
    });
  }

  // ✅ 资源加载监控
  initResourceTiming() {
    this.observe('resource', (entries) => {
      entries.forEach(entry => {
        if (entry.duration > 1000) { // 只记录慢资源
          this.record('SLOW_RESOURCE', entry.duration, {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize,
          });
        }
      });
    });
  }

  // ✅ 页面生命周期
  initPageLifecycle() {
    // 页面加载完成
    window.addEventListener('load', () => {
      const timing = performance.getEntriesByType('navigation')[0];
      this.record('PAGE_LOAD', timing.loadEventEnd - timing.startTime);
      this.record('TTFB', timing.responseStart - timing.requestStart);
      this.record('DOM_READY', timing.domContentLoadedEventEnd - timing.startTime);
    });

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(); // 页面隐藏时立即上报
      }
    });
  }

  // 🔧 通用方法
  observe(type, callback) {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
    new PerformanceObserver((list) => {
      callback(list.getEntries());
    }).observe({ type, buffered: true });
  }

  record(name, value, extra = {}) {
    const metric = {
      name,
      value: Math.round(value),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      appId: this.appId,
      url: location.href,
      ua: navigator.userAgent,
      ...extra,
    };
    this.metrics.push(metric);

    // 缓冲区满则上报
    if (this.metrics.length >= 10) this.flush();
  }

  // ✅ 上报（使用 sendBeacon 保证可靠性）
  flush() {
    if (!this.metrics.length) return;

    const data = JSON.stringify(this.metrics);
    this.metrics = [];

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, data);
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body: data,
        keepalive: true,
      }).catch(() => {}); // 静默失败
    }
  }
}

// 使用
const monitor = new PerfMonitor({
  endpoint: 'https://analytics.example.com/perf',
  appId: 'my-app',
  sampleRate: 0.5, // 50% 采样
});
```

### 手写题2：手写 Web Worker 通信封装

```js
/**
 * 📝 封装 Web Worker，支持 async/await 风格调用
 */

class WorkerPool {
  constructor(workerUrl, poolSize = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.taskQueue = [];
    this.workerStatus = []; // true = busy

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });
      worker.onmessage = (e) => this.handleMessage(i, e.data);
      worker.onerror = (e) => this.handleError(i, e);
      this.workers.push(worker);
      this.workerStatus.push(false);
    }
  }

  // ✅ 任务分配
  execute(taskName, payload) {
    return new Promise((resolve, reject) => {
      const task = { taskName, payload, resolve, reject, id: Date.now() + Math.random() };
      const freeWorker = this.workerStatus.findIndex(busy => !busy);

      if (freeWorker !== -1) {
        this.dispatch(freeWorker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  dispatch(workerIndex, task) {
    this.workerStatus[workerIndex] = true;
    this.workers[workerIndex].postMessage(task);
  }

  // ✅ 结果处理
  handleMessage(workerIndex, result) {
    const { id, data, error } = result;
    this.workerStatus[workerIndex] = false;

    // 查找并执行回调（简化版：直接匹配最新任务）
    if (error) {
      // 处理错误
    }

    // 处理队列中的下一个任务
    if (this.taskQueue.length > 0) {
      this.dispatch(workerIndex, this.taskQueue.shift());
    }
  }

  handleError(workerIndex, error) {
    console.error(`Worker ${workerIndex} error:`, error);
    this.workerStatus[workerIndex] = false;
  }

  // ✅ 销毁所有 Worker
  terminate() {
    this.workers.forEach(w => w.terminate());
  }
}

// 使用示例
// const pool = new WorkerPool('./worker.js', 4);
// pool.execute('sort', largeArray).then(sorted => console.log(sorted));
```

---

## 💻 算法题

### 算法1：#62 不同路径 ⭐

```js
/**
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
var uniquePaths = function(m, n) {
  // dp[i][j] = 从 (0,0) 到 (i,j) 的路径数
  const dp = Array.from({ length: m }, () => new Array(n).fill(1));

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1]; // 从上方 + 从左方
    }
  }

  return dp[m - 1][n - 1];
};

console.log(uniquePaths(3, 7)); // 28
console.log(uniquePaths(3, 2)); // 3
```

**空间优化**：滚动数组 O(n)
```js
var uniquePaths = function(m, n) {
  let dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
};
```

---

### 算法2：#64 最小路径和 ⭐

```js
/**
 * @param {number[][]} grid
 * @return {number}
 */
var minPathSum = function(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = Array.from({ length: m }, () => new Array(n).fill(0));

  dp[0][0] = grid[0][0];

  // 第一行只能从左边来
  for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];
  // 第一列只能从上面来
  for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + grid[i][j];
    }
  }

  return dp[m - 1][n - 1];
};

console.log(minPathSum([[1,3,1],[1,5,1],[4,2,1]])); // 7
```

---

### 算法3：#1143 最长公共子序列 ⭐⭐

```js
/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
var longestCommonSubsequence = function(text1, text2) {
  const m = text1.length, n = text2.length;

  // dp[i][j] = text1[0..i-1] 和 text2[0..j-1] 的 LCS 长度
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1; // 字符相同，LCS +1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // 取较大的
      }
    }
  }

  return dp[m][n];
};

console.log(longestCommonSubsequence('abcde', 'ace'));   // 3 ("ace")
console.log(longestCommonSubsequence('abc', 'abc'));     // 3
console.log(longestCommonSubsequence('abc', 'def'));     // 0
```

---

## 📋 解法对比表

| 题目 | 方法 | 时间 | 空间 | 优化 |
|------|------|------|------|------|
| #62 不同路径 | DP | O(mn) | O(mn) → O(n) 滚动数组 |
| #64 最小路径和 | DP | O(mn) | O(mn) → O(n) 原地修改 |
| #1143 LCS | DP | O(mn) | O(mn) → O(min(m,n)) 滚动数组 |

---

## 📋 总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| LCP | 最大内容渲染 ≤2.5s、预加载关键资源 | ⭐⭐⭐⭐⭐ |
| FID/INP | 交互响应延迟 ≤100ms、拆分长任务 | ⭐⭐⭐⭐ |
| CLS | 布局偏移 ≤0.1、图片设置尺寸 | ⭐⭐⭐⭐ |
| 代码分割 | 路由懒加载 + dynamic import | ⭐⭐⭐⭐⭐ |
| Tree Shaking | ESM + sideEffects 声明 | ⭐⭐⭐⭐ |
| 图片优化 | WebP/AVIF + 懒加载 + 响应式 | ⭐⭐⭐⭐ |
| 预加载策略 | preload/prefetch/preconnect | ⭐⭐⭐ |
| 长任务拆分 | scheduler.yield + requestIdleCallback | ⭐⭐⭐⭐ |
| Web Worker | 避免主线程阻塞、Worker Pool | ⭐⭐⭐⭐ |
| 虚拟列表 | 只渲染可视区域、react-window | ⭐⭐⭐⭐ |
| Sentry | 错误追踪 + 性能监控 + Session Replay | ⭐⭐⭐ |

---

## 🔮 明日预告

**Day 25 — 前端测试 + AI Agent 进阶**
- 测试金字塔（单元 → 集成 → E2E）
- MCP 协议原理与实战
- AI 代码审查找 Bug
