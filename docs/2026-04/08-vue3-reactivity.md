# 04/08 — Vue 3 响应式原理（Day 8）

> **阶段**：第二阶段 Vue 3
> **今日目标**：深入理解 Vue 3 基于 Proxy 的响应式系统，手写 mini reactive
> **投入时间**：上午 2h / 下午 2h / 晚上 2h 算法

---

## 知识点 1：Proxy vs Object.defineProperty ⭐

### 1.1 Vue 2 的 defineProperty 局限

Vue 2 使用 `Object.defineProperty` 拦截属性的 getter/setter 实现响应式。它有三个硬伤：

| 问题 | 原因 | 影响 |
|------|------|------|
| 无法检测属性新增/删除 | defineProperty 只劫持已有属性 | 必须 `Vue.set` / `Vue.delete` |
| 无法拦截数组索引和长度 | 性能考虑未对数组下标劫持 | `arr[0] = 1` 不触发更新 |
| 需要递归遍历所有属性 | 初始化时深度遍历 | 大对象初始化性能差 |

```js
// ❌ Vue 2 无法检测新增属性
const obj = {}
Object.defineProperty(obj, 'name', {
  get() { return 'penny' },
  set(v) { console.log('set', v) }
})
obj.age = 21 // 不会触发任何 setter
delete obj.name // 不会触发任何通知
```

### 1.2 Vue 3 的 Proxy 优势

Proxy 代理整个对象，而非单个属性：

```js
// ✅ Vue 3 的 Proxy 可以拦截一切操作
const obj = {}
const p = new Proxy(obj, {
  get(target, key, receiver) {
    console.log(`读取 ${String(key)}`)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    console.log(`设置 ${String(key)} = ${value}`)
    return Reflect.set(target, key, value, receiver)
  },
  deleteProperty(target, key) {
    console.log(`删除 ${String(key)}`)
    return Reflect.deleteProperty(target, key)
  }
})

p.name = 'penny'  // 输出: 设置 name = penny
p.age = 21         // 输出: 设置 age = 21
delete p.name      // 输出: 删除 name
```

### 1.3 核心对比表

| 特性 | defineProperty (Vue 2) | Proxy (Vue 3) |
|------|----------------------|---------------|
| 新增属性检测 | ❌ 需要 Vue.set | ✅ 自动检测 |
| 删除属性检测 | ❌ | ✅ |
| 数组索引修改 | ❌ 需要重写数组方法 | ✅ |
| 数组 length 修改 | ❌ | ✅ |
| Map/Set/WeakMap | ❌ 不支持 | ✅ |
| 初始化性能 | ❌ 递归遍历所有属性 | ✅ 惰性代理，访问时才递归 |
| 兼容性 | IE9+ | 不支持 IE |

### 1.4 ⚠️ Proxy 的惰性代理

Vue 3 中 `reactive()` 不会在初始化时递归创建深层代理，而是**惰性的**——只有访问到深层属性时才创建该层的 Proxy：

```js
const state = reactive({
  user: { name: 'penny', profile: { age: 21 } }
})
// 此时只有 state 被代理
// 访问 state.user 时，user 才被代理
// 访问 state.user.profile 时，profile 才被代理
console.log(state.user.profile.age) // 21 — 此时 profile 才创建 Proxy
```

### 1.5 Reflect 的作用 ⭐

Proxy 的 handler 中必须配合 `Reflect` 使用，原因：

