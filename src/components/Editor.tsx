import { FileCode, Send } from 'lucide-react';
import { cn } from '@/lib/cn';

type EditorProps = {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  onSubmit?: () => void;
};

export default function Editor({ code, onChange, readOnly = false, onSubmit }: EditorProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center justify-between border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-hacker-accent" />
          <span className="text-xs text-gray-400">index.html</span>
        </div>

        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={readOnly}
            className={cn(
              'flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors',
              readOnly
                ? 'cursor-not-allowed bg-gray-800 text-gray-600'
                : 'bg-hacker-accent/20 text-hacker-accent hover:bg-hacker-accent/30',
            )}
          >
            <Send size={12} />
            提交挑战
          </button>
        )}
      </div>

      <textarea
        readOnly={readOnly}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none border-none bg-transparent p-4 font-mono text-sm leading-relaxed text-green-400 caret-hacker-accent outline-none selection:bg-hacker-accent-dim"
        spellCheck={false}
      />
    </div>
  );
}
