import type { Level } from '@/types';

/**
 * 第二关：SQL 注入
 *
 * 场景：模拟后台用户查询系统
 * 漏洞：字符串拼接 SQL 查询
 * 攻击载荷通过 window.__ATTACK_PAYLOAD__ 由裁判脚本自动注入
 */
export const level2: Level = {
  id: 'sql-injection',
  title: 'SQL 注入',
  description:
    '后台用户查询系统存在 SQL 注入漏洞。用户输入的 ID 未经校验直接拼入 SQL 语句，可被利用绕过 ID 限制查询全部用户。\n\n请修复 searchUser() 函数中的字符串拼接问题，阻止 SQL 注入。',
  initialCode: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>后台用户查询</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f0f2f5; color: #333; }
    .container { max-width: 760px; margin: 0 auto; padding: 24px 20px; }
    h1 { font-size: 20px; color: #1a1a2e; display: flex; align-items: center; gap: 8px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .search-row { display: flex; gap: 8px; margin: 12px 0; }
    .search-row input { flex: 1; padding: 9px 14px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 14px; outline: none; }
    .search-row input:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,.15); }
    .search-row button { padding: 9px 24px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .search-row button:hover { background: #1557b0; }
    .sql-panel { background: #1a1a2e; color: #00e676; padding: 14px 16px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; margin: 12px 0; word-break: break-all; }
    .sql-panel .label { color: #888; font-size: 11px; display: block; margin-bottom: 4px; }
    .result-count { font-size: 12px; color: #666; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
    th { background: #f8f9fa; color: #555; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .3px; }
    tr:hover td { background: #f8faff; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 500; }
    .badge-admin { background: #fce4ec; color: #c62828; }
    .badge-user { background: #e8f5e9; color: #2e7d32; }
    .no-result { text-align: center; color: #999; padding: 32px 0; font-size: 14px; }
    .error { color: #d32f2f; text-align: center; padding: 16px; font-size: 14px; }
    .header-sub { font-size: 12px; color: #888; margin-top: 4px; }
    .hint-box { background: #fff3e0; border-left: 3px solid #ff9800; padding: 10px 14px; border-radius: 4px; font-size: 12px; color: #e65100; margin: 8px 0; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 后台用户查询系统</h1>
    <div class="header-sub">内部管理工具 — 按用户 ID 查询详细信息</div>

    <div class="card">
      <div class="search-row">
        <input id="uid" type="text" placeholder='输入用户 ID (如 1, 2, 3...)' />
        <button onclick="searchUser()">查询</button>
      </div>
    </div>

    <div id="sqlPanel" class="sql-panel">
      <span class="label">▶ 执行 SQL</span>
      等待查询...
    </div>

    <div id="resultPanel" class="card">
      <p class="no-result">输入 ID 并点击查询按钮</p>
    </div>
  </div>

  <script>
    /* ============================================================
       安全挑战：修复 searchUser() 函数中 SQL 查询的拼接漏洞
       ============================================================ */

    function searchUser() {
      var input = document.getElementById('uid');
      var rawId = input.value.trim();
      var sqlPanel = document.getElementById('sqlPanel');
      var resultPanel = document.getElementById('resultPanel');

      // ⚠ 漏洞：直接将用户输入拼接到 SQL 查询字符串
      var query = "SELECT * FROM users WHERE id = " + rawId;

      sqlPanel.innerHTML = '<span class="label">▶ 执行 SQL</span>' + escapeHtml(query);

      // 使用沙箱提供的 MOCK_DB 执行查询
      var results = window.MOCK_DB ? window.MOCK_DB.query(query) : [];

      // 渲染结果
      if (results.length > 0) {
        var html = '<div class="result-count">共 ' + results.length + ' 条记录</div>';
        html += '<table><thead><tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th></tr></thead><tbody>';
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          var roleBadge = r.role === '管理员' ? 'badge-admin' : 'badge-user';
          html += '<tr>' +
            '<td>' + r.id + '</td>' +
            '<td><strong>' + escapeHtml(r.username) + '</strong></td>' +
            '<td>' + escapeHtml(r.email) + '</td>' +
            '<td><span class="badge ' + roleBadge + '">' + r.role + '</span></td>' +
            '</tr>';
        }
        html += '</tbody></table>';
        resultPanel.innerHTML = html;
      } else {
        resultPanel.innerHTML = '<p class="no-result">未找到匹配的用户</p>';
      }
    }

    /* 工具：HTML 转义（仅用于安全显示，不影响漏洞逻辑） */
    function escapeHtml(str) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, function(c) { return map[c]; });
    }

    /* 如果裁判脚本注入了攻击载荷，自动执行查询演示漏洞 */
    if (window.__ATTACK_PAYLOAD__) {
      setTimeout(function() {
        document.getElementById('uid').value = window.__ATTACK_PAYLOAD__;
        searchUser();
      }, 300);
    }
  </script>
</body>
</html>`,
  solution: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>后台用户查询</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f0f2f5; color: #333; }
    .container { max-width: 760px; margin: 0 auto; padding: 24px 20px; }
    h1 { font-size: 20px; color: #1a1a2e; display: flex; align-items: center; gap: 8px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .search-row { display: flex; gap: 8px; margin: 12px 0; }
    .search-row input { flex: 1; padding: 9px 14px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 14px; outline: none; }
    .search-row input:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,.15); }
    .search-row button { padding: 9px 24px; background: #1a73e8; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .search-row button:hover { background: #1557b0; }
    .sql-panel { background: #1a1a2e; color: #00e676; padding: 14px 16px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; margin: 12px 0; word-break: break-all; }
    .sql-panel .label { color: #888; font-size: 11px; display: block; margin-bottom: 4px; }
    .result-count { font-size: 12px; color: #666; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
    th { background: #f8f9fa; color: #555; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .3px; }
    tr:hover td { background: #f8faff; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 500; }
    .badge-admin { background: #fce4ec; color: #c62828; }
    .badge-user { background: #e8f5e9; color: #2e7d32; }
    .no-result { text-align: center; color: #999; padding: 32px 0; font-size: 14px; }
    .error { color: #d32f2f; text-align: center; padding: 16px; font-size: 14px; }
    .header-sub { font-size: 12px; color: #888; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 后台用户查询系统</h1>
    <div class="header-sub">内部管理工具 — 按用户 ID 查询详细信息</div>

    <div class="card">
      <div class="search-row">
        <input id="uid" type="text" placeholder='输入用户 ID (如 1, 2, 3...)' />
        <button onclick="searchUser()">查询</button>
      </div>
    </div>

    <div id="sqlPanel" class="sql-panel">
      <span class="label">▶ 执行 SQL</span>
      等待查询...
    </div>

    <div id="resultPanel" class="card">
      <p class="no-result">输入 ID 并点击查询按钮</p>
    </div>
  </div>

  <script>
    /* 修复后的安全版本 */
    function searchUser() {
      var input = document.getElementById('uid');
      var rawId = input.value.trim();
      var sqlPanel = document.getElementById('sqlPanel');
      var resultPanel = document.getElementById('resultPanel');

      // 修复：校验输入为合法数字
      var numId = parseInt(rawId, 10);
      if (isNaN(numId) || numId <= 0 || String(numId) !== rawId) {
        sqlPanel.innerHTML = '<span class="label">⚠ 已拦截</span>无效的 ID，只允许正整数';
        resultPanel.innerHTML = '<p class="error">查询失败：ID 格式不正确</p>';
        return;
      }

      // 安全：使用数字拼接，注入字符会被 parseInt 过滤
      var query = "SELECT * FROM users WHERE id = " + numId;

      sqlPanel.innerHTML = '<span class="label">▶ 执行 SQL</span>' + escapeHtml(query);

      var results = window.MOCK_DB ? window.MOCK_DB.query(query) : [];

      if (results.length > 0) {
        var html = '<div class="result-count">共 ' + results.length + ' 条记录</div>';
        html += '<table><thead><tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th></tr></thead><tbody>';
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          var roleBadge = r.role === '管理员' ? 'badge-admin' : 'badge-user';
          html += '<tr>' +
            '<td>' + r.id + '</td>' +
            '<td><strong>' + escapeHtml(r.username) + '</strong></td>' +
            '<td>' + escapeHtml(r.email) + '</td>' +
            '<td><span class="badge ' + roleBadge + '">' + r.role + '</span></td>' +
            '</tr>';
        }
        html += '</tbody></table>';
        resultPanel.innerHTML = html;
      } else {
        resultPanel.innerHTML = '<p class="no-result">未找到匹配的用户</p>';
      }
    }

    function escapeHtml(str) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, function(c) { return map[c]; });
    }

    if (window.__ATTACK_PAYLOAD__) {
      setTimeout(function() {
        document.getElementById('uid').value = window.__ATTACK_PAYLOAD__;
        searchUser();
      }, 300);
    }
  </script>
</body>
</html>`,
  hint: '试试在 ID 输入框输入 "1 OR 1=1"，看看返回了几条记录？修复思路：使用 parseInt() 将输入转为数字，非数字输入直接拒绝。',
  vulnerabilityType: 'sqli',
  difficulty: 'medium',
  objective: '系统存在查询注入风险。请修复搜索逻辑，确保攻击者无法通过拼接指令一次性导出所有用户的隐私数据。',
  protectedInfo: '`核心数据库表 Users_Private_Table`\n\n包含全站 **500 名用户**的手机号、邮箱、住址等隐私数据。攻击者通过 SQL 注入可一次性全部窃取。',
};
