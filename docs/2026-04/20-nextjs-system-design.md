# 04/20 — Next.js 与元框架 + 系统设计（Day 20）

> **阶段**：第三阶段 React 18+
> **今日目标**：掌握 Next.js App Router 核心概念，完成首个系统设计场景题
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：Next.js App Router ⭐⭐⭐⭐

### 1.1 App Router vs Pages Router

| 特性 | Pages Router (旧) | App Router (新，推荐) |
|------|------------------|---------------------|
| 路由目录 | `pages/` | `app/` |
| 路由方式 | 文件即路由 | 文件夹即路由，`page.tsx` 为页面 |
| 数据获取 | `getServerSideProps` / `getStaticProps` | `async` 组件直接 `await` |
| 布局系统 | 手动 `_app.tsx` | 嵌套 `layout.tsx` 自动持久化 |
| 流式渲染 | 需要特殊配置 | `<Suspense>` 原生支持 |
| 服务端组件 | ❌ | ✅ 默认就是 |
| 路由组 | ❌ | ✅ `(group)` 不影响 URL |
| 平行路由 | ❌ | ✅ `@slot` |
| 拦截路由 | ❌ | ✅ `(.)path` |

### 1.2 App Router 目录结构

```text
app/
├── layout.tsx          ← 根布局（必须有）
├── page.tsx            ← 首页 (/)
├── loading.tsx         ← 首页 Suspense fallback
├── error.tsx           ← 首页错误边界
├── not-found.tsx       ← 404 页面
│
├── dashboard/
│   ├── layout.tsx      ← Dashboard 嵌套布局
│   ├── page.tsx        ← /dashboard
│   ├── loading.tsx     ← Dashboard 加载态
│   └── settings/
│       └── page.tsx    ← /dashboard/settings
│
├── (auth)/             ← 路由组（不影响 URL）
│   ├── login/
│   │   └── page.tsx    ← /login（不是 /auth/login）
│   └── register/
│       └── page.tsx    ← /register
│
├── api/                ← API Routes (route.ts)
│   └── users/
│       └── route.ts    ← /api/users
│
└── @modal/             ← 平行路由 slot
    └── (.)photo/
        └── page.tsx    ← 拦截路由
```

### 1.3 布局系统 ⭐

```tsx
// app/layout.tsx — 根布局（整个应用共享）
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Nav />           {/* 永远存在，不会因路由切换重渲染 */}
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx — Dashboard 嵌套布局
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-grid">
      <Sidebar />         {/* Dashboard 子页面共享侧边栏 */}
      <section>{children}</section>
    </div>
  );
}

// 渲染 /dashboard/settings 时：
// RootLayout > DashboardLayout > SettingsPage
// Nav 保留 ✅  Sidebar 保留 ✅  只有 {children} 区域切换
```

### 1.4 数据获取方式

```tsx
// ✅ 服务端组件中直接 async/await
// app/posts/page.tsx
export default async function PostsPage() {
  // 直接查数据库（无需 API 层！）
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}

// ✅ 并行数据获取（避免 waterfall）
export default async function DashboardPage() {
  // 同时发起，不等前一个完成
  const [user, stats, notifications] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
    getNotifications(),
  ]);

  return (
    <div>
      <UserCard user={user} />
      <StatsChart data={stats} />
      <NotificationList items={notifications} />
    </div>
  );
}
```

---

## 知识点 2：Server Actions ⭐⭐⭐⭐

### 2.1 什么是 Server Actions

🔑 Server Actions 让你直接在服务端组件中定义可被客户端调用的函数，**无需手动创建 API 端点**。

```tsx
// app/actions.ts
'use server'; // ⚠️ 必须声明 'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  // 直接操作数据库
  await db.post.create({ data: { title, content } });

  // 可以调用 revalidatePath 刷新缓存
  revalidatePath('/posts');

  // 可以 redirect
  redirect('/posts');
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });
  revalidatePath('/posts');
}
```

```tsx
// app/posts/new/page.tsx — 服务端组件中使用
import { createPost } from '../actions';

export default function NewPostPage() {
  return (
    // ✅ 直接在 form 的 action 中调用 server action
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">发布</button>
    </form>
  );
}
```

### 2.2 客户端调用 Server Actions

```tsx
// 客户端组件调用 server action
'use client';

import { deletePost } from '@/app/actions';

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deletePost(postId);
    });
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? '删除中...' : '删除'}
    </button>
  );
}
```

### 2.3 Server Actions 改变了什么？⭐

```text
传统方式：
  前端 → fetch('/api/posts') → API Route → 调用数据库 → 返回 JSON → 前端解析

Server Actions 方式：
  前端 → 调用 createPost(data) → 直接执行服务端函数 → 自动 revalidate

  优势：
  ✅ 少写一层 API 代码
  ✅ 类型安全（TypeScript 直接推断）
  ✅ 自动处理序列化
  ✅ 渐进增强（form 无 JS 也能提交）
```

