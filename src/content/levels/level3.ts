import type { Level } from '@/types';

/**
 * 第三关：权限迷宫 — 越权访问 (IDOR)
 *
 * 场景：订单查询系统，只凭 orderId 查数据，无用户归属校验
 * 漏洞：getOrderById() 直接返回匹配的订单，未检查 userId
 * 攻击演示：AI 传入属于用户 999 的 orderId，系统返回不该看到的订单
 * 防御要点：查询后必须校验当前用户是否有权访问
 */
export const level3: Level = {
  id: 'idor-challenge',
  title: '权限迷宫：越权访问',
  description:
    '订单查询系统存在 IDOR 漏洞。当前登录用户 alice_sec（ID: 101），但查询接口只根据 orderId 查找数据，完全没有校验订单归属。\n\n请修复 getOrderById() 函数，阻止越权访问其他用户的订单。',
  initialCode: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>我的订单</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f7; color: #1d1d1f; }
    .container { max-width: 680px; margin: 0 auto; padding: 24px 20px; }
    h1 { font-size: 20px; display: flex; align-items: center; gap: 8px; }
    .header-sub { font-size: 13px; color: #888; margin-top: 2px; }
    .user-badge { display: inline-flex; align-items: center; gap: 6px; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-top: 8px; }
    .card { background: #fff; border-radius: 12px; margin-top: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; }
    .card-body { padding: 20px; }
    .search-row { display: flex; gap: 8px; margin-top: 12px; }
    .search-row input { flex: 1; padding: 9px 14px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px; outline: none; }
    .search-row input:focus { border-color: #0071e3; box-shadow: 0 0 0 2px rgba(0,113,227,.15); }
    .search-row button { padding: 9px 22px; background: #0071e3; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
    .search-row button:hover { background: #0077ed; }
    .order-card { border: 1px solid #e8e8ed; border-radius: 10px; padding: 16px; margin-top: 14px; }
    .order-card h3 { font-size: 16px; margin-bottom: 8px; }
    .order-field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f7; font-size: 13px; }
    .order-field:last-child { border-bottom: none; }
    .order-field .label { color: #888; }
    .order-field .value { font-weight: 500; }
    .secret-tag { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .no-result { text-align: center; color: #999; padding: 32px 0; font-size: 14px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-top: 12px; display: none; }
    .my-orders { margin-top: 16px; }
    .my-orders summary { cursor: pointer; font-size: 12px; color: #888; padding: 4px 0; }
    .my-orders .order-item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .my-orders .order-item:last-child { border-bottom: none; }
    .my-orders .order-item:hover { background: #f8f8fa; }
    .order-link { color: #0071e3; cursor: pointer; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📦 我的订单</h1>
    <div class="header-sub">查看订单详情</div>
    <div class="user-badge">👤 alice_sec · ID: 101</div>

    <div class="card">
      <div class="card-body">
        <div class="search-row">
          <input id="orderIdInput" type="text" placeholder="输入订单 ID (如 1、2)" />
          <button onclick="handleViewOrder()">查询</button>
        </div>

        <details class="my-orders">
          <summary>我的历史订单</summary>
          <div id="myOrdersList"></div>
        </details>
      </div>
    </div>

    <div id="resultPanel"></div>
    <div id="errorPanel" class="error-box"></div>
  </div>

  <script>
    /* ============================================================
       系统数据（不可修改）
       ============================================================ */

    var ALL_ORDERS = [
      { id: 1, userId: 101, product: 'MacBook Pro 14"', amount: 15999, date: '2025-03-15', status: '已发货' },
      { id: 2, userId: 101, product: 'AirPods Pro 2',  amount: 1999,  date: '2025-04-20', status: '已完成' },
      { id: 3, userId: 999, product: '🔒 管理员秘密',    amount: 0,     date: '2025-01-01', status: '机密',
        note: '🔥 这是超级管理员的秘密订单，包含敏感信息！普通用户绝不应看到。' },
      { id: 4, userId: 102, product: 'iPhone 16 Pro',  amount: 8999,  date: '2025-05-10', status: '待发货' },
      { id: 5, userId: 103, product: 'iPad Air M3',    amount: 4999,  date: '2025-06-01', status: '已完成' },
    ];

    var CURRENT_USER = { id: 101, name: 'alice_sec' };

    /* ── 系统安全检测（始终执行，不可绕过） ── */
    function __securityCheck(order) {
      if (order && order.userId !== CURRENT_USER.id) {
        alert('⛔ 越权访问！订单 ' + order.id + ' 属于用户 ' + order.userId + '，不属于当前用户！');
      }
    }

    /* ============================================================
       安全挑战：修复 getOrderById()，防止越权访问
       ============================================================ */

    // ⚠ 漏洞：直接按 orderId 查找，未校验订单归属
    function getOrderById(orderId) {
      return ALL_ORDERS.find(function(o) { return o.id === orderId; });
    }

    /* ---------- 以下代码不建议修改 ---------- */

    function handleViewOrder() {
      var input = document.getElementById('orderIdInput');
      var rawId = input.value.trim();
      var orderId = parseInt(rawId, 10);
      var resultPanel = document.getElementById('resultPanel');
      var errorPanel = document.getElementById('errorPanel');

      errorPanel.style.display = 'none';

      if (isNaN(orderId) || orderId <= 0) {
        errorPanel.textContent = '⚠ 请输入有效的订单 ID';
        errorPanel.style.display = 'block';
        return;
      }

      var order = getOrderById(orderId);

      /* 系统安全检查（始终执行） */
      __securityCheck(order);

      if (order) {
        renderOrder(order, resultPanel);
      } else {
        resultPanel.innerHTML = '<p class="no-result">未找到该订单</p>';
      }
    }

    function renderOrder(order, container) {
      var isSecret = order.userId !== CURRENT_USER.id;
      var html = '<div class="order-card">';
      html += '<h3>订单 #' + order.id + ' ' + (isSecret ? '<span class="secret-tag">⚠ 非本人订单</span>' : '') + '</h3>';
      html += '<div class="order-field"><span class="label">商品</span><span class="value">' + esc(order.product) + '</span></div>';
      html += '<div class="order-field"><span class="label">金额</span><span class="value">¥' + order.amount + '</span></div>';
      html += '<div class="order-field"><span class="label">日期</span><span class="value">' + order.date + '</span></div>';
      html += '<div class="order-field"><span class="label">状态</span><span class="value">' + esc(order.status) + '</span></div>';
      if (order.note) {
        html += '<div class="order-field"><span class="label">备注</span><span class="value">' + esc(order.note) + '</span></div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }

    function esc(str) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, function(c) { return map[c]; });
    }

    /* 渲染当前用户的订单列表 */
    (function renderMyOrders() {
      var container = document.getElementById('myOrdersList');
      var mine = ALL_ORDERS.filter(function(o) { return o.userId === CURRENT_USER.id; });
      var html = '';
      for (var i = 0; i < mine.length; i++) {
        html += '<div class="order-item">' +
          '<span class="order-link" onclick="document.getElementById(\'orderIdInput\').value=\'' + mine[i].id + '\';handleViewOrder()">#' + mine[i].id + ' ' + esc(mine[i].product) + '</span>' +
          '<span>¥' + mine[i].amount + '</span>' +
          '</div>';
      }
      container.innerHTML = html;
    })();

    /* 自动攻击：裁判脚本注入的载荷 */
    if (window.__ATTACK_PAYLOAD__) {
      setTimeout(function() {
        var payload = window.__ATTACK_PAYLOAD__;
        document.getElementById('orderIdInput').value = payload;
        handleViewOrder();
      }, 300);
    }
  </script>
</body>
</html>`,
  solution: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>我的订单</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f7; color: #1d1d1f; }
    .container { max-width: 680px; margin: 0 auto; padding: 24px 20px; }
    h1 { font-size: 20px; display: flex; align-items: center; gap: 8px; }
    .header-sub { font-size: 13px; color: #888; margin-top: 2px; }
    .user-badge { display: inline-flex; align-items: center; gap: 6px; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-top: 8px; }
    .card { background: #fff; border-radius: 12px; margin-top: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; }
    .card-body { padding: 20px; }
    .search-row { display: flex; gap: 8px; margin-top: 12px; }
    .search-row input { flex: 1; padding: 9px 14px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 14px; outline: none; }
    .search-row input:focus { border-color: #0071e3; box-shadow: 0 0 0 2px rgba(0,113,227,.15); }
    .search-row button { padding: 9px 22px; background: #0071e3; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
    .search-row button:hover { background: #0077ed; }
    .order-card { border: 1px solid #e8e8ed; border-radius: 10px; padding: 16px; margin-top: 14px; }
    .order-card h3 { font-size: 16px; margin-bottom: 8px; }
    .order-field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f7; font-size: 13px; }
    .order-field:last-child { border-bottom: none; }
    .order-field .label { color: #888; }
    .order-field .value { font-weight: 500; }
    .secret-tag { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .no-result { text-align: center; color: #999; padding: 32px 0; font-size: 14px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-top: 12px; display: none; }
    .my-orders { margin-top: 16px; }
    .my-orders summary { cursor: pointer; font-size: 12px; color: #888; padding: 4px 0; }
    .my-orders .order-item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .my-orders .order-item:last-child { border-bottom: none; }
    .my-orders .order-item:hover { background: #f8f8fa; }
    .order-link { color: #0071e3; cursor: pointer; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📦 我的订单</h1>
    <div class="header-sub">查看订单详情</div>
    <div class="user-badge">👤 alice_sec · ID: 101</div>

    <div class="card">
      <div class="card-body">
        <div class="search-row">
          <input id="orderIdInput" type="text" placeholder="输入订单 ID (如 1、2)" />
          <button onclick="handleViewOrder()">查询</button>
        </div>
        <details class="my-orders">
          <summary>我的历史订单</summary>
          <div id="myOrdersList"></div>
        </details>
      </div>
    </div>

    <div id="resultPanel"></div>
    <div id="errorPanel" class="error-box"></div>
  </div>

  <script>
    var ALL_ORDERS = [
      { id: 1, userId: 101, product: 'MacBook Pro 14"', amount: 15999, date: '2025-03-15', status: '已发货' },
      { id: 2, userId: 101, product: 'AirPods Pro 2',  amount: 1999,  date: '2025-04-20', status: '已完成' },
      { id: 3, userId: 999, product: '🔒 管理员秘密',    amount: 0,     date: '2025-01-01', status: '机密',
        note: '🔥 这是超级管理员的秘密订单，包含敏感信息！普通用户绝不应看到。' },
      { id: 4, userId: 102, product: 'iPhone 16 Pro',  amount: 8999,  date: '2025-05-10', status: '待发货' },
      { id: 5, userId: 103, product: 'iPad Air M3',    amount: 4999,  date: '2025-06-01', status: '已完成' },
    ];

    var CURRENT_USER = { id: 101, name: 'alice_sec' };

    function __securityCheck(order) {
      if (order && order.userId !== CURRENT_USER.id) {
        alert('⛔ 越权访问！订单 ' + order.id + ' 属于用户 ' + order.userId + '，不属于当前用户！');
      }
    }

    /* ============================================================
       修复后：增加归属校验
       ============================================================ */
    function getOrderById(orderId) {
      var order = ALL_ORDERS.find(function(o) { return o.id === orderId; });
      // ✅ 修复：如果订单存在但不属于当前用户，拒绝访问
      if (order && order.userId !== CURRENT_USER.id) {
        return null; // 假装订单不存在
      }
      return order;
    }

    function handleViewOrder() {
      var input = document.getElementById('orderIdInput');
      var rawId = input.value.trim();
      var orderId = parseInt(rawId, 10);
      var resultPanel = document.getElementById('resultPanel');
      var errorPanel = document.getElementById('errorPanel');

      errorPanel.style.display = 'none';

      if (isNaN(orderId) || orderId <= 0) {
        errorPanel.textContent = '⚠ 请输入有效的订单 ID';
        errorPanel.style.display = 'block';
        return;
      }

      var order = getOrderById(orderId);

      /* 系统安全检查（始终执行） */
      __securityCheck(order);

      if (order) {
        renderOrder(order, resultPanel);
      } else {
        resultPanel.innerHTML = '<p class="no-result">未找到该订单</p>';
      }
    }

    function renderOrder(order, container) {
      var isSecret = order.userId !== CURRENT_USER.id;
      var html = '<div class="order-card">';
      html += '<h3>订单 #' + order.id + ' ' + (isSecret ? '<span class="secret-tag">⚠ 非本人订单</span>' : '') + '</h3>';
      html += '<div class="order-field"><span class="label">商品</span><span class="value">' + esc(order.product) + '</span></div>';
      html += '<div class="order-field"><span class="label">金额</span><span class="value">¥' + order.amount + '</span></div>';
      html += '<div class="order-field"><span class="label">日期</span><span class="value">' + order.date + '</span></div>';
      html += '<div class="order-field"><span class="label">状态</span><span class="value">' + esc(order.status) + '</span></div>';
      if (order.note) {
        html += '<div class="order-field"><span class="label">备注</span><span class="value">' + esc(order.note) + '</span></div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }

    function esc(str) {
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, function(c) { return map[c]; });
    }

    (function renderMyOrders() {
      var container = document.getElementById('myOrdersList');
      var mine = ALL_ORDERS.filter(function(o) { return o.userId === CURRENT_USER.id; });
      var html = '';
      for (var i = 0; i < mine.length; i++) {
        html += '<div class="order-item">' +
          '<span class="order-link" onclick="document.getElementById(\'orderIdInput\').value=\'' + mine[i].id + '\';handleViewOrder()">#' + mine[i].id + ' ' + esc(mine[i].product) + '</span>' +
          '<span>¥' + mine[i].amount + '</span>' +
          '</div>';
      }
      container.innerHTML = html;
    })();

    if (window.__ATTACK_PAYLOAD__) {
      setTimeout(function() {
        var payload = window.__ATTACK_PAYLOAD__;
        document.getElementById('orderIdInput').value = payload;
        handleViewOrder();
      }, 300);
    }
  </script>
</body>
</html>`,
  hint: '攻击者输入 orderId=3 看到了什么？思考：getOrderById 只做了"查找"没做"校验"。修复方法：查到的订单如果 userId 不等于当前用户，应当拒绝。',
  vulnerabilityType: 'idor',
  difficulty: 'hard',
  objective: '当前你以 ID 为 101 的普通用户登录。请修改代码逻辑，阻止任何人通过篡改 URL 参数查看不属于自己的订单秘密。',
  protectedInfo: '`高管订单详情`\n\n**Order #999** — **金额: $5,000,000**\n\n公司高管的机密采购订单，普通用户无权查看。泄露可能导致内幕交易指控。',
};
