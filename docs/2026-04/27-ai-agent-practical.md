# 04/27 — AI Agent 实战深入（Day 27）

> **阶段**：第四阶段 工程化 + 冲刺
> **今日目标**：掌握 Prompt Engineering 进阶技巧和 AI Agent 开发实战
> **投入时间**：上午 2h / 下午 2h / 晚上 1h 复习

---

## 知识点 1：Prompt Engineering 进阶 ⭐

### 1.1 RTF 框架

🔑 **Role-Task-Format：角色 + 任务 + 格式**

```
你是一名 [角色]，擅长 [专业领域]。

请完成以下任务：
[具体任务描述]

输出格式：
[期望的输出结构]
```

```js
// 示例：代码审查 Prompt
const codeReviewPrompt = `
你是一名资深前端工程师，擅长 React 和 TypeScript 最佳实践。

请审查以下代码，找出：
1. 潜在的性能问题
2. 类型安全问题
3. 不符合 React 最佳实践的地方

输出格式：
## 问题清单
| # | 文件 | 问题类型 | 描述 | 严重程度 | 建议 |

## 改进建议
- [ ] ...

代码：
\`\`\`tsx
${code}
\`\`\`
`;
```

### 1.2 Chain-of-Thought（思维链）⭐

🔑 **让模型逐步思考，显著提升复杂任务的准确率**

```
❌ 普通 Prompt：
"这道算法题的时间复杂度是多少？"
→ 模型可能直接猜答案

✅ CoT Prompt：
"这道算法题的时间复杂度是多少？
请按以下步骤分析：
1. 识别外层循环的次数
2. 识别内层循环的次数
3. 分析嵌套关系
4. 得出最终复杂度"
→ 模型逐步推理，准确率更高
```

```js
// Zero-shot CoT — 加一句 "Let's think step by step"
const zeroShotCoT = `
判断以下代码是否有内存泄漏：
\`\`\`js
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);
  }, 1000);
}, []);
\`\`\`

Let's think step by step.
`;

// Few-shot CoT — 提供推理示例
const fewShotCoT = `
以下是一些代码审查的推理示例：

示例 1：
代码：const data = await fetch('/api').then(r => r.json());
分析：
1. 没有 try-catch 包裹 → 网络错误会导致 unhandled rejection
2. 没有 loading/error 状态管理
3. 组件卸载后仍会更新状态
结论：❌ 需要添加错误处理和 AbortController

现在请审查：
代码：${code}
`;
```

### 1.3 高级 Prompt 技巧

| 技巧 | 说明 | 示例 |
|------|------|------|
| **角色扮演** | 赋予模型专家身份 | "你是 TypeScript 类型体操大师" |
| **反向提问** | 让模型先提问再回答 | "在回答之前，请先问我 3 个澄清问题" |
| **自洽性** | 多次采样取多数结果 | "请给出 3 个不同方案，然后选最优" |
| **负面约束** | 明确不要做什么 | "不要使用 any 类型，不要省略错误处理" |
| **输出模板** | 严格控制输出格式 | "用 JSON 格式输出，包含 code 和 explanation 字段" |

### 面试 Q&A

| 面试题 | 要点 |
|--------|------|
| CoT 为什么有效？ | 强迫模型逐步推理，减少跳步导致的错误 |
| RTF 框架的三个要素？ | Role（角色）、Task（任务）、Format（格式） |
| Prompt Engineering 在前端的应用？ | 代码审查、测试生成、文档生成、Bug 修复 |

---

## 知识点 2：AI Agent 开发实战 ⭐

### 2.1 Vercel AI SDK

```tsx
// 安装：npm install ai @ai-sdk/openai

// app/api/chat/route.ts — API 路由
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. 调用模型，流式返回
  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: '你是一个前端开发专家，用中文回答问题。',
  });

  // 2. 返回流式响应
  return result.toDataStreamResponse();
}
```

```tsx
// app/page.tsx — 前端聊天界面
'use client';
import { useChat } from 'ai/react';