---

## 知识点 3：边缘渲染（Edge Runtime）⭐⭐

### 3.1 Node.js vs Edge Runtime

| 特性 | Node.js Runtime | Edge Runtime |
|------|----------------|-------------|
| 启动时间 | 较慢（冷启动 200-500ms） | 极快（< 50ms） |
| API 兼容性 | 完整 Node.js API | 有限的 Web API |
| 包大小 | 无限制 | 较小（~1MB） |
| 运行位置 | 集中式服务器 | 全球 CDN 边缘节点 |
| 适用场景 | 复杂计算、完整数据库 | 简单逻辑、A/B 测试、鉴权 |

```tsx
// 强制使用 Edge Runtime
export const runtime = 'edge';

export default async function handler(req: Request) {
  // 可以使用标准 Web API
  const url = new URL(req.url);
  const country = req.headers.get('x-vercel-ip-country');

  return new Response(JSON.stringify({ country }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 3.2 Middleware（边缘运行的典型场景）

```tsx
// middleware.ts — 运行在 Edge，每个请求都会执行
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. 鉴权
  const token = request.cookies.get('token')?.value;
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. 地理重定向
  const country = request.geo?.country;
  if (country === 'CN' && !request.nextUrl.pathname.startsWith('/zh')) {
    return NextResponse.redirect(new URL('/zh' + request.nextUrl.pathname, request.url));
  }

  // 3. A/B 测试
  const response = NextResponse.next();
  const bucket = Math.random() < 0.5 ? 'a' : 'b';
  response.cookies.set('ab-test', bucket);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

---

## 知识点 4：系统设计 — 权限管理系统 ⭐⭐⭐

### 4.1 RBAC vs ABAC

```text
RBAC（Role-Based Access Control）基于角色：
  用户 → 角色 → 权限 → 资源
  Penny → Admin → [read, write, delete] → Posts

ABAC（Attribute-Based Access Control）基于属性：
  策略基于 用户属性 + 资源属性 + 环境条件
  IF user.department === 'Engineering' AND resource.confidential === false
    AND time.hour BETWEEN 9 AND 18
  THEN allow read
```

| 对比 | RBAC | ABAC |
|------|------|------|
| 复杂度 | 简单 | 复杂 |
| 灵活性 | 中（角色组合爆炸） | 高（任意属性组合） |
| 审计 | 简单（谁是什么角色） | 复杂（策略组合难以追踪） |
| 适用场景 | 中小型应用、角色明确 | 大型企业、复杂权限需求 |
| 实现难度 | ⭐⭐ | ⭐⭐⭐⭐ |

### 4.2 RBAC 数据库设计

```sql
-- 核心表：用户、角色、权限、资源
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'editor', 'viewer'
  description TEXT
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  resource VARCHAR(100) NOT NULL,   -- 'posts', 'users', 'comments'
  action VARCHAR(50) NOT NULL,      -- 'read', 'write', 'delete'
  UNIQUE(resource, action)
);

-- 关联表
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- 查询：用户 Penny 有 posts 的哪些权限？
SELECT p.resource, p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.name = 'Penny';
```

### 4.3 前端权限控制

```tsx
// hooks/usePermission.ts
'use client';

import { useQuery } from '@tanstack/react-query';

export function usePermission(resource: string, action: string) {
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => fetch('/api/me/permissions').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  return permissions?.some(
    (p: { resource: string; action: string }) =>
      p.resource === resource && p.action === action
  ) ?? false;
}

// 使用
function PostEditor({ post }) {
  const canEdit = usePermission('posts', 'write');
  const canDelete = usePermission('posts', 'delete');

  return (
    <div>
      <h1>{post.title}</h1>
      {canEdit && <button>编辑</button>}
      {canDelete && <button>删除</button>}
    </div>
  );
}
```

### 4.4 API 层鉴权（Server Actions 版）

```tsx
// lib/auth.ts
import { cookies } from 'next/headers';
import { db } from './db';

export async function getCurrentUser() {
  const token = (await cookies()).get('token')?.value;
  if (!token) return null;
  // 验证 JWT，返回用户信息
  return verifyToken(token);
}

export async function requirePermission(resource: string, action: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('未登录');

  const hasPermission = await db.permission.findFirst({
    where: {
      resource,
      action,
      roles: { some: { users: { some: { id: user.id } } } },
    },
  });

  if (!hasPermission) throw new Error('无权限');
  return user;
}

// actions.ts
'use server';
import { requirePermission } from '@/lib/auth';

export async function deletePost(id: string) {
  await requirePermission('posts', 'delete'); // ⚠️ 服务端强制鉴权
  await db.post.delete({ where: { id } });
}
```

