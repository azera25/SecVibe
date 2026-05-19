import { Lock, CheckCircle2, PlayCircle, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/cn';

const LEVELS = [
  { id: 1, label: '关卡 1', status: 'completed' as const },
  { id: 2, label: '关卡 2', status: 'active' as const },
  { id: 3, label: '关卡 3', status: 'locked' as const },
];

const STATUS_ICON = {
  completed: CheckCircle2,
  active: PlayCircle,
  locked: Lock,
};

const STATUS_COLOR = {
  completed: 'text-hacker-accent',
  active: 'text-hacker-secondary',
  locked: 'text-gray-600',
};

export default function Sidebar() {
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
          {LEVELS.map((level) => {
            const Icon = STATUS_ICON[level.status];
            const isActive = level.status === 'active';

            return (
              <button
                key={level.id}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 px-5 py-3 text-left text-sm transition-colors',
                  isActive
                    ? 'border-l-hacker-accent bg-hacker-accent-dim text-hacker-accent'
                    : 'border-l-transparent text-gray-400 hover:bg-hacker-surface hover:text-gray-200',
                )}
              >
                <Icon size={16} className={cn('flex-shrink-0', STATUS_COLOR[level.status])} />
                <span>{level.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
