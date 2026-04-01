# 04/23 — 🌐 网络协议与安全

> 🕐 预计 4-5h | 知识点 2.5h + 手写题 1h + 算法 1.5h

---

## 📌 知识点1：HTTP 协议演进

### 🔑 HTTP/1.1 — 持久连接时代

```
核心特性：
✅ 持久连接（Keep-Alive）：默认复用 TCP 连接
✅ 管道化（Pipelining）：可发送多个请求（但响应必须按序返回）
✅ 分块传输（Chunked Transfer Encoding）
✅ Host 头部：支持虚拟主机

核心问题：
❌ 队头阻塞（Head-of-Line Blocking）：一个请求慢，后面全部等
❌ 并发连接数限制：浏览器对同一域名最多 6 个连接
❌ Header 未压缩：每次请求都携带冗余 Header
❌ 无优先级机制：所有请求平等
```

```
HTTP/1.1 并发方式：
┌────────────────────────┐
│ 浏览器                   │
│  连接1 ──→ 请求A → 响应A │
│  连接2 ──→ 请求B → 响应B │  最多 6 个连接
│  连接3 ──→ 请求C → 响应C │
│  ...                     │
└────────────────────────┘

优化手段：
- 域名分片（多个子域名突破 6 连接限制）
- 雪碧图（减少请求数）
- 文件合并（Webpack bundle）
```

### 🔑 HTTP/2 — 二进制分帧

```
核心改进：
✅ 二进制分帧：将消息分解为更小的帧
✅ 多路复用（Multiplexing）：一个 TCP 连接上并行多个请求/响应
✅ 头部压缩（HPACK）：静态表 + 动态表 + Huffman 编码
✅ 服务器推送（Server Push）
✅ 请求优先级

HTTP/2 帧结构：
+-----------------------------------------------+
|                Length (24)                     |
+---------------+-------------------------------+
| Type (8) | Flags (8) |
+-------------------------------+
| R (1) |   Stream Identifier (31)              |
+-------------------------------+
|              Frame Payload                     |
+-----------------------------------------------+
```

```
HTTP/2 多路复用：
┌──────────────────────────────────┐
│ 单个 TCP 连接                     │
│  Stream 1 ──→ 帧1 ──→ 帧3 ──→ 帧5 │
│  Stream 2 ──→ 帧2 ──→ 帧4        │  ✅ 并行！
│  Stream 3 ──→ 帧6 ──→ 帧7        │
└──────────────────────────────────┘
```

⚠️ **HTTP/2 的问题**：TCP 层队头阻塞
- 虽然 HTTP 层没有队头阻塞了
- 但 TCP 是**字节流协议**，丢包时整个连接的所有 Stream 都要等重传
- 一个丢包 → 所有 Stream 阻塞

### 🔑 HTTP/3 — QUIC 协议

```
核心变革：
✅ 基于 QUIC（UDP）替代 TCP
✅ 0-RTT 连接建立（首次 1-RTT，后续 0-RTT）
✅ 真正的多路复用：Stream 之间完全独立
✅ 连接迁移：用 Connection ID 替代 IP:Port 四元组
✅ 内置 TLS 1.3

HTTP/2 vs HTTP/3：
┌─────────────────────┐  ┌─────────────────────┐
│      HTTP/2          │  │      HTTP/3          │
│  ┌───────────────┐   │  │  ┌───────────────┐   │
│  │  HTTP/2 帧层   │   │  │  │  HTTP/3 帧层   │   │
│  ├───────────────┤   │  │  ├───────────────┤   │
│  │    TLS 1.2+   │   │  │  │    QUIC       │   │
│  ├───────────────┤   │  │  │  (内置TLS 1.3) │   │
│  │      TCP      │   │  │  ├───────────────┤   │
│  └───────────────┘   │  │  │      UDP      │   │
│                      │  │  └───────────────┘   │
└─────────────────────┘  └─────────────────────┘
```

### 🔑 TLS 1.3 握手流程

