'use client';

import { useState, useCallback, useMemo } from 'react';
import { Shield, Swords, RotateCcw, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import Sandbox from '@/components/Sandbox';
import TerminalLog from '@/components/Terminal';
import { level1 } from '@/content/levels/level1';
import { level2 } from '@/content/levels/level2';
import { level3 } from '@/content/levels/level3';
import { cn } from '@/lib/cn';
import { generateAttackPayload } from '@/lib/ai';
import type { Level, LogEntry, VulnerabilityType, Difficulty } from '@/types';

/* ── Level registry ── */
const LEVELS: Level[] = [level1, level2, level3];

/* ── 漏洞类型 UI 映射 ── */
const VULN_META: Record<string, { label: string; color: string }> = {
  xss: { label: 'XSS', color: 'text-red-400 border-red-800 bg-red-950/40' },
  sqli: { label: 'SQLi', color: 'text-blue-400 border-blue-800 bg-blue-950/40' },
  'command-injection': { label: '命令注入', color: 'text-orange-400 border-orange-800 bg-orange-950/40' },
  'dom-xss': { label: 'DOM XSS', color: 'text-purple-400 border-purple-800 bg-purple-950/40' },
};

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const DIFF_COLOR: Record<Difficulty, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

function VulnBadge({ type }: { type: VulnerabilityType }) {
  const m = VULN_META[type] ?? { label: type.toUpperCase(), color: 'text-gray-400 border-gray-800 bg-gray-950/40' };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] leading-tight', m.color)}>
      <Shield size={10} />
      {m.label}
    </span>
  );
}