```js
const obj = { name: 'penny', get greeting() { return `hi ${this.name}` } }

// ❌ 不用 Reflect — this 指向原对象，丢失代理能力
const badProxy = new Proxy(obj, {
  get(target, key) {
    return target[key] // greeting 中的 this 是 target，不会被追踪
  }
})

// ✅ 用 Reflect — receiver 是代理对象，this 正确指向代理
const goodProxy = new Proxy(obj, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver) // greeting 中 this 是 goodProxy
  }
})
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| Vue 3 为什么用 Proxy 替代 defineProperty？ | Proxy 可拦截 13 种操作（增删改查、in、for...in），惰性代理性能更好，支持 Map/Set 等新数据结构 |
| Proxy 不能 polyfill，Vue 3 如何处理兼容？ | Vue 3 从 3.x 开始已放弃 IE 支持；若需 IE，可使用 `@vue/compat` 构建 |
| Reflect 的必要性？ | 保证 getter/setter 中的 `this` 指向代理对象而非原始对象，正确触发依赖收集 |
| Proxy 的缺点？ | 无法 polyfill（语言层面限制），不支持 IE11 |

---

## 知识点 2：reactive / ref / effect 源码追踪 ⭐

### 2.1 reactive() — 深层响应式

`reactive()` 创建一个对象的深层响应式代理：

```ts
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  user: { name: 'penny', age: 21 }
})

// 读取 → 触发 track（依赖收集）
console.log(state.count) // 0

// 修改 → 触发 trigger（触发更新）
state.count++
console.log(state.count) // 1

// 深层属性也是响应式的
state.user.age = 22 // 触发更新
```

⚠️ **限制**：`reactive()` 只能代理对象（Object/Array/Map/Set），不能代理原始值：

```js
const num = reactive(0) // ❌ warn: value cannot be made reactive: 0
```

### 2.2 ref() — 原始值响应式

`ref()` 通过 `.value` 包装原始值，内部对 `.value` 做 getter/setter 拦截：

```ts
import { ref } from 'vue'

const count = ref(0)

console.log(count.value) // 0 — 读取触发 track
count.value++
console.log(count.value) // 1 — 修改触发 trigger

// ref 传入对象时，内部调用 reactive()
const obj = ref({ name: 'penny' })
console.log(obj.value.name) // 'penny' — 深层响应式
```

⚠️ **模板中自动解包**：在 `<template>` 中 ref 会自动解包，不需要 `.value`：

```vue
<template>
  <p>{{ count }}</p>  <!-- ✅ 自动解包 -->
</template>

<script setup>
const count = ref(0)
console.log(count.value) // JS 中必须用 .value
</script>
```

⚠️ **集合类型中不自动解包**：

```js
const list = reactive([ref(1)])
console.log(list[0])     // { value: 1 } — 不自动解包
console.log(list[0].value) // 1 — 需要 .value

const map = reactive(new Map([['count', ref(0)]]))
console.log(map.get('count')) // { value: 0 } — 不自动解包
```

### 2.3 effect() — 副作用函数

`effect()` 是响应式系统的核心调度器。当 effect 中读取了响应式数据，就会自动收集依赖；数据变化时，effect 自动重新执行：

```ts
import { reactive, effect } from 'vue'

const state = reactive({ count: 0 })

effect(() => {
  // 读取 state.count → 自动收集依赖
  console.log('count is:', state.count)
})
// 立即执行一次 → 输出: count is: 0

state.count = 5
// 自动重新执行 → 输出: count is: 5
```

### 2.4 源码核心流程（简化）

```
reactive(obj)
  → 创建 Proxy(target, handler)
    → handler.get → track(target, key)  // 依赖收集
    → handler.set → trigger(target, key) // 触发更新

ref(value)
  → 创建 RefImpl { get value(){ track }, set value(){ trigger } }
  → 如果 value 是对象 → reactive(value)

effect(fn)
  → 执行 fn → fn 中读取响应式数据 → 触发 track → 存储 effect
  → 响应式数据变化 → trigger → 执行 effect.fn
```

### 2.5 computed() 缓存机制 ⭐

`computed()` 内部基于 effect 实现，但有缓存——只有依赖变化时才重新计算：

```ts
import { ref, computed } from 'vue'

const count = ref(1)
const double = computed(() => {
  console.log('computed 执行了') // 只在 count 变化时打印
  return count.value * 2
})

