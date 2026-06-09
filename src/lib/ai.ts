/* ============================================================
   AI 攻击引擎 — DeepSeek 集成 + 内置攻击载荷
   ============================================================ */

export type AttackType = 'xss' | 'sqli' | 'command-injection' | 'dom-xss' | 'idor';

export type AiAttackResult = {
  payload: string;
  source: 'deepseek' | 'fallback';
};

/* ── DeepSeek 提示词配置（攻击生成） ── */

const XSS_SYSTEM_PROMPT = `生成一句话 XSS payload，利用 innerHTML 触发 alert(1)。只返回 payload 本身，不要任何其他字符。`;

const XSS_USER_PROMPT = `返回一个 XSS payload，调用 alert(1)。`;

const SQLI_SYSTEM_PROMPT = `生成一行 SQL 注入 payload，绕过 WHERE id = 限制，使查询返回全部数据。只返回 payload 本身。`;

const SQLI_USER_PROMPT = `返回 SQL 注入 payload 使 WHERE id = 返回全部行。`;

const CMDI_SYSTEM_PROMPT = `生成一行命令注入 payload，通过 ping 读取 /etc/passwd。只返回 payload。`;

const CMDI_USER_PROMPT = `返回命令注入 payload 用于 ping 工具。`;

const DOM_XSS_SYSTEM_PROMPT = `生成一行属性注入 payload，闭合 src 属性注入 onerror 触发 alert(1)。只返回 payload。`;

const DOM_XSS_USER_PROMPT = `返回属性注入 payload: <img src="[输入]"> 闭合引号触发 alert。`;

const IDOR_SYSTEM_PROMPT = `场景：订单查询系统，当前用户 101，其他用户有 secret 订单。返回一个不属于用户 101 的 orderId 数字。只返回数字。`;

const IDOR_USER_PROMPT = `返回一个其他用户的 orderId 数字。`;

/* ── AI 导师提示词 ── */

const TUTOR_SYSTEM_PROMPT = `你是一位资深网络安全老师。请分析学生写的防御代码。你的任务是：
1. 指出代码中的潜在漏洞或逻辑错误
2. 提供一个引导性的思考方向，但不要直接给出完整的修复代码
3. 语气要像导师一样鼓励学生

如果代码已经很好地修复了漏洞，请先夸奖学生，然后建议直接点击"提交挑战"按钮。
请使用简洁的 Markdown 格式回复，每一条建议单独成行，用 **加粗** 标注关键词。`;

/* ── 战后复盘提示词 ── */

const POSTMORTEM_SYSTEM_PROMPT = `你是一位网络安全分析专家。学生的代码刚刚被攻击者突破了。

输入数据：学生的防御代码、攻击者使用的具体 Payload。
任务：
1. 解释为什么这个具体的 Payload 能够绕过当前的代码（例如：因为你只过滤了尖括号，但没处理引号）
2. 演示这个 Payload 在代码中是如何"生效"的
3. 给出修改建议

原则：保持专业且易懂，不要直接给出满分代码，要引导学生理解漏洞本质。`;

/* ── 内置回退攻击载荷（API 未配置时使用） ── */

const FALLBACK_PAYLOADS: Record<AttackType, string[]> = {
  xss: [
    `<img src=x onerror="alert(1)">`,
    `<svg onload="alert(1)">`,
    `<script>alert(1)</script>`,
    `<body onload="alert(1)">`,
    `<img src=x onerror="alert('XSS')">`,
    `<details open ontoggle="alert(1)">`,
  ],
  sqli: [
    `1 OR 1=1`,
    `2 OR 1=1`,
    `1 OR 1=1 --`,
    `1 UNION SELECT 1,2,3,4`,
    `1; SELECT * FROM users`,
    `999 OR 1=1`,
  ],
  'command-injection': [
    `; cat /etc/passwd`,
    `| cat /etc/passwd`,
    `; id`,
    `| whoami`,
  ],
  'dom-xss': [
    `x" onerror="alert(1)`,
    `x" onload="alert(1)`,
    `" onfocus="alert(1)" autofocus`,
    `x" onmouseover="alert(1)`,
    `" id="avatar" onerror="alert(1)`,
  ],
  idor: [
    `3`,
    `4`,
    `5`,
    `7`,
    `9`,
  ],
};

/* ── 内置回退导师提示（API 未配置时使用） ── */

const FALLBACK_HINTS: Record<string, string> = {
  xss:
    '**观察数据流**\n\n用户输入是怎么进入页面的？如果使用了 `innerHTML`，浏览器会把输入中的 `<` 和 `>` **解析为 HTML 标签**。试试用 `textContent` 代替它。\n\n如果坚持用 `innerHTML`，需要先将特殊字符转义：`<` → `&lt;`，`>` → `&gt;`。你当前的 `sanitize()` 对 `<>` 做了什么处理？',
  sqli:
    '**追踪输入路径**\n\n输入框的内容被直接拼进了 SQL 查询字符串。输入 `1 OR 1=1` 试试——这条语句在数据库中永远为 `true`，**会返回全部记录**。\n\n`parseInt()` 可以把输入转成纯数字，多余的 SQL 关键字会被自动丢弃。你的代码有对输入做类型校验吗？',
  idor:
    '**检查权限校验**\n\n函数 `getOrderById()` 只做了一个简单的查找——找到就返回，**完全没有检查订单的 `userId` 是否等于当前登录用户**。\n\n在返回订单之前加一个判断：如果 `order.userId !== CURRENT_USER.id`，应当拒绝访问（返回 `null`）。你当前的代码有这一步吗？',
};

