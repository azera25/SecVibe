'use client';

import { Shield, ShieldOff, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Level, AttackStatus } from '@/types';

type Props = {
  level: Level | null;
  status: AttackStatus;
};

function MarkdownInline({ text }: { text: string }) {
  // Simple inline markdown rendering: **bold**, `code`, line breaks
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className="mb-2 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[11px] text-green-300 last:mb-0">
            {codeBuffer.join('\n')}
          </pre>,
        );
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      return;
    }
    elements.push(
      <div key={i} className="text-[11px] leading-relaxed text-gray-400">
        <MarkdownInline text={line} />
      </div>,
    );
  });

  // flush remaining code
  if (inCodeBlock && codeBuffer.length) {
    elements.push(
      <pre key="code-end" className="mb-2 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[11px] text-green-300">
        {codeBuffer.join('\n')}
      </pre>,
    );
  }

  return <>{elements}</>;
}

export default function IntelligenceDashboard({ level, status }: Props) {
  if (!level) return null;

  const isBreached = status === 'hacked';
  const isPending = status === 'pending';
  const isSecure = status === 'secure';

  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 border-b border-hacker-border bg-hacker-surface/30 px-4 py-3 sm:grid-cols-2">
      {/* ── Left: Mission Objective ── */}
      <div className="rounded-lg border border-hacker-border bg-hacker-surface/60 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Target size={13} className="text-hacker-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            任务目标
          </span>
        </div>
        <div className="text-[12px] leading-relaxed text-gray-300">
          <MarkdownInline text={level.objective} />
        </div>
      </div>

      {/* ── Right: Protected Data Box ── */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border p-3 transition-all duration-300',
          isBreached
            ? 'animate-data-breached border-red-500 bg-red-950/30'
            : isSecure
              ? 'animate-glow-pulse border-green-500/60 bg-green-950/20'
              : isPending
                ? 'border-hacker-accent/40 bg-hacker-accent-dim/50'
                : 'border-hacker-border bg-hacker-surface/60',
        )}
      >
        {/* Background pattern overlay */}
        {isBreached && (
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(239,68,68,0.03)_8px,rgba(239,68,68,0.03)_16px)]" />
        )}

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isBreached ? (
              <ShieldOff size={13} className="text-red-400" />
            ) : (
              <Shield size={13} className={cn(isSecure ? 'text-green-400' : 'text-gray-500')} />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              受保护的数据
            </span>
          </div>
          {/* Status badge */}
          {isBreached && (
            <span className="flex animate-pulse items-center gap-1 rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
              <AlertTriangle size={10} />
              数据已泄露
            </span>
          )}
          {isSecure && (
            <span className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">
              防御成功
            </span>
          )}
          {!isBreached && !isSecure && level && (
            <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-500">
              保护中
            </span>
          )}
        </div>

        {/* Data content */}
        <div className="relative z-10 mt-2 rounded bg-black/30 p-2.5 font-mono text-[11px] leading-relaxed">
          <MarkdownBlock text={level.protectedInfo} />
        </div>

        {/* Breached overlay — removed per user request, content remains fully visible */}
      </div>
    </div>
  );
}