console.log(double.value) // 2, 输出: computed 执行了
console.log(double.value) // 2, 不会再执行 computed — 使用缓存
count.value = 5
console.log(double.value) // 10, 输出: computed 执行了 — 依赖变了才重算
```

源码关键：`computed` 内部有 `_dirty` 标志位：

```
依赖变化 → _dirty = true（标记为脏）
访问 .value → 如果 _dirty === true → 重新计算 → _dirty = false
访问 .value → 如果 _dirty === false → 返回缓存值
```

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| ref 和 reactive 的区别？ | ref 可包装原始值（通过 .value），reactive 只能代理对象；ref 在模板中自动解包，reactive 不需要 .value |
| 什么时候用 ref 什么时候用 reactive？ | 原始值用 ref，对象/数组优先用 reactive；解构时用 ref + toRefs 保持响应式 |
| computed 的缓存如何实现？ | 内部 `_dirty` 标志位，依赖变化时标记为 true，访问时才重新计算 |
| watch 和 effect 的区别？ | effect 立即执行 + 自动追踪依赖；watch 显式指定依赖 + 可获取新旧值 + 支持 deep/flush 配置 |

---

## 知识点 3：依赖收集（track）与触发更新（trigger）流程 ⭐

### 3.1 核心数据结构

Vue 3 的依赖收集使用三层 Map 结构：

```
targetMap: WeakMap<Object, Map<Key, Set<Effect>>>
             ↑ 原始对象     ↑ 属性名    ↑ 副作用集合
```

```js
// 数据结构示意
const targetMap = new WeakMap()

// 对于 state = reactive({ count: 0, name: 'penny' })
// targetMap.get(state) → Map {
//   'count' → Set { effect1, effect2 },
//   'name'  → Set { effect3 }
// }
```

### 3.2 track() — 依赖收集

```js
let activeEffect = null // 当前活跃的 effect

function track(target, key) {
  if (!activeEffect) return // 没有活跃 effect，不收集

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  dep.add(activeEffect) // 收集当前 effect
  activeEffect.deps.push(dep) // 反向记录，用于清理
}
```

### 3.3 trigger() — 触发更新

```js
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)
  if (effects) {
    // 创建新 Set 避免无限循环
    const effectsToRun = new Set(effects)
    effectsToRun.forEach(effect => {
      effect.scheduler
        ? effect.scheduler(effect) // 有调度器时调用调度器
        : effect()                  // 否则直接执行
    })
  }
}
```

### 3.4 完整调用流程

```
effect(() => {      ← 1. 创建 effect，执行 fn
  console.log(state.count)  ← 2. 读取 state.count，触发 Proxy.get
})
                            ← 3. Proxy.get 调用 track(target, 'count')
                            ← 4. track 将当前 activeEffect 存入 dep

state.count++      ← 5. 修改值，触发 Proxy.set
                   ← 6. Proxy.set 调用 trigger(target, 'count')
                   ← 7. trigger 遍历 dep，执行所有 effect
                   ← 8. effect 重新执行 fn → 又触发 track（更新依赖）
```

### 3.5 ⚠️ 分支切换问题与 cleanup

当 effect 中有条件分支时，旧依赖需要清理：

```js
const state = reactive({ ok: true, text: 'hello' })

effect(() => {
  document.body.innerText = state.ok ? state.text : 'not ok'
})
// 此时 effect 依赖了 state.ok 和 state.text

state.ok = false // 切换分支后，state.text 不再被读取
// 但如果不清除旧依赖，修改 state.text 仍会触发 effect 重跑 → 浪费
```

Vue 3 通过 **effect.deps** 数组实现 cleanup：每次 effect 执行前，先清理所有旧依赖，执行时重新收集。

### 面试 Q&A

| 问题 | 答案要点 |
|------|---------|
| track 和 trigger 的数据结构？ | WeakMap → Map → Set 三层结构，WeakMap 防止内存泄漏 |
| 为什么用 WeakMap？ | key 是对象，当对象被 GC 时，WeakMap 中的引用自动释放，不会内存泄漏 |
| 副作用执行顺序如何控制？ | effectOptions.scheduler 可自定义调度（如 nextTick 批量更新、computed 惰性求值） |
| computed 是 effect 吗？ | 是，但是一个懒执行的 effect（lazy option），只在 .value 被访问时才执行 |

---

## 🔧 手写题（2 道）

### 手写题 1：mini reactive 系统

```js
/**
 * 手写 Vue 3 mini reactive 系统
 * 包含：reactive、effect、track、trigger
 */

