'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Monitor, Shield, ShieldOff, AlertTriangle } from 'lucide-react';
import { buildJudgeScript } from '@/lib/judgeScript';

/* ── Types ── */

type AttackDetection = {
  attackType: string;
  vector: string;
  detail: string;
};

type SandboxMessage = {
  type: string;
  source: string;
  ts: number;
  data?: any;
};

type SandboxProps = {
  userCode: string;
  attackPayload?: string;
  onAttackDetected?: (result: AttackDetection) => void;
  /** 攻击载荷注入后，若在判定窗口内未触发任何攻击，则回调此函数表示防守成功 */
  onSecure?: () => void;
  onSandboxReady?: () => void;
};

/* ── Helpers ── */

function injectJudgeScript(html: string, judgeScript: string): string {
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const idx = html.indexOf(bodyMatch[0]) + bodyMatch[0].length;
    return html.slice(0, idx) + judgeScript + html.slice(idx);
  }
  const headClose = html.indexOf('</head>');
  if (headClose !== -1) {
    return html.slice(0, headClose) + judgeScript + html.slice(headClose);
  }
  return judgeScript + html;
}

function wrapHtml(content: string): string {
  if (/<html[\s>]/i.test(content)) return content;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${content}</body></html>`;
}

/* ── Component ── */

export default function Sandbox({
  userCode,
  attackPayload,
  onAttackDetected,
  onSecure,
  onSandboxReady,
}: SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();
  const verdictTimer = useRef<ReturnType<typeof setTimeout>>();
  /** 跟踪当前 payload 是否已被判定（攻击命中 or 安全），防止重复回调 */
  const judgedRef = useRef(false);

  const [flash, setFlash] = useState(false);
  const [isHacked, setIsHacked] = useState(false);
  const [lastAttack, setLastAttack] = useState<AttackDetection | null>(null);

  /* Build injected HTML */
  const judgeScript = useMemo(() => buildJudgeScript(attackPayload), [attackPayload]);

  const html = useMemo(() => {
    if (!userCode) return '';
    const doc = wrapHtml(userCode);
    return injectJudgeScript(doc, judgeScript);
  }, [userCode, judgeScript]);

  /* Force iframe remount on code / payload change */
  const iframeKey = useMemo(() => {
    let hash = 0;
    const str = userCode + (attackPayload ?? '');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }, [userCode, attackPayload]);

  /* ── Start verdict timer (after SANDBOX_READY + payload present) ── */

  const startVerdictTimer = useCallback(() => {
    if (verdictTimer.current) clearTimeout(verdictTimer.current);
    judgedRef.current = false;
    console.log('[Sandbox] verdict timer started (1200ms)');

    verdictTimer.current = setTimeout(() => {
      console.log('[Sandbox] verdict timer FIRED, judgedRef:', judgedRef.current);
      if (!judgedRef.current) {
        judgedRef.current = true;
        console.log('[Sandbox] calling onSecure');
        onSecure?.();
      } else {
        console.log('[Sandbox] already judged, skipping onSecure');
      }
    }, 1200);
  }, [onSecure]);

  /* ── Message handler ── */

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const msg = event.data as SandboxMessage;
      if (msg?.source !== 'sandbox') return;

      console.log('[Sandbox] msg received:', msg.type, 'attackPayload:', !!attackPayload);

      switch (msg.type) {
        case 'SANDBOX_READY':
          onSandboxReady?.();
          console.log('[Sandbox] SANDBOX_READY, attackPayload:', !!attackPayload);
          if (attackPayload) {
            console.log('[Sandbox] starting verdict timer');
            startVerdictTimer();
          } else {
            console.log('[Sandbox] no attackPayload, timer NOT started');
          }
          break;

        case 'ATTACK_DETECTED':
          console.log('[Sandbox] ATTACK_DETECTED, judgedRef:', judgedRef.current);
          if (judgedRef.current) return;
          judgedRef.current = true;
          console.log('[Sandbox] attack adjudicated as HACKED');

          if (verdictTimer.current) clearTimeout(verdictTimer.current);

          setFlash(true);
          setIsHacked(true);
          setLastAttack({
            attackType: msg.data?.attackType ?? 'unknown',
            vector: msg.data?.vector ?? '',
            detail: msg.data?.detail ?? '',
          });
          onAttackDetected?.(msg.data);

          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlash(false), 1500);
          break;

        default:
          break;
      }
    },
    [onAttackDetected, onSandboxReady, attackPayload, startVerdictTimer],
  );

  useEffect(() => {
    console.log('[Sandbox] registering message listener, attackPayload:', !!attackPayload);
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('[Sandbox] removing message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  /* Reset when code changes — player is editing */
  useEffect(() => {
    console.log('[Sandbox] userCode changed, resetting state');
    setIsHacked(false);
    setLastAttack(null);
    setFlash(false);
    judgedRef.current = false;
    if (verdictTimer.current) {
      console.log('[Sandbox] clearing verdict timer due to userCode change');
      clearTimeout(verdictTimer.current);
    }
  }, [userCode]);

  /* Cleanup */
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (verdictTimer.current) clearTimeout(verdictTimer.current);
    };
  }, []);

  /* ── Render ── */

  const borderClass = flash
    ? 'border-red-500 shadow-[0_0_24px_rgba(255,0,0,0.6)]'
    : isHacked
      ? 'border-red-700'
      : 'border-hacker-border';

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-hacker-surface transition-all duration-300 ${borderClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hacker-border bg-[#0d0d0d] px-4 py-2">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-hacker-secondary" />
          <span className="text-xs text-gray-400">安全沙箱</span>
          {attackPayload && (
            <span className="ml-2 rounded bg-hacker-accent/10 px-1.5 py-0.5 text-[10px] text-hacker-accent">
              攻击模拟中
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isHacked && (
            <span className="flex animate-pulse items-center gap-1 text-xs text-red-400">
              <ShieldOff size={12} />
              HACKED
            </span>
          )}
          {!!attackPayload && !isHacked && !!userCode && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Shield size={12} />
              SECURE
            </span>
          )}
        </div>
      </div>

      {/* Iframe */}
      {html ? (
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={html}
          className="min-h-0 flex-1 w-full border-none bg-white"
          title="Security Sandbox"
          sandbox="allow-scripts"
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-gray-600">
          <span className="text-center">
            安全实验沙箱
            <br />
            <span className="text-[11px] text-gray-700">选择一个关卡开始挑战</span>
          </span>
        </div>
      )}

      {/* Attack detail bar */}
      {isHacked && lastAttack && (
        <div className="flex shrink-0 items-center gap-2 border-t border-red-800 bg-red-950/30 px-3 py-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-[11px] font-bold uppercase text-red-400">
            [{lastAttack.attackType}]
          </span>
          <span className="truncate text-[11px] text-gray-400">{lastAttack.detail}</span>
        </div>
      )}
    </div>
  );
}