```
TLS 1.2（2-RTT）：         TLS 1.3（1-RTT）：
Client → Server:            Client → Server:
  ClientHello                  ClientHello
  (支持的密码套件)               (密钥共享 + 支持的密码套件)
Server → Client:            Server → Client:
  ServerHello                  ServerHello
  Certificate                  (密钥共享 + Certificate)
  ServerHelloDone
Client → Server:
  ClientKeyExchange
  ChangeCipherSpec             ✅ 握手完成！只需 1 个 RTT
  Finished
Server → Client:
  ChangeCipherSpec
  Finished

✅ TLS 1.3 改进：
- 1-RTT（减少一个往返）
- 0-RTT 恢复（之前连接过，直接发数据）
- 移除不安全算法（RC4、DES、MD5、SHA-1）
- 前向安全（默认使用 ECDHE）
```

### ⚠️ 面试高频对比

| 特性 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------|----------|--------|--------|
| 传输层 | TCP | TCP | QUIC (UDP) |
| 多路复用 | ❌ | ✅（TCP层仍有阻塞） | ✅（完全独立） |
| 头部压缩 | ❌ | HPACK | QPACK |
| 队头阻塞 | HTTP层有 | TCP层有 | ❌ 无 |
| 连接建立 | 1-RTT (TCP) + 2-RTT (TLS) | 同左 | 1-RTT (QUIC+TLS) |
| 连接迁移 | ❌ | ❌ | ✅ (Connection ID) |

---

## 📌 知识点2：Web 安全

### ⭐ XSS（跨站脚本攻击）

```
攻击原理：注入恶意脚本到网页中，在用户浏览器执行

三种类型：
┌─────────────────────────────────────────────────────────┐
│ 1. 存储型（Stored XSS）— ⭐最危险                        │
│    恶意脚本 → 存入数据库 → 所有访问者中招                    │
│    场景：评论区、用户资料、帖子内容                          │
│                                                           │
│ 2. 反射型（Reflected XSS）                                │
│    恶意脚本 → 拼入 URL 参数 → 诱导用户点击 → 执行            │
│    场景：搜索框、URL 参数直接渲染到页面                      │
│                                                           │
│ 3. DOM 型（DOM-based XSS）                                │
│    前端 JS 直接操作 DOM 导致的 XSS                          │
│    场景：innerHTML、outerHTML、document.write              │
└─────────────────────────────────────────────────────────┘
```

**XSS 防御**：

```js
// ✅ 1. 输出编码（HTML 转义）
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, c => map[c]);
}

// ✅ 2. CSP（Content Security Policy）— 禁止内联脚本执行
// ✅ 3. HttpOnly Cookie — JS 无法读取 document.cookie
// ✅ 4. React 默认转义 — JSX 中 {userInput} 自动转义
// ❌ 危险：dangerouslySetInnerHTML
```

### ⭐ CSRF（跨站请求伪造）

```
攻击原理：用户已登录 A 网站 → 访问恶意网站 B → B 伪造请求到 A

攻击流程：
1. 用户登录 bank.com（Cookie 已保存）
2. 用户访问 evil.com
3. evil.com 包含：<img src="bank.com/transfer?to=hacker&amount=10000">
4. 浏览器自动携带 bank.com 的 Cookie 发请求
5. 银行执行转账 💸

防御手段：
✅ CSRF Token（服务端生成随机 Token，表单/AJAX 携带）
✅ SameSite Cookie（Strict / Lax）
✅ 验证 Origin / Referer 头
✅ 敏感操作要求二次确认（验证码、密码）
```

```js
// ✅ CSRF Token 生成（Node.js 示例）
import crypto from 'crypto';

function generateCsrfToken(sessionId) {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto
    .createHmac('sha256', process.env.CSRF_SECRET)
    .update(salt + sessionId)
    .digest('hex');
  return `${salt}.${hash}`;
}

function verifyCsrfToken(token, sessionId) {
  const [salt, hash] = token.split('.');
  const expected = crypto
    .createHmac('sha256', process.env.CSRF_SECRET)
    .update(salt + sessionId)
    .digest('hex');
  return hash === expected;
}
```

### 🔑 点击劫持（Clickjacking）

```
攻击原理：恶意网站用透明 iframe 覆盖在诱骗按钮上

防御：
✅ X-Frame-Options: DENY / SAMEORIGIN
✅ CSP: frame-ancestors 'self'
```

