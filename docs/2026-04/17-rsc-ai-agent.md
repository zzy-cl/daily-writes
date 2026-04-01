# 04/17 — React Server Components + AI Agent 入门（Day 17）

> **阶段**：第三阶段 React 18+
> **今日目标**：理解 RSC 原理与客户端组件边界，掌握 AI Agent 基础架构
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：React Server Components（RSC）⭐⭐⭐

### 1.1 什么是 RSC

RSC 是 React 18+ 引入的一种**全新组件类型**。服务端组件在服务器上渲染，将结果（序列化的 React 树）发送到客户端，**不发送组件代码到浏览器**。

```text
传统 SSR（Server-Side Rendering）：
  服务端：渲染 HTML 字符串
  客户端：下载完整 JS bundle → hydrate（补全交互）→ 交互

RSC（React Server Components）：
  服务端：渲染序列化的组件树（RSC Payload）
  客户端：只下载客户端组件的 JS → 无需 hydrate 服务端组件
```

🔑 **核心区别**：SSR 输出的是 HTML 字符串，RSC 输出的是序列化的 React 元素树（RSC Payload），客户端 React 能直接拼接到虚拟 DOM 中。

### 1.2 服务端组件 vs 客户端组件

```jsx
// ✅ Server Component（默认！不需要 'use client'）
// app/page.tsx（Next.js App Router）
import { db } from '@/lib/database'; // 可以直接用数据库！

export default async function HomePage() {
  // 直接查询数据库，无 API 调用
  const posts = await db.post.findMany({ take: 10 });

  return (
    <div>
      <h1>Latest Posts</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      {/* 客户端交互组件 */}
      <LikeButton postId={posts[0].id} />
    </div>
  );
}
```

```jsx
// ✅ Client Component（必须声明 'use client'）
// components/LikeButton.tsx
'use client';

import { useState } from 'react';

export function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? '❤️ Liked' : '🤍 Like'}
    </button>
  );
}
```

### 1.3 边界规则 ⭐

| 能力 | 服务端组件 | 客户端组件 |
|------|-----------|-----------|
| 使用 useState / useEffect | ❌ | ✅ |
| 使用浏览器 API（window/document） | ❌ | ✅ |
| 直接访问数据库 | ✅ | ❌ |
| 导入客户端组件 | ✅ | ✅ |
| 被客户端组件导入 | ❌ ⚠️ 不能作为 children 传入？实际上可以通过 props 传递 JSX | ✅ |
| 使用事件处理函数 | ❌ | ✅ |
| 包含 secret keys | ✅ 安全 | ❌ ⚠️ 会被发送到浏览器 |

```text
组件树边界示意：

[Server] App
├── [Server] Header        ← 服务端渲染，零 JS
├── [Server] PostList      ← 服务端渲染，直接查数据库
│   ├── [Client] LikeButton ← 'use client'，有 useState
│   └── [Client] CommentBox ← 'use client'，有表单交互
└── [Server] Footer        ← 服务端渲染，零 JS

客户端只需下载 LikeButton 和 CommentBox 的 JS 代码！
```

### 1.4 RSC Payload 格式

```json
// RSC 序列化输出示例（简化版）
["$","div",null,{
  "children":[
    ["$","h1",null,{"children":"Hello"}],
    ["$","$L1",null,{"name":"Penny"}]
    //             ↑ 引用客户端组件，$L1 是占位符
  ]
}]
```

### 1.5 流式渲染（Streaming SSR）

RSC 天然支持流式渲染，使用 `<Suspense>` 可以逐步发送 HTML。

```jsx
// app/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* 这部分可以先发送 */}
      <Suspense fallback={<Skeleton />}>
        <SlowDataComponent /> {/* 数据加载完再流式发送 */}
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <AnalyticsWidget />
      </Suspense>
    </div>
  );
}
```

