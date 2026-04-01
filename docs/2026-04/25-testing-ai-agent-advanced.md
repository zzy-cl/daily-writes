# 04/25 — 🧪 前端测试 + AI Agent 进阶

> 🕐 预计 4-5h | 知识点 2.5h + 手写题 1h + 算法 1.5h

---

## 📌 知识点1：前端测试体系

### 🔑 测试金字塔

```
        ▲
       ╱ ╲        E2E 测试
      ╱   ╲       少量、慢、高保真
     ╱─────╲      Cypress / Playwright
    ╱       ╲
   ╱  集成测试 ╲   中等数量
  ╱─────────────╲  组件 + API 集成
 ╱               ╲
╱   单元测试       ╲ 大量、快、低保真
╱─────────────────╲  Vitest / Jest

比例建议：单元 70% / 集成 20% / E2E 10%
```

### ⭐ 单元测试：Vitest vs Jest

| 特性 | Vitest | Jest |
|------|--------|------|
| 速度 | ⚡ Vite 驱动，极快 | 较慢（需 Babel/TS 编译） |
| 兼容 Jest API | ✅ 几乎完全兼容 | 原生 |
| ESM 支持 | ✅ 原生 | ❌ 需要额外配置 |
| 配置 | 共享 vite.config | 单独 jest.config |
| UI | ✅ 内置 UI 面板 | ❌ 需第三方 |
| 推荐 | ✅ Vite 项目首选 | 老项目 / 非 Vite |

```js
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // 全局 API（describe/it/expect）
    environment: 'jsdom',    // 模拟浏览器环境
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
    },
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### 🔑 常用测试模式

```js
// ✅ Vitest 示例 — 测试工具函数
import { describe, it, expect } from 'vitest';
import { formatCurrency, debounce, deepClone } from './utils';

describe('formatCurrency', () => {
  it('should format number to CNY', () => {
    expect(formatCurrency(1234.5)).toBe('¥1,234.50');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('¥0.00');
  });

  it('should handle negative', () => {
    expect(formatCurrency(-99.9)).toBe('-¥99.90');
  });
});

// ✅ 异步测试
describe('fetchUser', () => {
  it('should return user data', async () => {
    const user = await fetchUser(1);
    expect(user).toEqual({
      id: 1,
      name: expect.any(String), // 类型断言
    });
  });

  it('should throw on invalid id', async () => {
    await expect(fetchUser(-1)).rejects.toThrow('Invalid ID');
  });
});

// ✅ Mock
import { vi } from 'vitest';

describe('analytics', () => {
  it('should track event', () => {
    const mockSend = vi.fn();
    vi.stubGlobal('fetch', mockSend);

    trackEvent('click', { button: 'signup' });

    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.stringContaining('click'),
      expect.any(Object)
    );

    vi.restoreAllMocks();
  });
});
```

### 🔑 组件测试（React Testing Library）

```js
// ✅ 测试 React 组件
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from './Counter';

describe('Counter', () => {
  it('should increment on click', async () => {
    render(<Counter initial={0} />);
    const button = screen.getByRole('button', { name: /count/i });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(button).toHaveTextContent('Count: 2');
  });

  it('should call onChange callback', async () => {
    const onChange = vi.fn();
    render(<Counter initial={0} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
```

⚠️ **测试原则**：
- ✅ 测试行为，不测试实现细节
- ✅ 用 `getByRole` 优先于 `getByTestId`（更接近用户操作）
- ❌ 不要测试 CSS 样式的具体值
- ❌ 不要测试第三方库的内部行为

### 🔑 E2E 测试：Cypress vs Playwright

| 特性 | Cypress | Playwright |
|------|---------|------------|
| 浏览器支持 | Chrome/Edge/Firefox | Chrome/Firefox/WebKit/Safari |
| 多标签页 | ❌ 限制 | ✅ 原生支持 |
| 速度 | 中等 | ⚡ 更快（自动等待） |
| API 风格 | 链式调用 | async/await |
| 网络拦截 | ✅ cy.intercept | ✅ page.route |
| 语言 | JS/TS only | JS/TS/Python/Java/.NET |
| 推荐 | 简单场景 | ✅ 复杂场景首选 |

```js
// ✅ Playwright E2E 示例
import { test, expect } from '@playwright/test';

test('用户登录流程', async ({ page }) => {
  await page.goto('https://app.example.com/login');

  // 填写表单
  await page.getByLabel('邮箱').fill('user@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录' }).click();

  // 验证跳转
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('欢迎回来')).toBeVisible();
});

test('API mock 示例', async ({ page }) => {
  // 拦截 API 请求，返回 mock 数据
  await page.route('**/api/user', route =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ name: 'Test User', role: 'admin' }),
    })
  );

  await page.goto('/profile');
  await expect(page.getByText('Test User')).toBeVisible();
});
```

---

## 📌 知识点2：AI Agent 进阶

### ⭐ MCP（Model Context Protocol）原理

```
MCP 是什么？
Anthropic 提出的开放协议，标准化 AI 模型与外部工具/数据源的交互方式。

