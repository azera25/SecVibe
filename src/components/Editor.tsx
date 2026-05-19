import { FileCode } from 'lucide-react';

export default function Editor() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center gap-2 border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <FileCode size={14} className="text-hacker-accent" />
        <span className="text-xs text-gray-400">index.html</span>
      </div>

      <textarea
        readOnly
        value={`<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8" />\n  <title>SecVibe</title>\n</head>\n<body>\n  <h1>Hello, 世界</h1>\n</body>\n</html>`}
        className="flex-1 resize-none border-none bg-transparent p-4 font-mono text-sm leading-relaxed text-green-400 caret-hacker-accent outline-none selection:bg-hacker-accent-dim"
        spellCheck={false}
      />
    </div>
  );
}