// 1. 全局变量
let activeEffect = null
const effectStack = [] // effect 栈，处理嵌套 effect
const targetMap = new WeakMap()

// 2. effect — 副作用函数
/**
 * 创建一个响应式副作用
 * @param {Function} fn - 副作用函数
 * @param {Object} options - { lazy, scheduler }
 * @returns {Function} effect runner
 */
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn) // 3. 执行前清理旧依赖
    activeEffect = effectFn
    effectStack.push(effectFn)
    const result = fn() // 执行原始函数，触发 track
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return result
  }
  effectFn.deps = []
  effectFn.options = options

  if (!options.lazy) {
    effectFn() // 非惰性则立即执行
  }
  return effectFn
}

// 3. cleanup — 清理旧依赖
/**
 * 清理 effect 与所有 dep 的关联
 * @param {Function} effectFn
 */
function cleanup(effectFn) {
  effectFn.deps.forEach(dep => dep.delete(effectFn))
  effectFn.deps.length = 0
}

// 4. track — 依赖收集
/**
 * 收集当前活跃 effect 作为依赖
 * @param {Object} target
 * @param {string|symbol} key
 */
function track(target, key) {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

// 5. trigger — 触发更新
/**
 * 触发与 target[key] 关联的所有 effect
 * @param {Object} target
 * @param {string|symbol} key
 * @param {string} type - 'SET' | 'ADD' | 'DELETE'
 */
function trigger(target, key, type = 'SET') {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = new Set()

  // 收集要执行的 effect
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach(effectFn => {
      // 避免 effect 中修改自身导致无限循环
      if (effectFn !== activeEffect) {
        effects.add(effectFn)
      }
    })
  }

  // 如果是新增/删除属性，触发与 ITERATE_KEY 关联的 effect（for...in）
  if (type === 'ADD' || type === 'DELETE') {
    const iterateDep = depsMap.get(ITERATE_KEY)
    if (iterateDep) {
      iterateDep.forEach(effectFn => {
        if (effectFn !== activeEffect) {
          effects.add(effectFn)
        }
      })
    }
  }

  effects.forEach(effectFn => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

const ITERATE_KEY = Symbol('iterate')

// 6. reactive — 创建响应式对象
/**
 * 将对象转为响应式代理
 * @param {Object} target
 * @returns {Proxy}
 */
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      if (key === '__raw') return target // 暴露原始对象

      track(target, key)

      const result = Reflect.get(target, key, receiver)
      // 惰性代理：对象值访问时才创建深层代理
      if (typeof result === 'object' && result !== null) {
        return reactive(result)
      }
      return result
    },

    set(target, key, value, receiver) {
      const oldValue = target[key]
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.set(target, key, value, receiver)

      // 避免 NaN === NaN 的误触发
      if (oldValue !== value && (oldValue === oldValue || value === value)) {
        const type = hadKey ? 'SET' : 'ADD'
        trigger(target, key, type)
      }

      return result
    },

    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)

      if (hadKey && result) {
        trigger(target, key, 'DELETE')
      }

      return result
    },

    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    },

    ownKeys(target) {
      track(target, ITERATE_KEY) // 收集 for...in 的依赖
      return Reflect.ownKeys(target)
    }
  })
}

// 7. ref — 原始值响应式
/**
 * 将值包装为响应式 ref
 * @param {*} value
 * @returns {{ value: * }}
 */
function ref(value) {
  if (isRef(value)) return value

  const wrapper = {
    get value() {
      track(wrapper, 'value')
      return value
    },
    set value(newVal) {
      if (newVal !== value) {
        value = newVal
        trigger(wrapper, 'value')
      }
    }
  }

  Object.defineProperty(wrapper, '__isRef', { value: true })
  return wrapper
}

