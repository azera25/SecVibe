import { Monitor } from 'lucide-react';

type PreviewProps = {
  code?: string;
};

export default function Preview({ code }: PreviewProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-hacker-border bg-hacker-surface">
      <div className="flex items-center gap-2 border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <Monitor size={14} className="text-hacker-secondary" />
        <span className="text-xs text-gray-400">Live Preview</span>
      </div>

      {code ? (
        <iframe
          srcDoc={code}
          className="h-full w-full border-none bg-white"
          title="Preview"
          sandbox="allow-scripts"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-600">
          <span className="text-center">
            预览区域
            <br />
            <span className="text-[11px] text-gray-700">
              选择一个关卡开始挑战
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