---

## 📌 知识点3：CSP + CORS + 安全 Headers

### 🔑 Content Security Policy (CSP)

```http
# ✅ 最佳实践 CSP 配置
Content-Security-Policy:
  default-src 'self';                              # 默认只允许同源
  script-src 'self' https://cdn.example.com;       # JS 白名单
  style-src 'self' 'unsafe-inline';                # CSS（允许内联样式）
  img-src 'self' data: https:;                     # 图片
  connect-src 'self' https://api.example.com;      # AJAX/fetch
  font-src 'self' https://fonts.gstatic.com;
  frame-ancestors 'none';                          # 禁止被 iframe 嵌入
  base-uri 'self';
  form-action 'self';
```

```html
<!-- 在 HTML 中设置 CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">
```

⚠️ **CSP 易错**：
- ❌ `'unsafe-inline'` 在 `script-src` 中等同于没有 CSP
- ❌ `'unsafe-eval'` 允许 `eval()`，有 XSS 风险
- ✅ 使用 nonce 或 hash 替代 `'unsafe-inline'`

### 🔑 CORS（跨源资源共享）

```
简单请求（满足以下全部条件）：
- 方法：GET / HEAD / POST
- Content-Type：text/plain / multipart/form-data / application/x-www-form-urlencoded
- 无自定义 Header

复杂请求 → 预检请求（Preflight）：
浏览器先发 OPTIONS 请求，确认服务端允许后再发实际请求

预检请求流程：
浏览器                服务端
  │                     │
  │─── OPTIONS ───────→│  预检请求
  │   Origin: a.com     │
  │   Access-Control-   │
  │   Request-Method:   │
  │   PUT               │
  │                     │
  │←── 204 No Content ──│  响应头包含允许的方法
  │   Access-Control-   │
  │   Allow-Origin: a.com│
  │   Allow-Methods:    │
  │   GET,PUT,POST      │
  │                     │
  │─── PUT ────────────→│  实际请求
  │←── 200 ────────────│
```

```js
// ✅ Express CORS 中间件配置
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://myapp.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 预检缓存 24h

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // 预检请求直接返回
  }
  next();
});
```

### 🔑 安全 Headers 最佳实践

```http
# ✅ 生产环境必备安全 Headers
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  # 已废弃，现代浏览器用 CSP 替代
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

| Header | 作用 | 推荐值 |
|--------|------|--------|
| HSTS | 强制 HTTPS | `max-age=31536000` |
| CSP | 限制资源加载来源 | 按需配置 |
| X-Content-Type-Options | 禁止 MIME 嗅探 | `nosniff` |
| X-Frame-Options | 防点击劫持 | `DENY` |
| Referrer-Policy | 控制 Referer 泄露 | `strict-origin-when-cross-origin` |

---

## 💻 手写题

### 手写题1：手写防 XSS 函数

```js
/**
 * 📝 完整的 XSS 防护函数
 * 
 * 策略：
 * 1. HTML 实体编码 — 防止 HTML 注入
 * 2. URL 协议过滤 — 防止 javascript: 协议
 * 3. CSS 注入防护 — 防止 expression/url 注入
 */

// ✅ 基础 HTML 转义
function escapeHtml(str) {
  if (typeof str !== 'string') return '';

  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;',
    '/': '&#x2F;',  // 防止 </script> 注入
  };

  return str.replace(/[&<>"'`/]/g, char => entityMap[char]);
}

console.log(escapeHtml('<script>alert("xss")</script>'));
// 输出: &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;

// ✅ URL 协议白名单过滤
function sanitizeUrl(url) {
  const allowed = ['http:', 'https:', 'mailto:', 'tel:'];
  try {
    const parsed = new URL(url, 'https://placeholder.com');
    if (!allowed.includes(parsed.protocol)) {
      return '#'; // 阻止 javascript:, data:, vbscript:
    }
    return url;
  } catch {
    return '#'; // 无效 URL
  }
}

console.log(sanitizeUrl('javascript:alert(1)'));     // 输出: #
console.log(sanitizeUrl('https://example.com'));      // 输出: https://example.com
console.log(sanitizeUrl('data:text/html,<h1>hi</h1>')); // 输出: #

// ✅ 深度净化对象（处理 JSON 数据）
function deepSanitize(obj) {
  if (typeof obj === 'string') return escapeHtml(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[escapeHtml(key)] = deepSanitize(obj[key]);
    }
    return result;
  }
  return obj;
}

