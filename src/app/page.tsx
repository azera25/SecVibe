'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import Preview from '@/components/Preview';
import TerminalLog from '@/components/Terminal';
import { level1 } from '@/content/levels/level1';
import { level2 } from '@/content/levels/level2';
import { level3 } from '@/content/levels/level3';
import type { Level, LogEntry } from '@/types';

const LEVELS: Level[] = [level1, level2, level3];

function formatTime(): string {
  const d = new Date();
  return d.toLocaleTimeString('zh-CN', { hour12: false });
}

const INITIAL_LOGS: LogEntry[] = [
  { time: formatTime(), level: 'INFO', message: '挑战环境初始化...' },
  { time: formatTime(), level: 'INFO', message: '沙箱容器已启动' },
  { time: formatTime(), level: 'INFO', message: '等待用户操作...' },
];

export default function HomePage() {
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([LEVELS[0].id]);

  const activeLevel = LEVELS.find((l) => l.id === activeLevelId) ?? null;

  const handleSelectLevel = useCallback((id: string) => {
    const level = LEVELS.find((l) => l.id === id);
    if (!level) return;

    setActiveLevelId(id);
    setCode(level.initialCode);
    setLogs([
      { time: formatTime(), level: 'INFO', message: `加载关卡：${level.title}` },
      { time: formatTime(), level: 'INFO', message: '就绪，请分析代码并修复漏洞。' },
    ]);
  }, []);

  const handleSubmit = useCallback(() => {
    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'INFO', message: '正在分析代码安全漏洞...' },
    ]);
  }, []);

  return (
    <div className="flex h-full">
      <Sidebar
        levels={LEVELS}
        activeLevelId={activeLevelId}
        completedIds={completedIds}
        unlockedIds={unlockedIds}
        onSelect={handleSelectLevel}
      />

      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="flex flex-1 flex-col overflow-hidden border-b border-hacker-border p-2 lg:border-b-0 lg:border-r lg:p-3">
          <Editor
            code={code}
            onChange={setCode}
            readOnly={!activeLevel}
            onSubmit={activeLevel ? handleSubmit : undefined}
          />
        </section>

        <section className="flex flex-1 flex-col overflow-hidden lg:max-w-[40%]">
          <div className="flex flex-1 flex-col gap-0">
            <div className="flex-1 overflow-hidden p-2 pb-1 lg:p-3 lg:pb-1.5">
              <Preview code={code} />
            </div>
            <div className="flex-1 overflow-hidden p-2 pt-1 lg:p-3 lg:pt-1.5">
              <TerminalLog logs={logs} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
