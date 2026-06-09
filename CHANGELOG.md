# Changelog

## v0.3.0 — UI 全面升级 + AI 导师系统 (未发布)

### 新增组件
- **IntelligenceDashboard** — 情报面板，左侧显示任务目标，右侧展示「受保护的数据箱」，
  支持 idle / pending / hacked / secure 四态动画反馈（data-breached 抖动 + 红框）
- **AttackResult** — 攻防回放区，替代原 Terminal 组件。分三块：AI 攻击载荷展示、
  执行结果大字体（💥 漏洞已被触发 / 🛡️ 防御成功）、日志流（max-h-[30vh] 独立滚动）
- **TutorSuggestion** — 导师建议面板，支持引导提示 / 战后复盘 / 解题答案三种模式，
  滑动展开动画，内容区 max-h-[50vh] 可滚动

### 新功能
- **AI 导师系统**
  - 引导提示（`getHint`）：分析当前代码，给出引导性建议（不直接给答案）
  - 战后复盘（`getHint` + attackContext）：传入失败的 Payload，AI 解释为何绕过并给出修复方向
  - AI 解题（`getSolution`）：输出核心修复代码段（不输出整个 HTML）
  - 三个功能均支持 DeepSeek API 或内置回退库
- **战后复盘呼吸灯**：防御失败后「获取提示」按钮变为脉冲 + 琥珀色发光，文字变为「战后复盘」
- **开发者模式**：侧边栏标题旁 DEV 按钮，一键解锁全部关卡

### 关卡重写
- **第一关** (XSS 基础) — 重写为留言板场景，玩家需实现 `sanitize()` 过滤 HTML 实体
- **第二关** (SQL 注入) — 由 PHP 代码改为 JS 模拟后台用户查询系统，修复 `parseInt` 数字校验
- **第三关** (命令注入 → 权限迷宫：越权访问)
  - 替换原命令注入关卡为 IDOR 越权访问挑战
  - 场景：订单查询系统，修复 `getOrderById()` 的 userId 归属校验

### Level 类型扩展
- 新增 `vulnerabilityType` — 支持 xss / sqli / dom-xss / idor / command-injection
- 新增 `difficulty` — easy / medium / hard
- 新增 `objective` — 任务目标描述，展示在情报面板
- 新增 `protectedInfo` — 受保护数据描述，展示在数据箱

### UI 增强
- **侧边栏** — 漏洞类型彩色徽章 + 三色难度指示灯，宽度扩展至 w-64
- **编辑器** — 新增「获取提示」(+呼吸灯)、「解题」紫色按钮
- **操作栏** — 统一「开始挑战」脉冲按钮，攻击后变为「再次攻击」
- **布局优化**
  - 全组件 `min-h-0` flex 体系，防止 flex 子元素挤压
  - Split view `min-h-[55vh]`，不被上方导师面板压扁
  - `<main>` overflow-y-auto，内容超出时自然滚动
  - 自定义 scrollbar 样式
- **动画** — `data-breached`（红框抖动）、`glow-pulse`（绿色呼吸光晕）自定义关键帧

### 其他
- Tailwind 配置扩展：hacker 色系、glow 阴影、data-breached 动画
- 法官脚本重写，改用字符串数组拼接，根除模板字面量语法错误
- 更新 AI 攻击提示词，精简为单行指令，减少冗长输出

---

## v0.2.0 — 安全沙箱 + AI 攻击引擎 (2025-06-09)

`bc2f860`

### 新增核心组件

- **Sandbox 沙箱组件** (`src/components/Sandbox.tsx`)
  - iframe 隔离渲染，`sandbox="allow-scripts"`（无 `allow-same-origin` 防 AI 攻击主站）
  - 法官脚本注入：劫持 `alert/prompt/confirm`、`window.onerror`、`MOCK_DB`、`MutationObserver`
  - postMessage 跨域通信，1.2s 判定窗口
  - 攻击命中：边框闪红 + HACKED 状态 + 攻击详情条
  - 防御成功：SECURE 标签，自动解锁下一关

- **AI 攻击引擎** (`src/lib/ai.ts`)
  - DeepSeek API 集成（`deepseek-v4-flash`），OpenAI 兼容格式
  - 攻击类型：xss / sqli / command-injection / dom-xss / idor
  - 配置提示词：DeepSeek API Key → `NEXT_PUBLIC_DEEPSEEK_API_KEY`
  - 无 Key 时自动回落至内置载荷库
  - 攻击生成支持 DeepSeek / 内置库双来源

- **法官脚本** (`src/lib/judgeScript.ts`)
  - `buildJudgeScript(attackPayload?)` 生成注入代码
  - 劫持 alert/prompt/confirm → 上报 ATTACK_DETECTED
  - MOCK_DB 对象模拟 SQL 查询 + 注入检测
  - `window.__ATTACK_PAYLOAD__` 全局暴露供关卡消费
  - URLSearchParams 劫持用于 XSS 注入模拟

### 关卡实现

- **第一关** (XSS 基础)：留言板 innerHTML 漏洞，`___XSS_PAYLOAD___` 占位符替换
- **第二关** (SQL 注入)：PHP 代码展示拼接漏洞
- **第三关** (命令注入)：Ping 工具注入

### UI

- 操作栏：开始挑战 / 再次攻击 按钮
- 终端日志 INFO/WARN/ERROR 三色分级
- Sidebar 关卡导航 + 锁定/完成/活跃状态

---

## v0.1.0 — 项目初始化 + UI 框架 (2025-06-09)

`b017d92` `4d9953e` `9932b8e` `0971a6e`

### 项目初始化
- Next.js 14 + TypeScript + Tailwind CSS 初始化
- 目录结构：Editor、Sidebar、Terminal 占位组件
- Level 类型定义、AI 工具骨架

### Hacker/Cyberpunk UI 框架
- 暗色主题全局样式（hacker-bg, hacker-accent, hacker-surface 色系）
- Tailwind 自定义颜色 + JetBrains Mono 字体
- 4 核心组件：Editor（代码编辑）、Preview（iframe 预览）、Sidebar（导航）、Terminal（日志）

### 关卡系统
- Level 类型：id, title, description, initialCode, solution, hint
- level1 (XSS 基础) — 留言板 innerHTML
- 关卡解锁逻辑：初始只解锁第一关，完成后解锁后续