console.log(deepSanitize({ name: '<script>alert(1)</script>', age: 21 }));
// 输出: { name: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;', age: 21 }
```

### 手写题2：手写 CSRF Token 生成与验证

```js
/**
 * 📝 CSRF Token 工具
 * 
 * 生成：随机 salt + HMAC(sessionId + salt)
 * 验证：重新计算 HMAC，对比结果
 */

import { createHmac, randomBytes } from 'crypto';

class CsrfProtection {
  constructor(secret) {
    this.secret = secret;
  }

  // ✅ 生成 Token
  generateToken(sessionId) {
    const salt = randomBytes(16).toString('hex');
    const token = createHmac('sha256', this.secret)
      .update(`${salt}:${sessionId}`)
      .digest('hex');
    return `${salt}.${token}`;
  }

  // ✅ 验证 Token（常数时间比较，防时序攻击）
  verifyToken(token, sessionId) {
    if (!token || typeof token !== 'string') return false;

    const [salt, hash] = token.split('.');
    if (!salt || !hash) return false;

    const expected = createHmac('sha256', this.secret)
      .update(`${salt}:${sessionId}`)
      .digest('hex');

    // ⚠️ 关键：用常数时间比较，防时序攻击
    if (hash.length !== expected.length) return false;

    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return result === 0;
  }

  // ✅ Express 中间件
  middleware() {
    return (req, res, next) => {
      // 生成 Token 给前端
      res.locals.csrfToken = this.generateToken(req.session.id);

      // 验证 POST/PUT/DELETE 请求的 Token
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const clientToken =
          req.body._csrf ||
          req.headers['x-csrf-token'] ||
          req.headers['x-xsrf-token'];

        if (!this.verifyToken(clientToken, req.session.id)) {
          return res.status(403).json({ error: 'Invalid CSRF token' });
        }
      }
      next();
    };
  }
}

// 测试
const csrf = new CsrfProtection('my-secret-key');
const token = csrf.generateToken('user-session-123');
console.log('Token:', token);
console.log('Valid:', csrf.verifyToken(token, 'user-session-123')); // true
console.log('Invalid:', csrf.verifyToken(token, 'other-session'));  // false
```

---

## 💻 算法题

### 算法1：#152 乘积最大子数组 ⭐

**题目**：找出数组中乘积最大的连续子数组的乘积。

**关键**：同时维护 `max` 和 `min`（负数×负数=正数）。

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxProduct = function(nums) {
  let max = nums[0]; // 以当前元素结尾的最大乘积
  let min = nums[0]; // 以当前元素结尾的最小乘积（负数情况）
  let result = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const num = nums[i];

    // ⚠️ 关键：max 和 min 要同时更新，不能先更新 max 再用新的 max 算 min
    if (num < 0) {
      [max, min] = [min, max]; // 负数翻转大小关系
    }

    max = Math.max(num, max * num); // 要么重新开始，要么扩展
    min = Math.min(num, min * num);

    result = Math.max(result, max);
  }

  return result;
};

// 测试
console.log(maxProduct([2, 3, -2, 4]));   // 6 (子数组 [2,3])
console.log(maxProduct([-2, 0, -1]));      // 0
console.log(maxProduct([-2, 3, -4]));      // 24 (全部相乘)
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(n) |
| 空间 | O(1) |

⚠️ **易错**：忘记在遇到负数时交换 max 和 min。

---

### 算法2：#32 最长有效括号 ⭐⭐

**题目**：只包含 `(` 和 `)` 的字符串，找出最长有效括号子串的长度。

**思路**：用栈存储索引，栈底始终是「最后一个未匹配的右括号位置」。

```js
/**
 * @param {string} s
 * @return {number}
 */
