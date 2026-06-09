import { FileCode, Send, Lightbulb, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type EditorProps = {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  onSubmit?: () => void;
  /** AI 导师提示按钮 */
  onHint?: () => void;
  hintLoading?: boolean;
  /** 防御失败时按钮显示呼吸灯，引导点击复盘 */
  attackFailed?: boolean;
  /** AI 解题按钮 */
  onSolve?: () => void;
  solveLoading?: boolean;
};

export default function Editor({
  code,
  onChange,
  readOnly = false,
  onSubmit,
  onHint,
  hintLoading = false,
  attackFailed = false,
  onSolve,
  solveLoading = false,
}: EditorProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center justify-between border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-hacker-accent" />
          <span className="text-xs text-gray-400">index.html</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* AI 解题按钮 */}
          {onSolve && (
            <button
              onClick={onSolve}
              disabled={readOnly || solveLoading}
              className={cn(
                'flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors',
                readOnly || solveLoading
                  ? 'cursor-not-allowed bg-gray-800 text-gray-600'
                  : 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25',
              )}
            >
              {solveLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Wand2 size={12} />
              )}
              解题
            </button>
          )}

          {/* AI 导师提示按钮 */}
          {onHint && (
            <button
              onClick={onHint}
              disabled={readOnly || hintLoading}
              className={cn(
                'flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-all',
                readOnly || hintLoading
                  ? 'cursor-not-allowed bg-gray-800 text-gray-600'
                  : attackFailed
                    ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse hover:bg-amber-500/30'
                    : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25',
              )}
            >
              {hintLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Lightbulb size={12} />
              )}
              {attackFailed ? '战后复盘' : '获取提示'}
            </button>
          )}

          {/* 提交挑战按钮 */}
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
      </div>

      <textarea
        readOnly={readOnly}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none overflow-auto border-none bg-transparent p-4 font-mono text-sm leading-relaxed text-green-400 caret-hacker-accent outline-none selection:bg-hacker-accent-dim"
        spellCheck={false}
      />
    </div>
  );
}
