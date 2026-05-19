import { Terminal } from 'lucide-react';

const LOG_LINES = [
  { time: '12:00:01', level: 'INFO', message: '挑战环境初始化...' },
  { time: '12:00:02', level: 'INFO', message: '沙箱容器已启动' },
  { time: '12:00:03', level: 'WARN', message: '检测到未授权访问尝试' },
  { time: '12:00:05', level: 'INFO', message: '等待用户操作...' },
];

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-hacker-accent',
  WARN: 'text-hacker-secondary',
  ERROR: 'text-red-400',
};

export default function TerminalLog() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center gap-2 border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <Terminal size={14} className="text-hacker-accent" />
        <span className="text-xs text-gray-400">Terminal Log</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {LOG_LINES.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-600">{line.time}</span>
            <span className={LEVEL_COLOR[line.level] ?? 'text-gray-300'}>
              [{line.level}]
            </span>
            <span className="text-gray-400">{line.message}</span>
          </div>
        ))}
        <span className="mt-1 inline-block animate-pulse text-hacker-accent">_</span>
      </div>
    </div>
  );
}
