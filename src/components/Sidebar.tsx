import { Lock, CheckCircle2, PlayCircle, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Level } from '@/types';

type SidebarProps = {
  levels: Level[];
  activeLevelId: string | null;
  completedIds: string[];
  unlockedIds: string[];
  onSelect: (id: string) => void;
};

export default function Sidebar({ levels, activeLevelId, completedIds, unlockedIds, onSelect }: SidebarProps) {
  return (
    <>
      <button
        className="fixed left-2 top-2 z-20 rounded border border-hacker-border bg-hacker-bg p-2 text-gray-400 hover:text-hacker-accent lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <aside className="hidden h-full w-60 flex-shrink-0 flex-col border-r border-hacker-border bg-hacker-bg lg:flex">
        <div className="flex items-center justify-between border-b border-hacker-border px-5 py-4">
          <h2 className="text-sm tracking-widest text-gray-500 uppercase">关卡</h2>
          <ChevronLeft size={16} className="text-gray-600" />
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {levels.map((level) => {
            const isActive = level.id === activeLevelId;
            const isCompleted = completedIds.includes(level.id);
            const isUnlocked = unlockedIds.includes(level.id);
            const isLocked = !isActive && !isCompleted && !isUnlocked;

            let Icon = PlayCircle;
            let iconColor = 'text-gray-500';
            if (isCompleted) {
              Icon = CheckCircle2;
              iconColor = 'text-hacker-accent';
            } else if (isActive) {
              Icon = PlayCircle;
              iconColor = 'text-hacker-secondary';
            } else if (isUnlocked) {
              Icon = PlayCircle;
              iconColor = 'text-gray-400';
            } else {
              Icon = Lock;
              iconColor = 'text-gray-600';
            }

            return (
              <button
                key={level.id}
                disabled={isLocked}
                onClick={() => onSelect(level.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 px-5 py-3 text-left text-sm transition-colors',
                  isActive
                    ? 'border-l-hacker-accent bg-hacker-accent-dim text-hacker-accent'
                    : 'border-l-transparent text-gray-400',
                  !isLocked && 'hover:bg-hacker-surface hover:text-gray-200',
                  isLocked && 'cursor-not-allowed opacity-50',
                )}
              >
                <Icon size={16} className={cn('flex-shrink-0', iconColor)} />
                <span>{level.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
