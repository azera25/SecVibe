import type { Level } from '@/types';

export const level1: Level = {
  id: 'xss-basics',
  title: 'XSS 基础',
  description:
    '你发现了一个评论区存在反射型 XSS 漏洞。请找到注入点并构造一个弹窗 payload，证明漏洞存在。',
  initialCode: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>留言板</title>
</head>
<body>
  <h1>留言板</h1>
  <div id="comments"></div>
  <script>
    // 从 URL 参数中读取留言并显示
    const msg = new URLSearchParams(location.search).get('msg');
    document.getElementById('comments').innerHTML = msg;
  </script>
</body>
</html>`,
  solution: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>留言板</title>
</head>
<body>
  <h1>留言板</h1>
  <div id="comments"></div>
  <script>
    const msg = new URLSearchParams(location.search).get('msg');
    document.getElementById('comments').textContent = msg;
  </script>
</body>
</html>`,
  hint: '留意 innerHTML 的使用——用户输入直接拼接进 DOM 会发生什么？',
};