```text
流式渲染时间线：

0ms    → 发送 <html><body><h1>Dashboard</h1>
         发送 Suspense fallback（骨架屏）
200ms  → 流式注入 SlowDataComponent 的真实内容
350ms  → 流式注入 AnalyticsWidget 的真实内容
```

---

## 知识点 2：SSR vs RSC 对比 ⭐

| 维度 | 传统 SSR | RSC |
|------|---------|-----|
| 渲染产物 | HTML 字符串 | 序列化 React 树 |
| Hydration | 整个页面需要 hydrate | 只 hydrate 客户端组件 |
| JS Bundle | 全量组件代码 | 仅客户端组件代码 |
| 数据获取 | 在 getServerSideProps 中 | 直接在组件内 async/await |
| 组件复用 | 需要同构（isomorphic） | 服务端/客户端组件天然混合 |
| 流式渲染 | 需要额外配置 | `<Suspense>` 原生支持 |

---

## 知识点 3：AI Agent 基础架构 ⭐⭐

### 3.1 什么是 AI Agent

AI Agent = LLM（大语言模型）+ Tools（工具调用）+ Memory（记忆系统）。

```text
传统 Chatbot：
  用户提问 → LLM 回答 → 结束
  （纯文本，无法执行操作）

AI Agent：
  用户提问 → LLM 思考 → 决定调用工具 → 执行工具 → 获取结果 → 继续思考 → 最终回答
                    ↑                                          │
                    └──────── 循环直到完成 ←─────────────────────┘
```

### 3.2 LLM + Tools + Memory 架构

```text
┌──────────────────────────────────────────────┐
│                   AI Agent                    │
│                                              │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  │
│  │    LLM     │  │  Tools   │  │ Memory  │  │
│  │            │  │          │  │         │  │
│  │ - 推理     │  │ - 搜索   │  │ - 对话  │  │
│  │ - 规划     │  │ - 代码   │  │ - 长期  │  │
│  │ - 决策     │  │ - API    │  │ - 向量  │  │
│  └─────┬──────┘  └────┬─────┘  └────┬────┘  │
│        │              │             │        │
│        └──────────────┼─────────────┘        │
│                       │                      │
│              Function Calling               │
│           (LLM 决定何时调用哪个工具)            │
└──────────────────────────────────────────────┘
```

**三个核心组件**：

| 组件 | 作用 | 实现方式 |
|------|------|---------|
| LLM | 大脑：理解、推理、规划 | GPT-4, Claude, Qwen 等 |
| Tools | 手脚：执行具体操作 | API 调用、代码执行、数据库查询 |
| Memory | 记忆：保持上下文 | 短期（对话历史）/ 长期（向量数据库） |

### 3.3 Function Calling 原理 ⭐⭐

🔑 Function Calling 让 LLM 能**结构化地决定调用哪个工具**，而不是自由文本猜测。

```js
// 1. 定义工具（tool）的 schema
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "获取指定城市的当前天气",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名称，如 'Beijing'" },
          unit: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "搜索互联网获取实时信息",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" }
        },
        required: ["query"]
      }
    }
  }
];

// 2. 用户提问
const userMessage = "北京今天天气怎么样？";

// 3. 调用 LLM（带 tools）
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: userMessage }],
  tools: tools,
  tool_choice: "auto", // 让 LLM 自动决定是否调用工具
});

// 4. LLM 返回 tool_calls（不是直接回答！）
// response.choices[0].message = {
//   role: "assistant",
//   tool_calls: [{
//     id: "call_abc123",
//     function: {
//       name: "get_weather",    ← LLM 决定调用天气 API
//       arguments: '{"city":"Beijing","unit":"celsius"}'
//     }
//   }]
// }

// 5. 代码执行工具，获取结果
const weatherResult = await getWeather("Beijing", "celsius");
// weatherResult = { temp: 22, condition: "晴", humidity: 45 }

// 6. 将结果反馈给 LLM
const finalResponse = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "user", content: userMessage },
    response.choices[0].message, // assistant 的 tool_call
    {
      role: "tool",              // 工具返回的结果
      tool_call_id: "call_abc123",
      content: JSON.stringify(weatherResult)
    }
  ]
});

// 7. LLM 生成最终人类可读的回答
// finalResponse: "北京今天天气晴朗，气温 22°C，湿度 45%，适合出行！"
```