核心架构：
┌──────────────┐       JSON-RPC       ┌──────────────┐
│  AI Client   │ ←──────────────────→ │  MCP Server  │
│ (Claude/GPT) │    Tools/Resources   │  (工具提供者)  │
│              │    Prompts           │              │
└──────────────┘                      └──────────────┘
      ↕                                      ↕
  用户交互                              文件系统 / API
                                        数据库 / 浏览器

传输层：
├── stdio：本地进程通信（最常用）
├── SSE：Server-Sent Events（远程）
└── Streamable HTTP：HTTP 流式（最新）
```

### 🔑 MCP 三大核心概念

```typescript
// 1️⃣ Tools（工具）— AI 可调用的操作
// 类似 function calling，但标准化了
{
  name: "read_file",
  description: "读取指定路径的文件内容",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "文件路径" }
    },
    required: ["path"]
  }
}

// 2️⃣ Resources（资源）— 只读数据源
// 类似 REST API 的 GET 端点
{
  uri: "file:///project/src/index.ts",
  name: "index.ts",
  mimeType: "text/typescript"
}

// 3️⃣ Prompts（提示词模板）— 预定义的对话模板
{
  name: "code_review",
  description: "审查代码质量",
  arguments: [
    { name: "code", description: "要审查的代码", required: true }
  ]
}
```

### 🔑 A2A 协议（Agent-to-Agent）

```
A2A：Google 提出的 Agent 间通信协议
解决：不同框架（LangGraph/CrewAI/AutoGen）的 Agent 如何互相协作

核心概念：
├── Agent Card：JSON 描述文件，声明 Agent 的能力
├── Task：Agent 间的任务对象
├── Message：Agent 间的消息传递
└── Artifact：任务产出物

与 MCP 的关系：
- MCP：Agent ↔ 工具/数据（垂直）
- A2A：Agent ↔ Agent（水平）
- 两者互补，不是竞争关系
```

### 🔑 Agent Skills（技能系统）

```
Skill = 可复用的 Agent 能力模块

结构：
skill-name/
├── SKILL.md          # 技能描述和指令
├── references/       # 参考文档
├── scripts/          # 辅助脚本
└── manifest.json     # 元数据

SKILL.md 关键字段：
- name: 技能名称
- description: 何时激活此技能（触发条件）
- instructions: 具体执行步骤
- tools: 需要的工具权限
```

### 🔑 工具暴露流程

```
工具开发流程：
1. 定义工具 Schema（名称、描述、参数）
2. 实现工具逻辑
3. 注册到 MCP Server
4. Agent 发现 → 调用 → 返回结果

// ✅ MCP Server 工具注册示例
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'my-tools',
  version: '1.0.0',
});

