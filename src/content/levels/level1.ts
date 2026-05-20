import type { Level } from '@/types';

/**
 * 第一关：XSS 基础
 *
 * 场景：模拟留言板，player 需要实现 sanitize() 函数
 * 占位符 ___XSS_PAYLOAD___ 会在运行时被 AI 生成的攻击载荷替换
 */
export const level1: Level = {
  id: 'xss-basics',
  title: 'XSS 基础',
  description:
    '留言板系统存在跨站脚本漏洞，攻击者提交的恶意内容未经过滤直接渲染，可窃取用户信息。\n\n请在下方完善 sanitize() 函数，对输入进行过滤，防止 XSS 攻击。',
  initialCode: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>留言板</title>
  <style>
    body { font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; background: #f7f7f7; }
    h1 { color: #333; font-size: 22px; }
    .msg { background: #fff; padding: 12px 16px; margin: 8px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .msg small { color: #999; display: block; margin-top: 4px; }
    #input-area { margin: 16px 0; display: flex; gap: 8px; }
    #input-area input { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    #input-area button { padding: 8px 20px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    #input-area button:hover { background: #1557b0; }
  </style>
</head>
<body>
  <h1>📢 留言板</h1>
  <div id="msg-container"></div>

  <div id="input-area">
    <input id="msg-input" type="text" placeholder="输入留言..." value="" />
    <button onclick="postMessage()">发送</button>
  </div>

  <script>
    /* ============================================================
       安全挑战：完善 sanitize() 函数，过滤恶意 HTML/JavaScript
       ============================================================ */
    function sanitize(input) {
      // TODO: 在这里实现过滤，防止 XSS 攻击
      return input;  // 直接返回——漏洞！
    }

    /* ---------- 留言板逻辑 (不可修改) ---------- */
    function renderMessage(text) {
      var container = document.getElementById('msg-container');
      var div = document.createElement('div');
      div.className = 'msg';
      // ⚠ 漏洞：innerHTML + sanitize() 过滤不充分会导致 XSS
      div.innerHTML = sanitize(text);
      container.appendChild(div);
    }

    function postMessage() {
      var input = document.getElementById('msg-input');
      var text = input.value.trim();
      if (!text) return;
      renderMessage(text);
      input.value = '';
    }

    /* 模拟已有留言 (初始消息中包含攻击载荷) */
    renderMessage('欢迎来到留言板！');
    renderMessage('___XSS_PAYLOAD___');
    renderMessage('今天天气真不错 ☀️');
  </script>
</body>
</html>`,
  solution: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>留言板</title>
  <style>
    body { font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; background: #f7f7f7; }
    h1 { color: #333; font-size: 22px; }
    .msg { background: #fff; padding: 12px 16px; margin: 8px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .msg small { color: #999; display: block; margin-top: 4px; }
    #input-area { margin: 16px 0; display: flex; gap: 8px; }
    #input-area input { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    #input-area button { padding: 8px 20px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    #input-area button:hover { background: #1557b0; }
  </style>
</head>
<body>
  <h1>📢 留言板</h1>
  <div id="msg-container"></div>

  <div id="input-area">
    <input id="msg-input" type="text" placeholder="输入留言..." value="" />
    <button onclick="postMessage()">发送</button>
  </div>

  <script>
    /* 安全的 sanitize：将 HTML 特殊字符转义为实体 */
    function sanitize(input) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
      return String(input).replace(/[&<>"']/g, function (ch) { return map[ch]; });
    }

    function renderMessage(text) {
      var container = document.getElementById('msg-container');
      var div = document.createElement('div');
      div.className = 'msg';
      div.innerHTML = sanitize(text);
      container.appendChild(div);
    }

    function postMessage() {
      var input = document.getElementById('msg-input');
      var text = input.value.trim();
      if (!text) return;
      renderMessage(text);
      input.value = '';
    }

    renderMessage('欢迎来到留言板！');
    renderMessage('<img src=x onerror="alert(1)">');
    renderMessage('今天天气真不错 ☀️');
  </script>
</body>
</html>`,
  hint: "思考 HTML 特殊字符：`<` `>` `\"` `'` `&` 会被浏览器如何解析？尝试将它们转义为 HTML 实体。",
  vulnerabilityType: 'xss',
  difficulty: 'easy',
};
