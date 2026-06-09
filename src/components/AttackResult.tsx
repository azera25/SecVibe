'use client';

import { useEffect, useRef } from 'react';
import { Terminal, Zap, ShieldCheck, ShieldOff, Bug } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LogEntry, AttackStatus } from '@/types';

type Props = {
  logs: LogEntry[];
  attackPayload?: string;
  attackStatus: AttackStatus;
  /** 攻击获取到的泄露数据描述 */
  breachedDetail?: string;
  /** AI 载荷来源 */
  attackSource?: 'deepseek' | 'fallback';
};

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-hacker-accent',
  WARN: 'text-hacker-secondary',
  ERROR: 'text-red-400',
};

export default function AttackResult({
  logs,
  attackPayload,
  attackStatus,
  breachedDetail,
  attackSource,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isHacked = attackStatus === 'hacked';
  const isSecure = attackStatus === 'secure';
  const isPending = attackStatus === 'pending';
  const hasPayload = !!attackPayload;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-hacker-accent" />
          <span className="text-xs text-gray-400">攻防回放区</span>
        </div>
        {/* Result badge */}
        {isHacked && (
          <span className="flex animate-pulse items-center gap-1 text-[10px] font-bold text-red-400">
            <ShieldOff size={12} />
            漏洞已被触发
          </span>
        )}
        {isSecure && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
            <ShieldCheck size={12} />
            防御成功
          </span>
        )}
        {isPending && (
          <span className="flex items-center gap-1 text-[10px] text-hacker-accent">
            <Bug size={12} className="animate-pulse" />
            攻击监测中
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* ── AI Attack Payload Section ── */}
        {hasPayload && (
          <div className="shrink-0 border-b border-hacker-border/50 bg-[#0c0c0c] px-4 py-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Zap size={12} className="text-hacker-secondary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                AI 攻击载荷
              </span>
              {attackSource && (
                <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[9px] text-gray-600">
                  {attackSource === 'deepseek' ? 'DeepSeek' : '内置库'}
                </span>
              )}
            </div>
            <div className="overflow-x-auto rounded bg-black/50 p-2 font-mono text-[11px] leading-relaxed">
              <span className="text-hacker-secondary">$ </span>
              <span className={cn(isHacked ? 'text-red-300' : 'text-gray-300')}>
                {attackPayload}
              </span>
            </div>
          </div>
        )}

        {/* ── Execution Result Section ── */}
        {isHacked && (
          <div className="shrink-0 border-b border-red-900/30 bg-red-950/20 px-4 py-3">
            <div className="text-center">
              <div className="mb-1 text-2xl font-black tracking-wider text-red-400 animate-pulse">
                💥 漏洞已被触发！
              </div>
              <div className="text-[11px] text-red-300/80">
                攻击载荷成功绕过了防御，受保护数据已暴露
              </div>
              {breachedDetail && (
                <div className="mx-auto mt-2 max-w-md rounded border border-red-800/40 bg-black/40 px-3 py-2 font-mono text-[11px] text-red-200">
                  {breachedDetail}
                </div>
              )}
            </div>
          </div>
        )}

        {isSecure && (
          <div className="shrink-0 border-b border-green-900/30 bg-green-950/20 px-4 py-3">
            <div className="text-center">
              <div className="mb-1 text-2xl font-black tracking-wider text-green-400">
                🛡️ 防御成功！
              </div>
              <div className="text-[11px] text-green-300/80">
                你的代码成功抵御了 AI 攻击，受保护数据安然无恙
              </div>
            </div>
          </div>
        )}

        {/* ── Log Stream ── */}
        <div className="max-h-[30vh] min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
          {logs.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 text-gray-600">{line.time}</span>
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
    </div>
  );
}