// 注册工具
server.tool(
  'search_docs',                                    // 工具名
  '搜索项目文档',                                    // 描述
  { query: z.string(), limit: z.number().optional() }, // 参数 Schema
  async ({ query, limit = 5 }) => {                 // 执行逻辑
    const results = await searchDocuments(query, limit);
    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
  }
);
```

### ⚠️ Agent 开发常见问题

| 问题 | 解决方案 |
|------|---------|
| 工具调用幻觉 | Schema 严格校验 + 返回值验证 |
| 无限循环 | 设置 maxIterations 限制 |
| 上下文溢出 | 摘要压缩 + 关键信息提取 |
| 权限过大 | 最小权限原则，沙箱执行 |
| 结果不可靠 | 多次采样 + 投票 + 人工确认 |

---

## 📌 知识点3：AI 代码审查实战

> 📝 以下是一段 AI 生成的 React 代码，找出其中的 Bug 和改进点

```jsx
// ❌ 以下代码有多个问题，请找出并修复
function UserList({ users }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(users);

  useEffect(() => {
    const result = users.filter(u => u.name.includes(search));
    setFiltered(result);
  });

  const handleClick = (id) => {
    fetch(`/api/users/${id}/delete`, { method: 'DELETE' });
    setFiltered(filtered.filter(u => u.id !== id));
  };

  return (
    <div>
      <input onChange={e => setSearch(e.target.value)} />
      <ul>
        {filtered.map(user => (
          <li onClick={() => handleClick(user.id)}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 🔍 Bug 分析

| # | 问题 | 严重度 | 修复 |
|---|------|--------|------|
| 1 | `useEffect` 缺少依赖数组 | 🔴 高 | 加 `[users, search]` |
| 2 | 乐观删除没有错误处理 | 🟡 中 | 用 try/catch，失败时回滚 |
| 3 | 点击事件绑在 `<li>` 而非按钮 | 🟡 中 | 添加独立删除按钮 |
| 4 | `includes` 区分大小写 | 🟢 低 | 统一 `toLowerCase()` |
| 5 | `search` 变化时直接过滤，无防抖 | 🟢 低 | 添加 debounce |
| 6 | 缺少 key | 🟡 中 | `key={user.id}` |

### ✅ 修复后

```jsx
function UserList({ users }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(users);
  const [deleting, setDeleting] = useState(new Set());

  // ✅ Fix 1: 添加依赖数组
  useEffect(() => {
    const result = users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) // ✅ Fix 4: 大小写不敏感
    );
    setFiltered(result);
  }, [users, search]);

  // ✅ Fix 2: 错误处理 + Fix 3: 独立按钮
  const handleDelete = async (id) => {
    setDeleting(prev => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/users/${id}/delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setFiltered(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error(error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜索用户..."
      />
      <ul>
        {filtered.map(user => (
          <li key={user.id}>  {/* ✅ Fix 6: 添加 key */}
            {user.name}
            <button
              onClick={() => handleDelete(user.id)}
              disabled={deleting.has(user.id)}
            >
              {deleting.has(user.id) ? '删除中...' : '删除'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 💻 手写题

### 手写题1：手写 Vitest 测试用例

```js
/**
 * 📝 为一个深拷贝函数写完整测试用例
 */

// 被测函数
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) return new Map([...obj].map(([k, v]) => [deepClone(k), deepClone(v)]));
  if (obj instanceof Set) return new Set([...obj].map(v => deepClone(v)));

  const clone = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}

// ✅ 测试用例
import { describe, it, expect } from 'vitest';

describe('deepClone', () => {
  // 基本类型
  it('should return primitive values as-is', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
    expect(deepClone(true)).toBe(true);
  });

  // 普通对象
  it('should deep clone nested objects', () => {
    const original = { a: 1, b: { c: 2, d: { e: 3 } } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);     // 值相等
    expect(cloned).not.toBe(original);    // 引用不同
    expect(cloned.b).not.toBe(original.b); // 嵌套对象引用也不同
  });

  // 数组
  it('should deep clone arrays', () => {
    const original = [1, [2, 3], [{ a: 4 }]];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
  });

  // 特殊对象
  it('should clone Date objects', () => {
    const date = new Date('2024-01-01');
    const cloned = deepClone(date);

    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
    expect(cloned.getTime()).toBe(date.getTime());
  });

  it('should clone RegExp objects', () => {
    const regex = /test/gi;
    const cloned = deepClone(regex);

    expect(cloned).toEqual(regex);
    expect(cloned).not.toBe(regex);
    expect(cloned.source).toBe('test');
    expect(cloned.flags).toBe('gi');
  });

  // Map
  it('should clone Map objects', () => {
    const map = new Map([['key1', { nested: true }], ['key2', 42]]);
    const cloned = deepClone(map);

    expect(cloned.get('key1')).toEqual({ nested: true });
    expect(cloned.get('key1')).not.toBe(map.get('key1'));
  });

  // Set
  it('should clone Set objects', () => {
    const set = new Set([1, { a: 2 }, [3, 4]]);
    const cloned = deepClone(set);

    expect(cloned.size).toBe(3);
    expect(cloned).not.toBe(set);
  });

  // ⚠️ 循环引用（当前实现会栈溢出）
  it('should handle circular references', () => {
    const obj = { a: 1 };
    obj.self = obj;

    // 当前实现会报错，可以标记为已知限制
    expect(() => deepClone(obj)).toThrow();
  });
});
```

### 手写题2：手写 MCP Server

```js
/**
 * 📝 一个简单的 MCP Server，提供文件搜索和代码统计功能
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// ✅ 1. 创建 Server 实例
const server = new McpServer({
  name: 'code-analyzer',
  version: '1.0.0',
});

// ✅ 2. 注册 Tool：统计代码行数
server.tool(
  'count_lines',
  '统计指定目录下的代码行数',
  {
    directory: z.string().describe('要统计的目录路径'),
    extensions: z.array(z.string()).optional().describe('文件扩展名过滤，如 [".ts", ".tsx"]'),
  },
  async ({ directory, extensions }) => {
    const stats = { total: 0, byExt: {} };

    function walk(dir) {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && entry !== 'node_modules' && entry !== '.git') {
          walk(fullPath);
        } else if (stat.isFile()) {
          const ext = extname(entry);
          if (extensions && !extensions.includes(ext)) continue;

          const lines = readFileSync(fullPath, 'utf-8').split('\n').length;
          stats.total += lines;
          stats.byExt[ext] = (stats.byExt[ext] || 0) + lines;
        }
      }
    }

    try {
      walk(directory);
      return {
        content: [{
          type: 'text',
          text: `📊 代码统计结果:\n- 总行数: ${stats.total}\n- 按扩展名:\n${
            Object.entries(stats.byExt)
              .map(([ext, count]) => `  ${ext}: ${count} 行`)
              .join('\n')
          }`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ 错误: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ✅ 3. 注册 Tool：搜索文件内容
server.tool(
  'search_content',
  '在指定目录中搜索包含关键字的文件',
  {
    directory: z.string().describe('搜索目录'),
    keyword: z.string().describe('搜索关键字'),
    fileTypes: z.array(z.string()).optional().describe('限定文件类型'),
  },
  async ({ directory, keyword, fileTypes }) => {
    const results = [];

    function walk(dir) {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && entry !== 'node_modules') {
          walk(fullPath);
        } else if (stat.isFile()) {
          if (fileTypes && !fileTypes.some(t => entry.endsWith(t))) continue;

          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(keyword)) {
              results.push({
                file: fullPath,
                line: idx + 1,
                content: line.trim(),
              });
            }
          });
        }
      }
    }

    walk(directory);

    return {
      content: [{
        type: 'text',
        text: results.length
          ? `🔍 找到 ${results.length} 个匹配:\n${
              results.slice(0, 20).map(r =>
                `  ${r.file}:${r.line} → ${r.content}`
              ).join('\n')
            }`
          : '未找到匹配结果',
      }],
    };
  }
);

// ✅ 4. 注册 Resource：项目概览
server.resource(
  'project-overview',
  'project://overview',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'text/plain',
      text: `项目分析工具 v1.0\n可用工具:\n- count_lines: 统计代码行数\n- search_content: 搜索文件内容`,
    }],
  })
);

// ✅ 5. 启动 Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Code Analyzer MCP Server running on stdio');
}

main().catch(console.error);
```

---

## 💻 算法题

### 算法1：#148 排序链表 ⭐⭐

**题目**：在 O(n log n) 时间复杂度和常数空间复杂度下，对链表进行排序。

**思路**：归并排序（自顶向下递归或自底向上迭代）。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) { this.val = val; this.next = next; }
 */

/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var sortList = function(head) {
  // 基础情况
  if (!head || !head.next) return head;

  // ✅ 快慢指针找中点
  let slow = head, fast = head.next;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const mid = slow.next;
  slow.next = null; // 断开链表

  // ✅ 递归排序两半
  const left = sortList(head);
  const right = sortList(mid);

  // ✅ 合并两个有序链表
  return merge(left, right);
};

function merge(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1;
      l1 = l1.next;
    } else {
      curr.next = l2;
      l2 = l2.next;
    }
    curr = curr.next;
  }

  curr.next = l1 || l2;
  return dummy.next;
}
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(n log n) |
| 空间 | O(log n)（递归栈）— 可优化为 O(1) 自底向上 |