### 3.4 Function Calling 调用流程

```text
用户："北京今天天气怎么样？"
    │
    ▼
LLM 推理：用户想查天气，我有 get_weather 工具
    │
    ▼
LLM 输出：tool_call { name: "get_weather", args: { city: "北京" } }
    │
    ▼
Agent 执行：getWeather("北京")
    │
    ▼
工具返回：{ temp: 22, condition: "晴" }
    │
    ▼
LLM 推理：拿到天气数据了，生成回答
    │
    ▼
最终回答："北京今天天气晴朗，22°C，适合出行！"
```

### 3.5 ReAct 模式（Reasoning + Acting）

Agent 常用的推理模式：

```text
Thought: 用户问天气，我需要查天气 API
Action: get_weather(city="北京")
Observation: { temp: 22, condition: "晴" }
Thought: 拿到数据了，可以回答了
Answer: 北京今天天气晴朗，22°C，适合出行！
```

```js
// ReAct 循环简化实现
async function agentLoop(userQuery, tools, llm) {
  const messages = [{ role: 'user', content: userQuery }];
  const maxSteps = 5;

  for (let i = 0; i < maxSteps; i++) {
    const response = await llm.chat(messages, tools);

    // LLM 决定回答
    if (response.content) {
      return response.content;
    }

    // LLM 决定调用工具
    if (response.tool_calls) {
      for (const call of response.tool_calls) {
        const toolFn = tools[call.function.name];
        const result = await toolFn(JSON.parse(call.function.arguments));
        // 将工具结果反馈给 LLM
        messages.push(response); // assistant 的 tool_call
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result)
        });
      }
    }
  }

  return '达到最大迭代次数';
}
```

---

## 🔧 手写题（2 道）

### 手写题 1：实现简化版 Agent 循环

```js
/**
 * 简化版 AI Agent 循环
 * 模拟 Function Calling 的核心流程
 */
class SimpleAgent {
  constructor(tools) {
    this.tools = tools; // { name: { description, fn, schema } }
  }

  /**
   * 模拟 LLM 决策：根据用户输入决定调用哪个工具
   * @param {string} userMessage
   * @returns {{ type: 'tool_call' | 'answer', data: * }}
   */
  mockLLMDecide(userMessage) {
    // 1. 简单关键词匹配（实际用 LLM 推理）
    if (userMessage.includes('天气')) {
      const cityMatch = userMessage.match(/(.+?)的?天气/);
      return {
        type: 'tool_call',
        data: { name: 'get_weather', args: { city: cityMatch?.[1] || '北京' } }
      };
    }
    if (userMessage.includes('搜索')) {
      const query = userMessage.replace('搜索', '').trim();
      return {
        type: 'tool_call',
        data: { name: 'search', args: { query } }
      };
    }
    // 2. 无法匹配 → 直接回答
    return { type: 'answer', data: '我不确定怎么处理这个请求。' };
  }

  /**
   * Agent 执行循环
   * @param {string} userMessage
   * @returns {Promise<string>}
   */
  async run(userMessage) {
    const history = [{ role: 'user', content: userMessage }];
    const maxSteps = 3;

    for (let step = 0; step < maxSteps; step++) {
      const decision = this.mockLLMDecide(
        history.map(m => m.content).join(' ')
      );

      if (decision.type === 'answer') {
        return decision.data;
      }

      // 执行工具调用
      const { name, args } = decision.data;
      const tool = this.tools[name];
      if (!tool) return `工具 ${name} 不存在`;

      const result = await tool.fn(args);
      history.push({ role: 'tool', content: JSON.stringify(result) });
      console.log(`Step ${step + 1}: 调用 ${name} →`, result);
    }

    return '达到最大迭代次数';
  }
}

// 测试
const agent = new SimpleAgent({
  get_weather: {
    description: '查天气',
    fn: async ({ city }) => ({ city, temp: 22, condition: '晴' }),
  },
  search: {
    description: '搜索',
    fn: async ({ query }) => ({ results: [`关于 ${query} 的结果`] }),
  },
});

agent.run('北京天气怎么样？').then(console.log);
// Step 1: 调用 get_weather → { city: '北京', temp: 22, condition: '晴' }
// 然后返回最终回答
```

