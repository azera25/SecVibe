/**
 * 构建沙箱裁判脚本，在 iframe 中注入以劫持和检测攻击行为。
 */
export function buildJudgeScript(attackPayload?: string): string {
  const payload = JSON.stringify(attackPayload ?? '');

  const script = `
(function() {
  'use strict';

  var _payload = ${payload};

  function _report(type, data) {
    window.parent.postMessage({ type: type, source: 'sandbox', ts: Date.now(), data: data }, '*');
  }

  /* ── 1. 劫持 alert / prompt / confirm ── */
  var _alert = window.alert;
  window.alert = function(msg) {
    _report('ATTACK_DETECTED', { attackType: 'xss', vector: 'alert', detail: String(msg) });
    if (_alert) _alert.call(window, msg);
  };

  var _prompt = window.prompt;
  window.prompt = function(msg) {
    _report('ATTACK_DETECTED', { attackType: 'xss', vector: 'prompt', detail: String(msg) });
    return _prompt ? _prompt.call(window, msg) : null;
  };

  var _confirm = window.confirm;
  window.confirm = function(msg) {
    _report('ATTACK_DETECTED', { attackType: 'xss', vector: 'confirm', detail: String(msg) });
    return _confirm ? _confirm.call(window, msg) : false;
  };

  /* ── 2. 捕获脚本错误 ── */
  window.onerror = function(msg, source, line, col, err) {
    _report('SCRIPT_ERROR', { message: String(msg), source: source, line: line, col: col });
    return true;
  };

  /* ── 3. MOCK_DB — 用于 SQL 注入模拟 ── */
  window.MOCK_DB = {
    users: [
      { id: 1, username: 'admin',    email: 'admin@secvibe.test',    role: '管理员' },
      { id: 2, username: 'alice',    email: 'alice@secvibe.test',    role: '普通用户' },
      { id: 3, username: 'bob',      email: 'bob@secvibe.test',      role: '普通用户' },
      { id: 4, username: 'charlie',  email: 'charlie@secvibe.test',  role: '普通用户' },
    ],
    query: function(sql) {
      var lower = (sql || '').toLowerCase();
      _report('SQL_QUERY', { sql: sql });

      /* 提取 WHERE id = X 中的 X */
      var idMatch = sql.match(/id\\s*=\\s*['"]?([^'"\\s;)]+)['"]?/i);
      var idValue = idMatch ? idMatch[1] : null;
      var isCleanNumeric = idValue !== null && /^\\d+$/.test(idValue);

      /* ── 检测 SQL 注入 ── */
      var hasPattern = lower.indexOf("' or ") !== -1 ||
                       lower.indexOf("'='")   !== -1 ||
                       lower.indexOf("1=1")   !== -1 ||
                       lower.indexOf("or 1=") !== -1 ||
                       lower.indexOf(" or ")  !== -1;   // catches "1 OR 1=1"

      var hasSuspiciousId = idValue !== null &&
                           !isCleanNumeric &&
                           (lower.indexOf('or ') !== -1 || lower.indexOf('union') !== -1);

      if (hasPattern || hasSuspiciousId) {
        _report('ATTACK_DETECTED', {
          attackType: 'sqli',
          vector: hasPattern ? 'pattern' : 'non-numeric-id',
          detail: 'SQL注入: ' + sql,
        });
        // 返回全部用户 — 模拟注入成功
        return this.users;
      }

      /* ── 正常查询 ── */
      if (idValue && isCleanNumeric) {
        var numId = parseInt(idValue, 10);
        return this.users.filter(function(u) { return u.id === numId; });
      }

      return [];
    },
  };

  /* ── 4. MutationObserver — 检测 DOM 注入的 onerror/onload 等事件属性 ── */
  (function() {
    try {
      var _observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.type !== 'childList') return;
          for (var i = 0; i < m.addedNodes.length; i++) {
            var node = m.addedNodes[i];
            if (node.nodeType !== 1) continue;
            // 检查被添加的元素及其子元素
            var check = function(el) {
              if (!el || !el.getAttribute) return;
              var attr = el.getAttribute('onerror') || el.getAttribute('onload') ||
                         el.getAttribute('onfocus') || el.getAttribute('onclick') ||
                         el.getAttribute('onmouseover');
              if (attr) {
                _report('ATTACK_DETECTED', {
                  attackType: 'dom-xss',
                  vector: 'attribute-injection',
                  detail: '事件属性注入: ' + attr,
                });
              }
              // 递归检查子元素
              var children = el.children;
              for (var c = 0; c < children.length; c++) check(children[c]);
            };
            check(node);
          }
        });
      });
      _observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) { /* silently fail — observer is optional */ }
  })();

  /* ── 5. 全局攻击载荷 — 供关卡代码自行消费 ── */
  if (_payload) {
    window.__ATTACK_PAYLOAD__ = _payload;

    /* URLSearchParams 劫持 — 用于 XSS 注入模拟 */
    var _origGet = URLSearchParams.prototype.get;
    URLSearchParams.prototype.get = function(key) {
      if (key === 'msg' || key === 'comment' || key === 'q' || key === 'input') {
        return _payload;
      }
      return _origGet.call(this, key);
    };
  }

  _report('SANDBOX_READY', {});
})();
`;

  return '<script>' + script + '<' + '/script>';
}