var longestValidParentheses = function(s) {
  const stack = [-1]; // 🔑 初始放入 -1 作为基准
  let maxLen = 0;

  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i); // 左括号：压入索引
    } else {
      stack.pop(); // 右括号：弹出匹配

      if (stack.length === 0) {
        stack.push(i); // 无匹配：更新基准位置
      } else {
        // ✅ 当前有效长度 = 当前索引 - 栈顶索引
        maxLen = Math.max(maxLen, i - stack[stack.length - 1]);
      }
    }
  }

  return maxLen;
};

// 测试
console.log(longestValidParentheses('(()'));      // 2
console.log(longestValidParentheses(')()())'));    // 4
console.log(longestValidParentheses(''));          // 0
console.log(longestValidParentheses('()(()'));     // 2
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(n) |
| 空间 | O(n) |

**DP 解法**：`dp[i]` = 以 `s[i]` 结尾的最长有效括号长度。
- 如果 `s[i] === ')'` 且 `s[i-1] === '('`：`dp[i] = dp[i-2] + 2`
- 如果 `s[i] === ')'` 且 `s[i-1] === ')'`：检查 `s[i - dp[i-1] - 1]` 是否为 `(`

---

### 算法3：#72 编辑距离 ⭐⭐⭐

**题目**：给定两个字符串 `word1` 和 `word2`，计算将 `word1` 转换为 `word2` 所需的最少操作数（插入、删除、替换）。

```js
/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
var minDistance = function(word1, word2) {
  const m = word1.length;
  const n = word2.length;

  // dp[i][j] = word1[0..i-1] 转换为 word2[0..j-1] 的最少操作数
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // 🔑 初始化边界
  for (let i = 0; i <= m; i++) dp[i][0] = i; // 删除 i 个字符
  for (let j = 0; j <= n; j++) dp[0][j] = j; // 插入 j 个字符

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        // ✅ 字符相同，不需要操作
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // 删除 word1[i-1]
          dp[i][j - 1],     // 插入 word2[j-1]
          dp[i - 1][j - 1], // 替换 word1[i-1] 为 word2[j-1]
        );
      }
    }
  }

  return dp[m][n];
};

// 测试
console.log(minDistance('horse', 'ros'));        // 3
console.log(minDistance('intention', 'execution')); // 5
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(m × n) |
| 空间 | O(m × n)（可优化为 O(min(m,n)) 滚动数组） |

**状态转移图解**：
```
      ""  r  o  s
  ""   0  1  2  3
  h    1  1  2  3
  o    2  2  1  2
  r    3  2  2  2
  s    4  3  3  2
  e    5  4  4  3 ✅
```

---

## 📋 解法对比表

| 题目 | 方法1 | 方法2 | 最优解 |
|------|-------|-------|--------|
| #152 乘积最大子数组 | DP O(n) 空间 O(n) | 双指针 O(n) 空间 O(1) | ✅ 双指针 |
| #32 最长有效括号 | 栈 O(n) | DP O(n) | ✅ 栈更直观 |
| #72 编辑距离 | DP O(mn) | DP+滚动数组 O(min) | ✅ DP |

---

## 📋 总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| HTTP/1.1 → 2 | 多路复用、二进制分帧、HPACK | ⭐⭐⭐⭐ |
| HTTP/3 QUIC | 基于 UDP、0-RTT、连接迁移 | ⭐⭐⭐⭐ |
| TLS 1.3 | 1-RTT 握手、前向安全、移除弱算法 | ⭐⭐⭐ |
| XSS 防护 | 输出编码 + CSP + HttpOnly | ⭐⭐⭐⭐⭐ |
| CSRF 防护 | Token + SameSite + Origin 验证 | ⭐⭐⭐⭐⭐ |
| CSP 配置 | script-src 白名单 + nonce | ⭐⭐⭐⭐ |
| CORS 预检 | OPTIONS 请求 + Allow-Origin | ⭐⭐⭐⭐⭐ |
| 安全 Headers | HSTS + nosniff + X-Frame-Options | ⭐⭐⭐ |

---

## 🔮 明日预告

**Day 24 — 性能优化全链路**
- Web Vitals（LCP/FID/CLS）
- 加载优化 + 运行时优化
- 性能监控 SDK 实战