---

### 算法2：#88 合并两个有序数组 ⭐

**题目**：将 `nums2` 合并到 `nums1` 中，结果仍在 `nums1` 中。`nums1` 有足够的空间。

**关键**：从后往前填充，避免覆盖。

```js
/**
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 * @return {void} 修改 nums1
 */
var merge = function(nums1, m, nums2, n) {
  let i = m - 1;    // nums1 有效元素末尾
  let j = n - 1;    // nums2 末尾
  let k = m + n - 1; // nums1 总末尾

  // ✅ 从后往前比较，大的放末尾
  while (i >= 0 && j >= 0) {
    if (nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }

  // ✅ 如果 nums2 还有剩余，复制到 nums1
  while (j >= 0) {
    nums1[k--] = nums2[j--];
  }

  // nums1 有剩余不用管，本来就在正确位置
};

// 测试
const nums1 = [1, 2, 3, 0, 0, 0];
merge(nums1, 3, [2, 5, 6], 3);
console.log(nums1); // [1, 2, 2, 3, 5, 6]
```

| 复杂度 | 值 |
|--------|-----|
| 时间 | O(m + n) |
| 空间 | O(1) 原地修改 |

⚠️ **易错**：从前往后会导致 `nums1` 的元素被覆盖。从后往前是关键！

