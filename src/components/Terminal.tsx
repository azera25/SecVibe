import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import type { LogEntry } from '@/types';

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-hacker-accent',
  WARN: 'text-hacker-secondary',
  ERROR: 'text-red-400',
};

type TerminalLogProps = {
  logs: LogEntry[];
};

export default function TerminalLog({ logs }: TerminalLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center gap-2 border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <Terminal size={14} className="text-hacker-accent" />
        <span className="text-xs text-gray-400">Terminal Log</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {logs.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-600 shrink-0">{line.time}</span>
            <span className={LEVEL_COLOR[line.level] ?? 'text-gray-300'}>
              [{line.level}]
            </span>
            <span className="text-gray-400">{line.message}</span>
          </div>
        ))}
        <span className="mt-1 inline-block animate-pulse text-hacker-accent">_</span>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
