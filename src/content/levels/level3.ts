import type { Level } from '@/types';

/**
 * 第三关：DOM 型 XSS 进阶 — 属性注入
 *
 * 场景：动态头像加载，URL 通过字符串拼接注入到 <img> 标签的 src 属性
 * 漏洞：只过滤了 <script> 标签，但忽略了属性注入
 * 攻击演示：x" onerror="alert(1) 闭合 src 的双引号并注入 onerror 事件
 * 防御要点：不要用 innerHTML 拼接属性，或转义引号
 */
export const level3: Level = {
  id: 'dom-xss-advanced',
  title: 'DOM XSS 进阶',
  description:
    '动态头像加载功能存在属性注入漏洞。URL 通过字符串拼接注入到 <img> 标签的 src 属性中。\n\n你已学会过滤 <script> 标签，但攻击者还有更隐蔽的方式… 请修复 sanitizeUrl() 函数，彻底防御 XSS。',
  initialCode: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>动态头像加载</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f0f2f5; color: #333; }
    .container { max-width: 520px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 20px; display: flex; align-items: center; gap: 8px; }
    .card { background: #fff; border-radius: 12px; margin-top: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .card-body { padding: 24px; }
    .avatar-wrapper { display: flex; justify-content: center; margin-bottom: 20px; }
    .avatar-placeholder { width: 120px; height: 120px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 13px; overflow: hidden; }
    .avatar-placeholder img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .input-row { display: flex; gap: 8px; }
    .input-row input { flex: 1; padding: 9px 14px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 14px; outline: none; }
    .input-row input:focus { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124,58,237,.15); }
    .input-row button { padding: 9px 20px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; white-space: nowrap; }
    .input-row button:hover { background: #6d28d9; }
    .note { font-size: 12px; color: #999; margin-top: 8px; }
    .code-hint { background: #faf5ff; border-left: 3px solid #7c3aed; padding: 10px 14px; border-radius: 4px; font-size: 12px; color: #6b21a8; margin-bottom: 16px; }
    .code-hint code { background: #ede9fe; padding: 1px 5px; border-radius: 3px; font-size: 11px; }
    .status-bar { margin-top: 12px; padding: 10px 14px; border-radius: 6px; font-size: 12px; display: none; }
    .status-bar.error { display: block; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .status-bar.success { display: block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>👤 用户头像</h1>
    <p style="color:#888;font-size:13px;margin-top:4px;">输入图片 URL，即时预览头像</p>

    <div class="card">
      <div class="card-body">
        <div class="code-hint">
          💡 当前过滤规则：只移除 <code>&lt;script&gt;</code> 标签 — 你觉得够安全吗？
        </div>

        <div class="avatar-wrapper">
          <div id="avatarContainer" class="avatar-placeholder">
            <span>暂无头像</span>
          </div>
        </div>

        <div class="input-row">
          <input id="avatarUrl" type="text" placeholder="例：https://example.com/avatar.jpg" />
          <button onclick="loadAvatar()">加载</button>
        </div>
        <p class="note">支持 JPG / PNG / GIF 格式的图片链接</p>

        <div id="statusBar" class="status-bar"></div>
      </div>
    </div>
  </div>

  <script>
    /* ============================================================
       安全挑战：修复 sanitizeUrl()，防止属性注入
       你已经知道过滤 <script> 标签，但攻击者还有更隐蔽的方式！
       ============================================================ */

    // 当前过滤：只移除 <script> 标签 — 完全不夠！
    function sanitizeUrl(url) {
      return url.replace(/<script\\s*>/gi, '').replace(/<\\/script\\s*>/gi, '');
    }

    function loadAvatar() {
      var url = document.getElementById('avatarUrl').value.trim();
      var container = document.getElementById('avatarContainer');
      var statusBar = document.getElementById('statusBar');

      if (!url) {
        statusBar.className = 'status-bar error';
        statusBar.textContent = '⚠ 请输入图片 URL';
        return;
      }

      statusBar.className = 'status-bar';

      // ⚠ 漏洞：使用 innerHTML 拼接字符串到 HTML 属性中
      // 即使过滤了 <script>，攻击者仍可通过闭合引号注入事件处理器
      container.innerHTML = '<img src="' + sanitizeUrl(url) + '" class="avatar" alt="用户头像">';
    }

    /* 如果裁判脚本注入了攻击载荷，自动执行 */
    if (window.__ATTACK_PAYLOAD__) {
      setTimeout(function() {
        document.getElementById('avatarUrl').value = window.__ATTACK_PAYLOAD__;
        loadAvatar();
      }, 300);
    }
  </script>
</body>
</html>`,
  solution: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>动态头像加载</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f0f2f5; color: #333; }
    .container { max-width: 520px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 20px; display: flex; align-items: center; gap: 8px; }
    .card { background: #fff; border-radius: 12px; margin-top: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .card-body { padding: 24px; }
    .avatar-wrapper { display: flex; justify-content: center; margin-bottom: 20px; }
    .avatar-placeholder { width: 120px; height: 120px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 13px; overflow: hidden; }
    .avatar-placeholder img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .input-row { display: flex; gap: 8px; }
    .input-row input { flex: 1; padding: 9px 14px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 14px; outline: none; }
    .input-row input:focus { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124,58,237,.15); }
    .input-row button { padding: 9px 20px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; white-space: nowrap; }
    .input-row button:hover { background: #6d28d9; }
    .note { font-size: 12px; color: #999; margin-top: 8px; }
    .status-bar { margin-top: 12px; padding: 10px 14px; border-radius: 6px; font-size: 12px; display: none; }
    .status-bar.error { display: block; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .status-bar.success { display: block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>👤 用户头像</h1>
    <p style="color:#888;font-size:13px;margin-top:4px;">输入图片 URL，即时预览头像</p>

    <div class="card">
      <div class="card-body">
        <div class="avatar-wrapper">
          <div id="avatarContainer" class="avatar-placeholder">
            <span>暂无头像</span>
          </div>
        </div>

        <div class="input-row">
          <input id="avatarUrl" type="text" placeholder="例：https://example.com/avatar.jpg" />
          <button onclick="loadAvatar()">加载</button>
        </div>
        <p class="note">支持 JPG / PNG / GIF 格式的图片链接</p>

        <div id="statusBar" class="status-bar"></div>
      </div>
    </div>
  </div>

  <script>
    /* ============================================================
       安全版本 — 使用 DOM API 替代 innerHTML 拼接
       ============================================================ */

    // 方案 A：转义双引号（简单有效）
    function sanitizeUrl(url) {
      return String(url).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // 方案 B：使用 DOM API 创建元素（推荐，更彻底）
    function loadAvatar() {
      var url = document.getElementById('avatarUrl').value.trim();
      var container = document.getElementById('avatarContainer');
      var statusBar = document.getElementById('statusBar');

      if (!url) {
        statusBar.className = 'status-bar error';
        statusBar.textContent = '⚠ 请输入图片 URL';
        return;
      }

      statusBar.className = 'status-bar';

      // ✅ 安全：使用 DOM API 创建 img 元素
      container.innerHTML = '';
      var img = document.createElement('img');
      img.src = url;
      img.className = 'avatar';
      img.alt = '用户头像';
      img.onerror = function() {
        statusBar.className = 'status-bar error';
        statusBar.textContent = '⚠ 图片加载失败，请检查 URL 是否有效';
      };
      container.appendChild(img);
    }

    if (window.__ATTACK_PAYLOAD__) {
      setTimeout(function() {
        document.getElementById('avatarUrl').value = window.__ATTACK_PAYLOAD__;
        loadAvatar();
      }, 300);
    }
  </script>
</body>
</html>`,
  hint: '攻击者不需要 <script> 标签也能执行 JavaScript！看看双引号在 HTML 属性中的作用——试试输入 `x" onerror="alert(1)` 看看会发生什么。防御思路：使用 createElement 替代 innerHTML，或转义引号。',
  vulnerabilityType: 'dom-xss',
  difficulty: 'hard',
};