---

### 算法3：#42 接雨水 ⭐⭐⭐

**题目**：给定 n 个非负整数表示柱子高度，计算能接多少雨水。

**思路**：双指针 + 维护左右最大高度。

```js
/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let water = 0;

  while (left < right) {
    leftMax = Math.max(leftMax, height[left]);
    rightMax = Math.max(rightMax, height[right]);

    if (height[left] < height[right]) {
      // ✅ 左边矮，左边的水量由 leftMax 决定
      water += leftMax - height[left];
      left++;
    } else {
      // ✅ 右边矮，右边的水量由 rightMax 决定
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
};

// 测试
console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6
console.log(trap([4, 2, 0, 3, 2, 5]));                      // 9
```

**图解**：
```
height: [0,1,0,2,1,0,1,3,2,1,2,1]

     █
   ████ █
 ██████████
 010210132121

water = 6 (每个位置的积水量 = min(左最大, 右最大) - 当前高度)
```

| 方法 | 时间 | 空间 | 推荐度 |
|------|------|------|--------|
| 暴力 | O(n²) | O(1) | ❌ |
| 前缀最大值 | O(n) | O(n) | ⭐ |
| 双指针 | O(n) | O(1) | ⭐⭐⭐ 最优 |
| 单调栈 | O(n) | O(n) | ⭐⭐ |

---

## 📋 解法对比表

| 题目 | 方法1 | 方法2 | 最优解 |
|------|-------|-------|--------|
| #148 排序链表 | 归并递归 O(n log n) | 归并迭代 O(n log n) O(1) | ✅ 归并 |
| #88 合并有序数组 | 额外数组 O(m+n) | 双指针从后往前 O(1) | ✅ 双指针 |
| #42 接雨水 | 前缀最大值 O(n) | 双指针 O(1) | ✅ 双指针 |

---

## 📋 总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| 测试金字塔 | 单元 70% / 集成 20% / E2E 10% | ⭐⭐⭐⭐ |
| Vitest | Vite 原生、兼容 Jest API、ESM 原生支持 | ⭐⭐⭐⭐ |
| React Testing Library | 测试行为不测试实现、getByRole 优先 | ⭐⭐⭐⭐ |
| Playwright | 多浏览器、自动等待、API mock | ⭐⭐⭐⭐ |
| MCP | JSON-RPC、Tools/Resources/Prompts 三件套 | ⭐⭐⭐⭐⭐ |
| A2A 协议 | Agent 间协作、Agent Card | ⭐⭐⭐ |
| Agent Skills | 可复用能力模块、SKILL.md 驱动 | ⭐⭐⭐ |
| AI 代码审查 | useEffect 依赖、错误处理、乐观更新 | ⭐⭐⭐⭐ |

---

## 🎉 第三阶段完成！

### 第三阶段回顾（Day 15-25）

| Day | 主题 | 核心收获 |
|-----|------|---------|
| 15-16 | React 基础 | Fiber 架构、Hooks 原理 |
| 17-18 | React 进阶 | 状态管理、性能优化、RSC |
| 19-20 | Vue 3 | Composition API、响应式原理、编译优化 |
| 21 | 复盘 | React 全家桶串讲、Vue 对比 |
| 22 | 构建工具 | Vite/Webpack 原理、Monorepo |
| 23 | 网络安全 | HTTP 演进、XSS/CSRF 防护 |
| 24 | 性能优化 | Web Vitals、全链路优化 |
| 25 | 测试 + AI | 测试体系、MCP、Agent 进阶 |

### 下一阶段预告：第四阶段（Day 26-30）
- 系统设计与架构
- 微前端实战
- 真实项目重构
- 模拟面试演练