### 手写题 2：实现 Memory 管理

```js
/**
 * Agent 记忆系统
 * 短期记忆（对话历史）+ 长期记忆（关键信息存储）
 */
class AgentMemory {
  constructor(maxShortTerm = 20) {
    this.shortTerm = []; // 对话历史
    this.longTerm = [];  // 持久化记忆
    this.maxShortTerm = maxShortTerm;
  }

  // 1. 添加短期记忆
  addMessage(role, content) {
    this.shortTerm.push({ role, content, timestamp: Date.now() });
    // 超出上限时，将最早的对话移入长期记忆摘要
    if (this.shortTerm.length > this.maxShortTerm) {
      const overflow = this.shortTerm.shift();
      this.summarizeToLongTerm(overflow);
    }
  }

  // 2. 提取关键信息到长期记忆
  summarizeToLongTerm(message) {
    // 简化：实际用 LLM 做摘要
    if (message.role === 'user' || message.role === 'assistant') {
      const key = message.content.slice(0, 50);
      if (!this.longTerm.some(m => m.key === key)) {
        this.longTerm.push({ key, content: message.content, timestamp: message.timestamp });
      }
    }
  }

  // 3. 获取上下文（短期 + 相关长期记忆）
  getContext() {
    return [...this.longTerm.slice(-3), ...this.shortTerm];
  }

  // 4. 清空短期记忆
  clearShortTerm() {
    this.shortTerm.forEach(m => this.summarizeToLongTerm(m));
    this.shortTerm = [];
  }
}

// 测试
const memory = new AgentMemory(5);
memory.addMessage('user', '我叫 Penny，21岁');
memory.addMessage('assistant', '你好 Penny！');
memory.addMessage('user', '我喜欢时尚和模特');
memory.addMessage('user', '今天天气真好');
memory.addMessage('user', '帮我查一下新闻');

console.log('短期记忆条数:', memory.shortTerm.length); // 5
memory.addMessage('user', '新消息'); // 超出上限
console.log('短期记忆条数:', memory.shortTerm.length); // 5
console.log('长期记忆条数:', memory.longTerm.length);   // 1（最旧的被移入）
```

---

## 💻 算法题

### 题 1：组合总和（#39）⭐

**思路**：回溯法。可以重复使用同一个数，所以递归时 start 不 +1。

```js
/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 * 时间复杂度：O(n^(target/min)) 空间复杂度：O(target/min)
 */
var combinationSum = function(candidates, target) {
  const result = [];
  candidates.sort((a, b) => a - b); // 排序方便剪枝

  const backtrack = (start, path, remain) => {
    if (remain === 0) {
      result.push([...path]);
      return;
    }

    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) break; // 剪枝：后面的数更大
      path.push(candidates[i]);
      backtrack(i, path, remain - candidates[i]); // ⚠️ 不是 i+1，可以重复
      path.pop();
    }
  };

  backtrack(0, [], target);
  return result;
};

console.log(combinationSum([2,3,6,7], 7));
// [[2,2,3],[7]]
console.log(combinationSum([2,3,5], 8));
// [[2,2,2,2],[2,3,3],[3,5]]
```

### 题 2：分割回文串（#131）