/* ── Helpers ── */
function formatTime(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function levelToAttackType(levelId: string): 'xss' | 'sqli' | 'command-injection' | 'dom-xss' {
  if (levelId === 'xss-basics') return 'xss';
  if (levelId === 'sql-injection') return 'sqli';
  if (levelId === 'dom-xss-advanced') return 'dom-xss';
  return 'command-injection';
}

const INITIAL_LOGS: LogEntry[] = [
  { time: formatTime(), level: 'INFO', message: '挑战环境初始化...' },
  { time: formatTime(), level: 'INFO', message: '沙箱容器已启动' },
  { time: formatTime(), level: 'INFO', message: '等待用户操作...' },
];

/* ── Page ── */
export default function HomePage() {
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([LEVELS[0].id]);
  const [attackPayload, setAttackPayload] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeLevel = LEVELS.find((l) => l.id === activeLevelId) ?? null;
  const hasLaunched = attackPayload !== undefined;

  /* Code sent to sandbox — level-specific injections */
  const sandboxCode = useMemo(() => {
    if (!attackPayload || !code) return code;
    // Level 1: replace XSS payload placeholder
    if (activeLevelId === 'xss-basics') {
      return code.replace(/___XSS_PAYLOAD___/g, attackPayload);
    }
    // Level 2 & 3: payload delivered via window.__ATTACK_PAYLOAD__ (judge script)
    return code;
  }, [code, attackPayload, activeLevelId]);

  /* ── Select level ── */
  const handleSelectLevel = useCallback((id: string) => {
    const level = LEVELS.find((l) => l.id === id);
    if (!level) return;

    setActiveLevelId(id);
    setCode(level.initialCode);
    setAttackPayload(undefined);
    setIsGenerating(false);
    setLogs([
      { time: formatTime(), level: 'INFO', message: `加载关卡：${level.title}` },
      { time: formatTime(), level: 'INFO', message: '就绪，请分析代码并修复漏洞。' },
    ]);
  }, []);

  /* ── Submit code ── */
  const handleSubmit = useCallback(() => {
    if (!activeLevel) return;
    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'INFO', message: '正在分析代码安全漏洞...' },
    ]);
  }, [activeLevel]);

  /* ── Launch AI attack ── */
  const handleLaunchAttack = useCallback(async () => {
    if (!activeLevel || isGenerating) return;

    setIsGenerating(true);
    setAttackPayload(undefined);

    const attackType = levelToAttackType(activeLevel.id);

    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'INFO', message: `[AI] 正在针对 ${VULN_META[attackType]?.label ?? attackType} 生成攻击载荷...` },
    ]);

    const result = await generateAttackPayload(attackType);

    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'WARN', message: `[AI] 载荷已生成 (${result.source === 'deepseek' ? 'DeepSeek' : '内置库'}): ${result.payload}` },
      { time: formatTime(), level: 'WARN', message: '正在注入沙箱并监测运行时行为...' },
    ]);

    setAttackPayload(result.payload);
    setIsGenerating(false);
  }, [activeLevel, isGenerating]);

  /* ── Attack detected — 防守失败 ── */
  const handleAttackDetected = useCallback(
    (result: { attackType: string; vector: string; detail: string }) => {
      const isDomXss = result.attackType === 'dom-xss';

      setLogs((prev) => [
        ...prev,
        {
          time: formatTime(),
          level: 'ERROR',
          message: `⚔ 攻击命中！[${result.attackType.toUpperCase()}] 向量: ${result.vector} — ${result.detail}`,
        },
        {
          time: formatTime(),
          level: 'ERROR',
          message: isDomXss
            ? ' verdict: 防守失败。只过滤 <script> 标签是不够的，要注意属性注入！'
            : ' verdict: 防守失败，你的代码仍存在漏洞，请继续修复。',
        },
        ...(isDomXss
          ? [{
              time: formatTime(),
              level: 'WARN' as const,
              message: '💡 提示：攻击者通过闭合双引号插入了 onerror 事件。使用 DOM API (createElement) 替代 innerHTML 拼接可以彻底防御此类攻击。',
            }]
          : []),
      ]);
    },
    [],
  );

  /* ── Secure — 防守成功 ── */
  const handleSecure = useCallback(() => {
    if (!activeLevel) return;

    setLogs((prev) => [
      ...prev,
      {
        time: formatTime(),
        level: 'INFO',
        message: '✅ 防守成功！你的代码成功抵御了 AI 攻击。',
      },
    ]);

    // 标记关卡完成 & 解锁下一关
    setCompletedIds((prev) => {
      if (prev.includes(activeLevel.id)) return prev;
      return [...prev, activeLevel.id];
    });

    const currentIndex = LEVELS.findIndex((l) => l.id === activeLevel.id);
    const nextLevel = LEVELS[currentIndex + 1];
    if (nextLevel) {
      setUnlockedIds((prev) => {
        if (prev.includes(nextLevel.id)) return prev;
        return [...prev, nextLevel.id];
      });
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), level: 'INFO', message: `🔓 新关卡已解锁：${nextLevel.title}` },
      ]);
    }
  }, [activeLevel]);

  /* ── Sandbox ready ── */
  const handleSandboxReady = useCallback(() => {
    if (!hasLaunched) return;
    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'INFO', message: '沙箱就绪，攻击载荷已注入。' },
    ]);
  }, [hasLaunched]);

  /* ── 开发者模式：解锁全部关卡 ── */
  const handleDevUnlock = useCallback(() => {
    setUnlockedIds(LEVELS.map((l) => l.id));
    setCompletedIds(LEVELS.map((l) => l.id));
    setLogs((prev) => [
      ...prev,
      { time: formatTime(), level: 'WARN', message: '🔓 开发者模式：全部关卡已解锁！' },
    ]);
  }, []);

  /* ── Render ── */
  return (
    <div className="flex h-full">
      <Sidebar
        levels={LEVELS}
        activeLevelId={activeLevelId}
        completedIds={completedIds}
        unlockedIds={unlockedIds}
        onSelect={handleSelectLevel}
        onDevUnlock={handleDevUnlock}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* ── Action bar ── */}
        {activeLevel && (
          <div className="flex shrink-0 items-center justify-between border-b border-hacker-border bg-hacker-surface/50 px-4 py-2">
            {/* Left: level info */}
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-gray-200">{activeLevel.title}</span>
              <VulnBadge type={activeLevel.vulnerabilityType} />
              <span className={cn('text-[10px]', DIFF_COLOR[activeLevel.difficulty])}>
                {DIFF_LABEL[activeLevel.difficulty]}
              </span>
            </div>

            {/* Right: CTA */}
            {isGenerating ? (
              <button
                disabled
                className="flex cursor-wait items-center gap-2 rounded-lg border border-hacker-accent/30 bg-hacker-accent/5 px-5 py-2 text-sm text-hacker-accent/60"
              >
                <Loader2 size={16} className="animate-spin" />
                AI 生成中...
              </button>
            ) : !hasLaunched ? (
              <button
                onClick={handleLaunchAttack}
                className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-hacker-accent/50 bg-hacker-accent/10 px-5 py-2 text-sm font-medium text-hacker-accent transition-all hover:bg-hacker-accent/20 hover:shadow-[0_0_20px_rgba(0,255,0,0.15)]"
              >
                <span className="absolute inset-0 animate-pulse rounded-lg bg-hacker-accent/5" />
                <Swords size={16} className="transition-transform group-hover:scale-110" />
                开始挑战
              </button>
            ) : (
              <button
                onClick={handleLaunchAttack}
                className="flex items-center gap-1.5 rounded border border-red-800/50 bg-red-950/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-950/60"
              >
                <RotateCcw size={12} />
                再次攻击
              </button>
            )}
          </div>
        )}

        {/* ── Split view ── */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Editor */}
          <section className="flex flex-1 flex-col overflow-hidden border-b border-hacker-border lg:border-b-0 lg:border-r lg:p-3">
            <div className="flex h-full flex-col p-2 lg:p-0">
              <Editor
                code={code}
                onChange={setCode}
                readOnly={!activeLevel}
                onSubmit={activeLevel ? handleSubmit : undefined}
              />
            </div>
          </section>

          {/* Sandbox + Terminal */}
          <section className="flex flex-1 flex-col overflow-hidden lg:max-w-[40%]">
            <div className="flex flex-1 flex-col gap-0">
              <div className="flex-1 overflow-hidden p-2 pb-1 lg:p-3 lg:pb-1.5">
                <Sandbox
                  userCode={sandboxCode}
                  attackPayload={attackPayload}
                  onAttackDetected={handleAttackDetected}
                  onSecure={handleSecure}
                  onSandboxReady={handleSandboxReady}
                />
              </div>
              <div className="flex-1 overflow-hidden p-2 pt-1 lg:p-3 lg:pt-1.5">
                <TerminalLog logs={logs} />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
