import { Monitor } from 'lucide-react';

export default function Preview() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center gap-2 border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <Monitor size={14} className="text-hacker-secondary" />
        <span className="text-xs text-gray-400">Live Preview</span>
      </div>

      <div className="flex flex-1 items-center justify-center text-sm text-gray-600">
        <span className="text-center">
          预览区域
          <br />
          <span className="text-[11px] text-gray-700">等待内容渲染...</span>
        </span>
      </div>
    </div>
  );
}