/* ── 内置回退战后复盘（API 未配置时使用） ── */

const FALLBACK_POSTMORTEM: Record<string, string> = {
  xss:
    '**💡 漏洞分析：为什么这个 Payload 能绕过？**\n\n' +
    '你的代码只过滤了 `<script>` 标签，但攻击者使用了 `<img onerror>` 来执行 JavaScript，**完全绕过了你的过滤规则**。\n\n' +
    '**Payload 生效路径：**\n' +
    '```\n<img src="x" onerror="alert(1)">\n```\n' +
    '1. 浏览器解析到 `<img>` 标签\n' +
    '2. `src="x"` 是一个无效图片链接，加载失败\n' +
    '3. 浏览器触发 `onerror` 事件\n' +
    '4. `onerror="alert(1)"` 中的 JavaScript 被执行\n\n' +
    '**修改建议：** 不要用黑名单方式过滤特定标签（如只删 `<script>`）。应该对用户输入做*全面的 HTML 字符转义*（`<` → `&lt;`，`>` → `&gt;`，`"` → `&quot;`），或者使用 `textContent` 替代 `innerHTML`。',
  sqli:
    '**💡 漏洞分析：为什么这个 Payload 能绕过？**\n\n' +
    '你的代码直接将用户输入拼接到 SQL 查询字符串中：`"SELECT * FROM users WHERE id = " + id`。攻击者输入的 `1 OR 1=1` 使得查询变成 `WHERE id = 1 OR 1=1`。\n\n' +
    '**Payload 生效路径：**\n' +
    '```\n输入: 1 OR 1=1\n查询: SELECT * FROM users WHERE id = 1 OR 1=1\n```\n' +
    '由于 `1=1` 永远为真，数据库返回了**全部用户记录**，绕过了 ID 限制。\n\n' +
    '**修改建议：** 使用 `parseInt()` 将输入转为数字后再拼接。`parseInt("1 OR 1=1")` 只会返回 `1`，多余的 SQL 关键字会被自动丢弃。',
  idor:
    '**💡 漏洞分析：为什么这个 Payload 能绕过？**\n\n' +
    '你的 `getOrderById()` 函数只做了一件事——根据 `orderId` 查找订单并返回。**它完全没有检查这个订单属于谁**。\n\n' +
    '**Payload 生效路径：**\n' +
    '```\n输入 orderId = 3\nALL_ORDERS.find(o => o.id === 3) → 返回 userId=999 的订单\n→ 直接渲染到页面上\n```\n\n' +
    '**修改建议：** 在 `getOrderById()` 中返回数据之前，加一个 `userId` 比对：如果 `order.userId !== CURRENT_USER.id`，返回 `null` 拒绝访问。',
};

/* ── 公开 API：攻击载荷生成 ── */

/**
 * 为指定漏洞类型生成攻击载荷。
 * 配置了 NEXT_PUBLIC_DEEPSEEK_API_KEY 时会调用 DeepSeek API，
 * 否则使用内置回退载荷。
 */
export async function generateAttackPayload(type: AttackType): Promise<AiAttackResult> {
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const { system, user } = getAttackPrompts(type);
      const payload = await callDeepSeekAPI(system, user, apiKey, 120);
      if (payload) return { payload, source: 'deepseek' };
    } catch {
      // fall through
    }
  }

  return { payload: pickRandom(FALLBACK_PAYLOADS[type] ?? []), source: 'fallback' };
}

/* ── 公开 API：AI 导师提示 ── */

export type HintRequest = {
  levelTitle: string;
  objective: string;
  code: string;
};

export type HintResult = {
  hint: string;
  source: 'deepseek' | 'fallback';
};

/**
 * 分析玩家代码并返回引导性提示。
 * @param request 关卡 + 代码信息
 * @param attackContext 提供此参数时进入「战后复盘」模式，将攻击载荷一并发送给 AI
 */
export async function getHint(
  request: HintRequest,
  attackContext?: { attackPayload: string; attackType: string },
): Promise<HintResult> {
  const isPostmortem = !!attackContext;
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const system = isPostmortem ? POSTMORTEM_SYSTEM_PROMPT : TUTOR_SYSTEM_PROMPT;
      const userPrompt = isPostmortem
        ? buildPostmortemPrompt(request, attackContext!)
        : buildTutorPrompt(request);
      const result = await callDeepSeekAPI(system, userPrompt, apiKey, 800);
      if (result) return { hint: result, source: 'deepseek' };
    } catch {
      // fall through
    }
  }

  return {
    hint: isPostmortem ? getFallbackPostmortem(request) : getFallbackHint(request),
    source: 'fallback',
  };
}

