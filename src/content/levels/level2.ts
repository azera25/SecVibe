import type { Level } from '@/types';

export const level2: Level = {
  id: 'sql-injection',
  title: 'SQL 注入',
  description:
    '登录表单存在 SQL 注入漏洞，用户名参数未经过滤直接拼接进查询语句。尝试绕过密码验证，以管理员身份登录。',
  initialCode: `<?php
$username = $_POST['username'];
$password = $_POST['password'];

// 漏洞：直接拼接用户输入
$sql = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    echo "登录成功，欢迎 " . $username;
} else {
    echo "用户名或密码错误";
}
?>`,
  solution: `<?php
$username = mysqli_real_escape_string($conn, $_POST['username']);
$password = mysqli_real_escape_string($conn, $_POST['password']);

$sql = "SELECT * FROM users WHERE username = ? AND password = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "ss", $username, $password);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) > 0) {
    echo "登录成功，欢迎 " . $username;
} else {
    echo "用户名或密码错误";
}
?>`,
  hint: '试试在用户名输入框中输入 `\' OR \'1\'=\'1` ——猜猜会发生什么？',
};
