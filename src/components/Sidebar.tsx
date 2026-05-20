import {
  Lock,
  CheckCircle2,
  PlayCircle,
  ChevronLeft,
  Menu,
  Shield,
  Bug,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Level, VulnerabilityType, Difficulty } from '@/types';

/* ── 漏洞类型 → UI 映射 ── */

const VULN_META: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  xss: {
    label: 'XSS',
    color: 'text-red-400 border-red-800 bg-red-950/40',
    icon: Bug,
  },
  sqli: {
    label: 'SQLi',
    color: 'text-blue-400 border-blue-800 bg-blue-950/40',
    icon: Terminal,
  },
  'command-injection': {
    label: 'CMD',
    color: 'text-orange-400 border-orange-800 bg-orange-950/40',
    icon: Terminal,
  },
  'dom-xss': {
    label: 'DOM XSS',
    color: 'text-purple-400 border-purple-800 bg-purple-950/40',
    icon: Bug,
  },
};

function getVulnMeta(type: VulnerabilityType) {
  return VULN_META[type] ?? { label: type.toUpperCase(), color: 'text-gray-400 border-gray-800 bg-gray-950/40', icon: Shield };
}

/* ── 难度指示器 ── */

function DifficultyDots({ difficulty }: { difficulty: Difficulty }) {
  const count = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  const color =
    difficulty === 'easy'
      ? 'bg-green-500'
      : difficulty === 'medium'
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <span className="flex items-center gap-[3px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={cn('h-1.5 w-1.5 rounded-full', i < count ? color : 'bg-gray-700')}
        />
      ))}
    </span>
  );
}

function DifficultyLabel({ difficulty }: { difficulty: Difficulty }) {
  const labels = { easy: '简单', medium: '中等', hard: '困难' };
  const colors = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };
  return <span className={cn('text-[10px]', colors[difficulty])}>{labels[difficulty]}</span>;
}

/* ── Sidebar props ── */

type SidebarProps = {
  levels: Level[];
  activeLevelId: string | null;
  completedIds: string[];
  unlockedIds: string[];
  onSelect: (id: string) => void;
  /** 开发者模式：解锁全部关卡 */
  onDevUnlock?: () => void;
};

/* ── Component ── */

export default function Sidebar({
  levels,
  activeLevelId,
  completedIds,
  unlockedIds,
  onSelect,
  onDevUnlock,
}: SidebarProps) {
  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-2 top-2 z-20 rounded border border-hacker-border bg-hacker-bg p-2 text-gray-400 hover:text-hacker-accent lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-hacker-border bg-hacker-bg lg:flex">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hacker-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm tracking-widest text-gray-500 uppercase">关卡</h2>
            <button
              onClick={onDevUnlock}
              className="rounded px-1.5 py-0.5 text-[10px] text-gray-700 opacity-0 transition-opacity hover:bg-hacker-surface hover:text-gray-500 hover:opacity-100 group-hover/ sidebar:opacity-100"
              title="开发者模式：解锁全部关卡"
            >
              DEV
            </button>
          </div>
          <ChevronLeft size={16} className="text-gray-600" />
        </div>

        {/* Level list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {levels.map((level) => {
            const isActive = level.id === activeLevelId;
            const isCompleted = completedIds.includes(level.id);
            const isUnlocked = unlockedIds.includes(level.id);
            const isLocked = !isActive && !isCompleted && !isUnlocked;
            const meta = getVulnMeta(level.vulnerabilityType);
            const Icon = isActive ? meta.icon : isCompleted ? CheckCircle2 : isLocked ? Lock : PlayCircle;

            let iconColor = 'text-gray-500';
            if (isCompleted) iconColor = 'text-hacker-accent';
            else if (isActive) iconColor = 'text-hacker-secondary';
            else if (isUnlocked) iconColor = 'text-gray-400';

            return (
              <button
                key={level.id}
                disabled={isLocked}
                onClick={() => onSelect(level.id)}
                className={cn(
                  'group flex w-full flex-col gap-1 border-l-2 px-5 py-3 text-left text-sm transition-colors',
                  isActive
                    ? 'border-l-hacker-accent bg-hacker-accent-dim text-hacker-accent'
                    : 'border-l-transparent text-gray-400',
                  !isLocked && 'hover:bg-hacker-surface hover:text-gray-200',
                  isLocked && 'cursor-not-allowed opacity-50',
                )}
              >
                {/* Top row: icon + title + status */}
                <div className="flex items-center gap-2">
                  <Icon size={15} className={cn('flex-shrink-0', iconColor)} />
                  <span className="font-medium">{level.title}</span>
                </div>

                {/* Bottom row: vulnerability badge + difficulty */}
                <div className="flex items-center gap-2 pl-[23px]">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] leading-tight',
                      meta.color,
                    )}
                  >
                    <meta.icon size={10} />
                    {meta.label}
                  </span>
                  <DifficultyDots difficulty={level.difficulty} />
                  <DifficultyLabel difficulty={level.difficulty} />
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
