'use client';

import { Lightbulb, X, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  visible: boolean;
  loading: boolean;
  content: string;
  onClose: () => void;
  /** 战后复盘模式（显示不同标题） */
  isPostmortem?: boolean;
};

/** 简单的行内 Markdown 渲染（粗体、代码、换行） */
function MarkdownText({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // 空行
        if (!line.trim()) return <div key={i} className="h-1" />;

        // 分割 **bold** 和 `code`
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        const elements = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-amber-200">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={j} className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={j}>{part}</span>;
        });

        return (
          <div key={i} className="text-[12px] leading-relaxed text-gray-300">
            {elements}
          </div>
        );
      })}
    </>
  );
}

export default function TutorSuggestion({ visible, loading, content, onClose, isPostmortem = false }: Props) {
  return (
    <div
      className={cn(
        'overflow-y-auto border-l-2 transition-all duration-400 ease-in-out',
        visible ? 'max-h-[50vh] border-amber-500/60 opacity-100' : 'max-h-0 border-transparent opacity-0',
      )}
    >
      <div className="rounded border border-amber-500/20 bg-amber-950/15 p-3">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className={cn(isPostmortem ? 'text-red-400' : 'text-amber-400')} />
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isPostmortem ? 'text-red-400/80' : 'text-amber-400/80')}>
              {isPostmortem ? '💡 漏洞分析' : 'AI 导师建议'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-gray-600 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            <span className="text-[12px] text-gray-500">正在分析您的防御逻辑...</span>
          </div>
        ) : content ? (
          <div className="rounded bg-black/20 p-2.5">
            <MarkdownText text={content} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