export default function ChatPage() {
  // 3. useChat Hook 管理消息状态
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="chat-container">
      {messages.map(m => (
        <div key={m.id} className={`message ${m.role}`}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '思考中...' : '发送'}
        </button>
      </form>
    </div>
  );
}
```

### 2. Vercel AI SDK 工具调用

```ts
// 带工具调用的 Agent
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: '帮我计算 123 * 456，并查询北京今天的天气',
  tools: {
    calculate: tool({
      description: '执行数学计算',
      parameters: z.object({
        expression: z.string().describe('数学表达式'),
      }),
      execute: async ({ expression }) => {
        return String(eval(expression)); // 生产环境用安全的表达式解析器
      },
    }),
    getWeather: tool({
      description: '获取天气信息',
      parameters: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => {
        // 实际调用天气 API
        return `${city}: 晴，25°C，微风`;
      },
    }),
  },
  maxSteps: 5, // 最多执行 5 步（思考 → 调用工具 → 再思考）
});

console.log(result.text);
// "123 × 456 = 56,088。北京今天天气：晴，25°C，微风。"
```

### 2.3 RAG（Retrieval-Augmented Generation）⭐

🔑 **RAG = 检索 + 增强 + 生成：让模型基于你的私有数据回答问题**

```
RAG 工作流程：

┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│ 用户提问 │ →  │ 向量检索  │ →  │ 增强 Prompt │ → │ LLM 生成  │
└─────────┘    │ (相似文档) │    │ (问题+上下文) │    │  最终回答  │
               └──────────┘    └─────────┘    └──────────┘
                    ↑
             ┌──────────────┐
             │ 向量数据库     │
             │ (Embedding)  │
             └──────────────┘
                    ↑
             ┌──────────────┐
             │ 文档切分+向量化│
             │ (预处理阶段)   │
             └──────────────┘
```

```ts
// RAG 实现步骤

// Step 1: 文档向量化（预处理）
import { OpenAIEmbeddings } from '@ai-sdk/openai';
import { embedMany } from 'ai';

// 将文档切分为 chunks
const chunks = splitDocument(document, { chunkSize: 512, overlap: 50 });

// 生成向量
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: chunks.map(c => c.text),
});

// 存入向量数据库（如 Pinecone / pgvector）
await vectorStore.upsert(
  chunks.map((chunk, i) => ({
    id: chunk.id,
    values: embeddings[i],
    metadata: { text: chunk.text, source: chunk.source },
  }))
);

// Step 2: 查询时检索
const query = '如何优化 React 组件性能？';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: query,
});

// 在向量数据库中搜索相似文档
const results = await vectorStore.query({
  vector: embedding,
  topK: 5, // 返回最相似的 5 个 chunks
});

// Step 3: 构建增强 Prompt
const context = results.matches.map(m => m.metadata.text).join('\n---\n');

const answer = await generateText({
  model: openai('gpt-4o'),
  prompt: `基于以下参考资料回答问题。如果资料中没有相关信息，请说明。

参考资料：
${context}

问题：${query}`,
});
```

### 2.4 RAG 在前端的集成

```tsx
// 前端 RAG 搜索组件
'use client';
import { useState } from 'react';

