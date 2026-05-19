import type { Level } from '@/types';

export const level3: Level = {
  id: 'command-injection',
  title: '命令注入',
  description:
    '服务器提供了一个 Ping 工具，用户输入的 IP 地址直接拼接到系统命令中。尝试注入额外命令，读取服务器上的敏感文件。',
  initialCode: `<?php
$ip = $_GET['ip'];

// 漏洞：直接将用户输入拼入 shell 命令
$output = shell_exec("ping -c 4 " . $ip);
echo "<pre>$output</pre>";
?>`,
  solution: `<?php
$ip = $_GET['ip'];

// 只允许合法的 IP 地址格式
if (filter_var($ip, FILTER_VALIDATE_IP)) {
    $output = shell_exec("ping -c 4 " . escapeshellarg($ip));
    echo "<pre>$output</pre>";
} else {
    echo "无效的 IP 地址";
}
?>`,
  hint: '在 IP 后面加上分号或管道符试试，比如 `; cat /etc/passwd`',
};