function isRef(val) {
  return !!(val && val.__isRef)
}

// 8. computed — 惰性求值 + 缓存
/**
 * 创建计算属性
 * @param {Function} getter
 * @returns {{ value: * }}
 */
function computed(getter) {
  let value
  let dirty = true

  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true
        trigger(obj, 'value') // 触发依赖 computed 的 effect
      }
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value') // 收集谁在读 computed
      return value
    }
  }

  return obj
}

// ====== 测试用例 ======
console.log('===== 测试 reactive + effect =====')
const state = reactive({ count: 0, name: 'penny' })

effect(() => {
  console.log('effect1: count =', state.count) // 首次: 0, 后续: 1
})

state.count = 1
// 输出: effect1: count = 1

console.log('===== 测试嵌套对象惰性代理 =====')
const nested = reactive({ user: { age: 21 } })
effect(() => {
  console.log('age =', nested.user.age) // 首次: 21, 后续: 22
})
nested.user.age = 22

console.log('===== 测试 ref =====')
const count = ref(0)
effect(() => {
  console.log('ref count =', count.value) // 首次: 0, 后续: 1
})
count.value = 1

console.log('===== 测试 computed =====')
const num = ref(1)
const double = computed(() => {
  console.log('computed 执行')
  return num.value * 2
})
console.log('double =', double.value) // computed 执行, double = 2
console.log('double =', double.value) // double = 2 (缓存，不打印 computed 执行)
num.value = 5
// computed 脏标记重置，但不立即执行
console.log('double =', double.value) // computed 执行, double = 10

console.log('===== 测试分支切换清理 =====')
const branch = reactive({ ok: true, text: 'hello' })
let callCount = 0
effect(() => {
  callCount++
  console.log('branch result:', branch.ok ? branch.text : 'no')
})
console.log('callCount:', callCount) // 1
branch.ok = false // 切换分支
console.log('callCount:', callCount) // 2
branch.text = 'world' // text 不再是依赖，不应触发
console.log('callCount:', callCount) // 2 — 没有增加，说明清理成功
```

### 手写题 2：toRefs — 解构保持响应式

```js
/**
 * 将 reactive 对象的每个属性转为 ref，解构后保持响应式
 * @param {Object} proxy - reactive 对象
 * @returns {Object} - 每个属性都是 ref
 */
function toRefs(proxy) {
  const result = {}
  const raw = proxy.__raw || proxy

  for (const key in raw) {
    result[key] = new Proxy(
      { _value: raw[key] },
      {
        get() {
          return proxy[key] // 读取时委托给 reactive 代理 → 触发 track
        },
        set(value) {
          proxy[key] = value // 写入时委托给 reactive 代理 → 触发 trigger
        }
      }
    )
  }

  return result
}

// ====== 测试用例 ======
const state = reactive({ count: 0, name: 'penny' })
const { count, name } = toRefs(state)

effect(() => {
  console.log('count =', count.value, 'name =', name.value)
  // 首次: count = 0 name = penny
})

state.count = 10
// 输出: count = 10 name = penny

count.value = 20
// 输出: count = 20 name = penny
console.log(state.count) // 20 — 双向同步
```

---

## 💻 算法题

### LeetCode #2 — 两数相加

**思路**：遍历两个链表，逐位相加，记录进位。

| 解法 | 时间复杂度 | 空间复杂度 | 说明 |
|------|-----------|-----------|------|
| 迭代法 | O(max(m,n)) | O(max(m,n)) | 一次遍历，新建链表 |
| 递归法 | O(max(m,n)) | O(max(m,n)) | 栈空间为链表长度 |

```js
/**
 * 两数相加 — 两个链表表示逆序数字，返回相加后的链表
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 * 时间复杂度 O(max(m,n))，空间复杂度 O(max(m,n))
 */