export function RAGSearch() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);

  async function handleSearch(e) {
    e.preventDefault();
    setAnswer('思考中...');

    const res = await fetch('/api/rag', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setSources(data.sources); // 引用的文档来源
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input value={query} onChange={e => setQuery(e.target.value)} />
        <button>搜索</button>
      </form>

      {answer && (
        <div className="answer">
          <h3>回答</h3>
          <p>{answer}</p>

          <h4>参考来源</h4>
          <ul>
            {sources.map((s, i) => (
              <li key={i}>
                <a href={s.url}>{s.title}</a>
                <span>（相关度: {(s.score * 100).toFixed(1)}%）</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 面试 Q&A

| 面试题 | 要点 |
|--------|------|
| RAG 是什么？ | 检索增强生成：先从知识库检索相关文档，再让 LLM 基于文档回答 |
| RAG vs Fine-tuning？ | RAG 适合知识频繁更新的场景，Fine-tuning 适合改变模型行为 |
| Vercel AI SDK 的核心 Hook？ | `useChat`（流式聊天）、`useCompletion`（单次补全） |
| MCP 暴露工具的流程？ | 注册工具 schema → 处理 tools/call 请求 → 返回结果 |

---

## 🔧 手写题（2 道）

### 手写题 1：实现简易向量相似度搜索

```js
/**
 * 余弦相似度计算
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} [-1, 1]，越接近 1 越相似
 */
function cosineSimilarity(a, b) {
  // 1. 点积
  let dotProduct = 0;
  // 2. 模长
  let normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  // 3. 余弦相似度 = dot(A, B) / (|A| * |B|)
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 简易向量搜索库
 */
class VectorStore {
  constructor() {
    this.documents = [];
  }

  /**
   * 添加文档
   * @param {string} id
   * @param {number[]} embedding
   * @param {Object} metadata
   */
  add(id, embedding, metadata) {
    this.documents.push({ id, embedding, metadata });
  }

  /**
   * 搜索最相似的文档
   * @param {number[]} queryEmbedding
   * @param {number} topK
   * @returns {Array}
   */
  search(queryEmbedding, topK = 5) {
    // 1. 计算所有文档的相似度
    const scored = this.documents.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // 2. 按相似度降序排列
    scored.sort((a, b) => b.score - a.score);

    // 3. 返回 topK 结果
    return scored.slice(0, topK);
  }
}

// 测试
const store = new VectorStore();
store.add('doc1', [0.1, 0.2, 0.3], { text: 'React 性能优化' });
store.add('doc2', [0.9, 0.1, 0.0], { text: 'Vue 响应式原理' });
store.add('doc3', [0.2, 0.3, 0.1], { text: 'React Hooks 详解' });

const results = store.search([0.15, 0.25, 0.2], 2);
console.log(results[0].metadata.text); // 最相关的文档
console.log(cosineSimilarity([1, 0, 0], [1, 0, 0])); // 1（完全相同）
console.log(cosineSimilarity([1, 0, 0], [0, 1, 0])); // 0（完全无关）
```

### 手写题 2：实现模板字符串解析器

```js
/**
 * 模板字符串解析 — 模拟 Prompt 模板引擎
 * 支持 {{variable}} 和 {{#if condition}}...{{/if}}
 * @param {string} template
 * @param {Object} data
 * @returns {string}
 */
function renderTemplate(template, data) {
  let result = template;

  // 1. 处理条件块 {{#if var}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, variable, content) => {
      return data[variable] ? content : '';
    }
  );

  // 2. 处理变量替换 {{var}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, variable) => {
    // 3. 如果变量不存在，保留原始标记
    return data[variable] !== undefined ? data[variable] : `{{${variable}}}`;
  });

  return result;
}

// 测试
const prompt = renderTemplate(`
你是一名{{role}}。
{{#if examples}}
以下是一些示例：
{{examples}}
{{/if}}
请完成：{{task}}
`, {
  role: '前端工程师',
  examples: '- 示例1: 好的代码\n- 示例2: 需要改进的代码',
  task: '审查这段 React 代码',
});

console.log(prompt);
// 你是一名前端工程师。
// 以下是一些示例：
// - 示例1: 好的代码
// - 示例2: 需要改进的代码
// 请完成：审查这段 React 代码

// 处理缺失变量
const result = renderTemplate('Hello {{name}}, welcome to {{place}}!', { name: 'Orion' });
console.log(result); // "Hello Orion, welcome to {{place}}!"
```

---

## 💻 算法题

今日不安排新算法题，复习为主。建议回顾：

| 复习重点 | 题号 | 关键思路 |
|---------|------|----------|
| 编辑距离 | #72 | 二维 DP，增删改三种操作 |
| 最长递增子序列 | #300 | 贪心 + 二分 O(n log n) |
| 接雨水 | #42 | 双指针 O(n) |
| 零钱兑换 | #322 | 完全背包 DP |
| 缺失的第一个正数 | #41 | 原地哈希 |

> 📌 建议：每道题限时 15 分钟重做。做不出来标注 ❌ 并写清卡在哪一步。

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|----------|----------|
| Prompt Engineering | RTF 框架 + CoT 思维链 + 负面约束 | ⭐⭐⭐⭐ |
| Vercel AI SDK | useChat 流式聊天 + tool 工具调用 | ⭐⭐⭐⭐ |
| RAG 原理 | 向量化 → 检索 → 增强 Prompt → LLM 生成 | ⭐⭐⭐⭐⭐ |
| 向量相似度 | 余弦相似度，向量数据库检索 | ⭐⭐⭐ |
| AI Agent | MCP + Tool Calling + 多步推理 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 28）

**算法冲刺 + 简历优化 + 行为面试** — 上午重做高频错题 5 道，下午简历优化（STAR 法则项目描述）和行为面试准备。