/* ── 公开 API：AI 解题（直接给出修复代码） ── */

const SOLVE_SYSTEM_PROMPT = `你是一位网络安全导师。学生的代码存在安全漏洞，需要你给出修复方案。

任务：
1. 分析代码中的安全漏洞
2. 只输出**需要修改的核心函数/代码段**，不要输出整个 HTML 文件
3. 用 \`\`\`javascript 或 \`\`\`html 代码块包裹
4. 简要一行说明修复了什么

只输出关键修复代码，不要输出页面样式、HTML 结构等无关内容。`;

export async function getSolution(request: HintRequest): Promise<HintResult> {
  const apiKey = getApiKey();
  const userPrompt = `## 关卡\n\n**标题**: ${request.levelTitle}\n**目标**: ${request.objective}\n\n## 学生当前代码\n\n\`\`\`html\n${request.code}\n\`\`\`\n\n请给出需要修改的核心代码段（不要输出整个 HTML 文件）。`;

  if (apiKey) {
    try {
      const result = await callDeepSeekAPI(SOLVE_SYSTEM_PROMPT, userPrompt, apiKey, 1200);
      if (result) return { hint: result, source: 'deepseek' };
    } catch {
      // fall through
    }
  }

  // 取该关卡 solution 字段的前 300 字符作为回退
  return { hint: '请查看关卡自带的 `solution` 字段获取修复参考。', source: 'fallback' };
}

/* ── 提示词组装 ── */

function getAttackPrompts(type: AttackType): { system: string; user: string } {
  switch (type) {
    case 'xss':
      return { system: XSS_SYSTEM_PROMPT, user: XSS_USER_PROMPT };
    case 'sqli':
      return { system: SQLI_SYSTEM_PROMPT, user: SQLI_USER_PROMPT };
    case 'command-injection':
      return { system: CMDI_SYSTEM_PROMPT, user: CMDI_USER_PROMPT };
    case 'dom-xss':
      return { system: DOM_XSS_SYSTEM_PROMPT, user: DOM_XSS_USER_PROMPT };
    case 'idor':
      return { system: IDOR_SYSTEM_PROMPT, user: IDOR_USER_PROMPT };
  }
}

function buildTutorPrompt(request: HintRequest): string {
  return `## 当前关卡

**标题**: ${request.levelTitle}
**任务目标**: ${request.objective}

## 学生代码

\`\`\`html
${request.code}
\`\`\`

请分析这段代码的安全性，给出引导性建议。`;
}

function buildPostmortemPrompt(request: HintRequest, ctx: { attackPayload: string; attackType: string }): string {
  return `## 当前关卡

**标题**: ${request.levelTitle}
**任务目标**: ${request.objective}

## 学生编写的防御代码

\`\`\`html
${request.code}
\`\`\`

## 攻击者使用的 Payload

\`\`\`
${ctx.attackPayload}
\`\`\`

## 任务

学生的代码刚刚被这个 Payload 突破了。请分析：
1. **为什么**这个 Payload 能够绕过当前的防御代码？
2. 这个 Payload 在代码中是如何生效的？
3. 应该怎么修改才能防御这种攻击？

请给出专业且易懂的复盘分析。`;
}

/* ── DeepSeek API 通用调用 ── */

async function callDeepSeekAPI(
  system: string,
  user: string,
  apiKey: string,
  maxTokens: number,
): Promise<string | null> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) return null;

  const json: any = await res.json();
  const raw = json?.choices?.[0]?.message?.content?.trim();
  return raw ?? null;
}

/* ── 回退提示生成 ── */

function getFallbackHint(request: HintRequest): string {
  const text = (request.levelTitle + ' ' + request.objective).toLowerCase();

  if (text.includes('xss') || text.includes('cookie') || text.includes('留言')) {
    return FALLBACK_HINTS.xss;
  }
  if (text.includes('sqli') || text.includes('sql') || text.includes('注入') || text.includes('查询')) {
    return FALLBACK_HINTS.sqli;
  }
  if (text.includes('idor') || text.includes('越权') || text.includes('订单') || text.includes('权限')) {
    return FALLBACK_HINTS.idor;
  }

  return '**检查输入输出**\n\n仔细看看你的代码：用户输入经过了哪些处理？有没有直接拼接到敏感操作（DOM 写入、SQL 查询、文件读取）中？**永远不要信任用户的输入**。';
}

function getFallbackPostmortem(request: HintRequest): string {
  const text = (request.levelTitle + ' ' + request.objective).toLowerCase();
  if (text.includes('xss') || text.includes('cookie') || text.includes('留言')) return FALLBACK_POSTMORTEM.xss;
  if (text.includes('sqli') || text.includes('sql') || text.includes('注入') || text.includes('查询')) return FALLBACK_POSTMORTEM.sqli;
  if (text.includes('idor') || text.includes('越权') || text.includes('订单') || text.includes('权限')) return FALLBACK_POSTMORTEM.idor;
  return FALLBACK_POSTMORTEM.xss;
}

/* ── 工具 ── */

function getApiKey(): string | undefined {
  return typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
    : undefined;
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