function addTwoNumbers(l1, l2) {
  const dummy = new ListNode(0)
  let curr = dummy
  let carry = 0

  while (l1 || l2 || carry) {
    const sum = (l1?.val || 0) + (l2?.val || 0) + carry
    carry = Math.floor(sum / 10)
    curr.next = new ListNode(sum % 10)
    curr = curr.next
    l1 = l1?.next
    l2 = l2?.next
  }

  return dummy.next
}
```

### LeetCode #160 — 相交链表

**思路**：双指针法 — A 走完跳到 B 头，B 走完跳到 A 头，相遇即为交点。

| 解法 | 时间复杂度 | 空间复杂度 | 说明 |
|------|-----------|-----------|------|
| 哈希法 | O(m+n) | O(m) | 存 A 所有节点，遍历 B 查找 |
| 双指针 ⭐ | O(m+n) | O(1) | 最优解，面试首选 |

```js
/**
 * 相交链表 — 找两个链表的第一个公共节点
 * @param {ListNode} headA
 * @param {ListNode} headB
 * @return {ListNode}
 * 时间复杂度 O(m+n)，空间复杂度 O(1)
 */
function getIntersectionNode(headA, headB) {
  if (!headA || !headB) return null

  let pA = headA
  let pB = headB

  // A 走完跳到 B 头，B 走完跳到 A 头
  // 走到相遇时，要么是交点，要么都是 null
  while (pA !== pB) {
    pA = pA ? pA.next : headB
    pB = pB ? pB.next : headA
  }

  return pA
}
```

### LeetCode #23 — 合并 K 个升序链表

**思路**：最小堆/分治法。分治法将 K 个链表两两合并，类似归并排序。

| 解法 | 时间复杂度 | 空间复杂度 | 说明 |
|------|-----------|-----------|------|
| 暴力合并 | O(kN) | O(1) | 每次取最小头节点 |
| 最小堆 | O(N log k) | O(k) | 维护 k 个节点的堆 |
| 分治法 ⭐ | O(N log k) | O(log k) | 两两合并，递归深度 log k |

```js
/**
 * 合并 K 个升序链表 — 分治法
 * @param {ListNode[]} lists
 * @return {ListNode}
 * 时间复杂度 O(N log k)，空间复杂度 O(log k)
 */
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null
  return merge(lists, 0, lists.length - 1)
}

function merge(lists, left, right) {
  if (left === right) return lists[left]
  const mid = (left + right) >> 1
  const l1 = merge(lists, left, mid)
  const l2 = merge(lists, mid + 1, right)
  return mergeTwoLists(l1, l2)
}

function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0)
  let curr = dummy
  while (l1 && l2) {
    if (l1.val <= l2.val) {
      curr.next = l1
      l1 = l1.next
    } else {
      curr.next = l2
      l2 = l2.next
    }
    curr = curr.next
  }
  curr.next = l1 || l2
  return dummy.next
}
```

---

## 📝 今日总结

| 知识点 | 核心要点 | 面试频率 |
|--------|---------|---------|
| Proxy vs defineProperty | Proxy 可拦截 13 种操作，惰性代理性能好，支持 Map/Set | ⭐⭐⭐⭐⭐ |
| reactive 实现 | Proxy handler + track/trigger，惰性深层代理 | ⭐⭐⭐⭐⭐ |
| ref 实现 | 包装 .value 的 getter/setter，对象内部用 reactive | ⭐⭐⭐⭐ |
| effect 实现 | activeEffect 全局变量 + effectStack 处理嵌套 | ⭐⭐⭐⭐⭐ |
| track/trigger 流程 | WeakMap→Map→Set 三层结构，cleanup 解决分支切换 | ⭐⭐⭐⭐⭐ |
| computed 缓存 | _dirty 标志位 + scheduler，依赖变化标记脏 | ⭐⭐⭐⭐ |

---

## 📌 明天预告（Day 9）

明天进入**编译优化与虚拟 DOM**，学习 Vue 3 的 PatchFlag、静态提升、Block Tree 等编译时优化，以及 Diff 算法的改进。这些都是面试高频题，准备好 🚀