**思路**：回溯枚举所有分割点，用 isPalindrome 检查每段是否回文。

```js
/**
 * @param {string} s
 * @return {string[][]}
 * 时间复杂度：O(n×2^n) 空间复杂度：O(n^2)
 */
var partition = function(s) {
  const result = [];
  const n = s.length;

  // 预处理回文表
  const isPalin = Array.from({ length: n }, () => new Array(n).fill(true));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j < n; j++) {
      isPalin[i][j] = s[i] === s[j] && isPalin[i + 1][j - 1];
    }
  }

  const backtrack = (start, path) => {
    if (start === n) {
      result.push([...path]);
      return;
    }

    for (let end = start; end < n; end++) {
      if (isPalin[start][end]) {
        path.push(s.slice(start, end + 1));
        backtrack(end + 1, path);
        path.pop();
      }
    }
  };

  backtrack(0, []);
  return result;
};

console.log(partition('aab'));
// [['a','a','b'],['aa','b']]
console.log(partition('a'));
// [['a']]
```

### 题 3：N 皇后（#51）⭐⭐

**思路**：逐行放置皇后，用集合记录已占用的列和两条对角线。

```js
/**
 * @param {number} n
 * @return {string[][]}
 * 时间复杂度：O(n!) 空间复杂度：O(n^2)
 */
var solveNQueens = function(n) {
  const result = [];
  const board = Array.from({ length: n }, () => '.'.repeat(n).split(''));
  const cols = new Set();
  const diag1 = new Set(); // row - col
  const diag2 = new Set(); // row + col

  const backtrack = (row) => {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) {
        continue; // 冲突，跳过
      }

      board[row][col] = 'Q';
      cols.add(col);
      diag1.add(row - col);
      diag2.add(row + col);

      backtrack(row + 1);

      board[row][col] = '.';
      cols.delete(col);
      diag1.delete(row - col);
      diag2.delete(row + col);
    }
  };

  backtrack(0);
  return result;
};

const solutions = solveNQueens(4);
console.log(solutions);
// [
//   [".Q..","...Q","Q...","..Q."],
//   ["..Q.","Q...","...Q",".Q.."]
// ]
console.log(`共 ${solutions.length} 种解法`);
```

### 解法对比

| 题目 | 剪枝策略 | 关键技巧 | 时间复杂度 |
|------|---------|---------|-----------|
| 组合总和 | 排序后 break | start 不 +1（可重复） | O(n^(t/m)) |
| 分割回文串 | 预处理 isPalin 表 | DP 预处理避免重复计算 | O(n×2^n) |
| N 皇后 | 三个 Set 判断冲突 | 对角线特征：row±col 为常数 | O(n!) |

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| RSC 原理 | 服务端渲染序列化组件树，客户端不下载组件代码 | ⭐⭐⭐⭐⭐ |
| RSC vs SSR | RSC 输出序列化树 vs SSR 输出 HTML，RSC 无需全量 hydrate | ⭐⭐⭐⭐⭐ |
| 'use client' 边界 | 客户端组件可导入服务端组件为 children，反过来不行直接导入 | ⭐⭐⭐⭐ |
| 流式渲染 | Suspense 边界逐步发送，提升 FCP | ⭐⭐⭐⭐ |
| AI Agent | LLM + Tools + Memory，Function Calling 结构化调用工具 | ⭐⭐⭐⭐⭐ |
| Function Calling | LLM 输出 tool_call → 执行工具 → 反馈结果 → 生成最终回答 | ⭐⭐⭐⭐⭐ |
| 回溯进阶 | 组合总和（可重复）、N 皇后（冲突检测） | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 18）

明日主题：**状态管理与数据获取**

- 🔑 Redux Toolkit（createSlice、RTK Query）
- 🔑 Zustand 轻量状态管理
- 🔑 TanStack Query 数据获取与缓存
- 💻 求开方、分割数组的最大值（二分查找）