---

## 🔧 手写题（2 道）

### 手写题 1：实现 RBAC 权限检查器

```js
/**
 * RBAC 权限检查器
 * 支持用户-角色-权限三级关系
 */
class RBACManager {
  constructor() {
    // 1. 存储结构
    this.users = new Map();        // userId → Set<roleId>
    this.rolePermissions = new Map(); // roleId → Set<`${resource}:${action}`>
  }

  // 2. 分配角色给用户
  assignRole(userId, roleId) {
    if (!this.users.has(userId)) this.users.set(userId, new Set());
    this.users.get(userId).add(roleId);
  }

  // 3. 给角色添加权限
  addPermission(roleId, resource, action) {
    if (!this.rolePermissions.has(roleId)) this.rolePermissions.set(roleId, new Set());
    this.rolePermissions.get(roleId).add(`${resource}:${action}`);
  }

  // 4. 检查权限
  hasPermission(userId, resource, action) {
    const roles = this.users.get(userId);
    if (!roles) return false;

    const permKey = `${resource}:${action}`;
    for (const roleId of roles) {
      const perms = this.rolePermissions.get(roleId);
      if (perms?.has(permKey)) return true;
    }
    return false;
  }

  // 5. 获取用户所有权限
  getUserPermissions(userId) {
    const roles = this.users.get(userId);
    if (!roles) return [];

    const allPerms = new Set();
    for (const roleId of roles) {
      const perms = this.rolePermissions.get(roleId);
      if (perms) perms.forEach(p => allPerms.add(p));
    }
    return [...allPerms].map(p => {
      const [resource, action] = p.split(':');
      return { resource, action };
    });
  }
}

// 测试
const rbac = new RBACManager();

// 定义权限
rbac.addPermission('admin', 'posts', 'read');
rbac.addPermission('admin', 'posts', 'write');
rbac.addPermission('admin', 'posts', 'delete');
rbac.addPermission('admin', 'users', 'read');
rbac.addPermission('editor', 'posts', 'read');
rbac.addPermission('editor', 'posts', 'write');
rbac.addPermission('viewer', 'posts', 'read');

// 分配角色
rbac.assignRole('penny', 'admin');
rbac.assignRole('dalia', 'editor');
rbac.assignRole('luna', 'viewer');

// 权限检查
console.log(rbac.hasPermission('penny', 'posts', 'delete')); // true ✅
console.log(rbac.hasPermission('dalia', 'posts', 'delete')); // false ✅
console.log(rbac.hasPermission('dalia', 'posts', 'write'));  // true ✅
console.log(rbac.hasPermission('luna', 'posts', 'write'));   // false ✅

console.log(rbac.getUserPermissions('penny'));
// [{ resource: 'posts', action: 'read' }, { resource: 'posts', action: 'write' }, ...]
```

### 手写题 2：实现简化版 Middleware

```js
/**
 * 简化版 Next.js Middleware
 * 支持路径匹配 + 鉴权 + 重定向
 */
function createMiddleware(rules) {
  /**
   * @param {Object} request - { pathname, cookies, headers }
   * @returns {Object|null} - 重定向对象或 null（放行）
   */
  return function middleware(request) {
    for (const rule of rules) {
      // 1. 路径匹配
      const pattern = new RegExp(
        '^' + rule.matcher.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$'
      );
      if (!pattern.test(request.pathname)) continue;

      // 2. 执行检查
      const result = rule.handler(request);

      // 3. 如果返回重定向，立即返回
      if (result?.redirect) return result;
    }

    // 4. 没有匹配到规则，放行
    return null;
  };
}

// 测试
const middleware = createMiddleware([
  {
    matcher: '/dashboard*',
    handler: (req) => {
      const token = req.cookies?.token;
      if (!token) return { redirect: '/login' };
      return null; // 放行
    },
  },
  {
    matcher: '/api/*',
    handler: (req) => {
      const apiKey = req.headers?.['x-api-key'];
      if (!apiKey) return { redirect: '/api/unauthorized' };
      return null;
    },
  },
]);

console.log(middleware({ pathname: '/dashboard', cookies: {} }));
// { redirect: '/login' }

console.log(middleware({ pathname: '/dashboard', cookies: { token: 'abc' } }));
// null (放行)

console.log(middleware({ pathname: '/about', cookies: {} }));
// null (不匹配，放行)

console.log(middleware({ pathname: '/api/users', headers: {} }));
// { redirect: '/api/unauthorized' }
```

---

## 💻 算法题

### 题 1：爬楼梯（#70）⭐

**思路**：经典 DP。`dp[i] = dp[i-1] + dp[i-2]`，即斐波那契数列。

```js
/**
 * @param {number} n
 * @return {number}
 * 时间复杂度：O(n) 空间复杂度：O(1) 优化后
 */
var climbStairs = function(n) {
  if (n <= 2) return n;

  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
};

console.log(climbStairs(2)); // 2
console.log(climbStairs(3)); // 3
console.log(climbStairs(5)); // 8
```

### 题 2：杨辉三角（#118）

**思路**：逐行构建。每行首尾为 1，中间元素 = 上一行对应两个元素之和。

```js
/**
 * @param {number} numRows
 * @return {number[][]}
 * 时间复杂度：O(n²) 空间复杂度：O(n²)
 */
var generate = function(numRows) {
  const result = [[1]];

  for (let i = 1; i < numRows; i++) {
    const prev = result[i - 1];
    const row = [1]; // 首位为 1

    for (let j = 1; j < i; j++) {
      row.push(prev[j - 1] + prev[j]);
    }

    row.push(1); // 末位为 1
    result.push(row);
  }

  return result;
};

console.log(generate(5));
// [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]
```

### 题 3：打家劫舍（#198）⭐

**思路**：DP。每间房子有两个选择：偷（dp[i-2] + nums[i]）或不偷（dp[i-1]）。

```js
/**
 * @param {number[]} nums
 * @return {number}
 * 时间复杂度：O(n) 空间复杂度：O(1) 优化后
 */
var rob = function(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  let prev2 = 0;       // dp[i-2]
  let prev1 = nums[0]; // dp[i-1]

  for (let i = 1; i < nums.length; i++) {
    const curr = Math.max(prev1, prev2 + nums[i]);
    //        不偷(i-1)  偷(i) + dp[i-2]
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
};

console.log(rob([1,2,3,1]));    // 4 (偷 1 + 3)
console.log(rob([2,7,9,3,1]));  // 12 (偷 2 + 9 + 1)
```

### 解法对比

| 题目 | 状态转移方程 | 关键理解 | 时间 | 空间 |
|------|------------|---------|------|------|
| 爬楼梯 | dp[i] = dp[i-1] + dp[i-2] | 斐波那契变体 | O(n) | O(1) |
| 杨辉三角 | row[j] = prev[j-1] + prev[j] | 逐行构建 | O(n²) | O(n²) |
| 打家劫舍 | dp[i] = max(dp[i-1], dp[i-2]+nums[i]) | 偷/不偷二选一 | O(n) | O(1) |

🔑 **DP 解题三步**：
1. 定义状态（dp[i] 代表什么？）
2. 写状态转移方程（dp[i] 怎么从前面推出来？）
3. 确定初始值和遍历方向

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| App Router | 文件夹即路由，嵌套布局自动持久化 | ⭐⭐⭐⭐⭐ |
| Pages vs App | App 支持 RSC、布局系统、流式渲染 | ⭐⭐⭐⭐ |
| Server Actions | 'use server' 声明，form action 直接调用 | ⭐⭐⭐⭐⭐ |
| Edge Runtime | 全球边缘节点，冷启动极快，Web API 子集 | ⭐⭐⭐ |
| Middleware | 运行在 Edge，每个请求执行，鉴权/重定向 | ⭐⭐⭐⭐ |
| RBAC | 用户 → 角色 → 权限，适合中小应用 | ⭐⭐⭐⭐⭐ |
| ABAC | 基于属性的动态策略，适合复杂企业场景 | ⭐⭐⭐⭐ |
| DP 基础 | 状态定义 → 转移方程 → 初始值，爬楼梯/打家劫舍 | ⭐⭐⭐⭐⭐ |

---

## 📌 第三阶段总结

恭喜完成第三阶段！🎉 这 7 天你掌握了：

| 天数 | 主题 | 核心收获 |
|------|------|---------|
| Day 14 | 阶段启动 | 模块化、组件化地基巩固 |
| Day 15 | Fiber & Hooks | Fiber 双缓冲链表、Hooks 链表结构、闭包陷阱 |
| Day 16 | React 18 新特性 | Concurrent Mode、useTransition、自动批处理 |
| Day 17 | RSC + AI Agent | 服务端组件边界、Function Calling、Agent 循环 |
| Day 18 | 状态管理 | Redux Toolkit、Zustand、TanStack Query |
| Day 19 | 性能优化 | memo/useMemo/useCallback、代码分割、虚拟列表 |
| Day 20 | Next.js + 系统设计 | App Router、Server Actions、RBAC/ABAC、DP 基础 |

**下一步建议**：
- 整理这 7 天的错题和薄弱点
- 准备第四阶段（工程化 & 性能调优）
- 每天花 30 分钟回顾手写题，确保能闭卷写出来
