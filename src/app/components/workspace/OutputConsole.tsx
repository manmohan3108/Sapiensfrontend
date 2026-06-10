import { useEffect, useRef, useState } from 'react';
import { Terminal, AlertCircle, Copy, Check, Trash2 } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';
import { Output as OutputType } from '../../types/sapiensTypes';

function OutputLine({ o }: { o: OutputType }) {
  const isErr = o.type === 'error';
  const isRes = o.type === 'result';
  return (
    <div className="group flex gap-2 font-mono text-[11px] leading-relaxed py-0.5">
      <span
        className="flex-shrink-0 select-none mt-0.5 w-3 text-center"
        style={{ color: isErr ? '#f87171' : isRes ? '#22d3ee' : 'rgba(52,211,153,0.5)' }}
      >
        {isErr ? '✗' : isRes ? '◆' : '›'}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="whitespace-pre-wrap break-words"
          style={{ color: isErr ? '#fca5a5' : isRes ? 'rgba(34,211,238,0.85)' : 'rgba(110,231,183,0.75)' }}
        >
          {o.content}
        </p>
        <p
          className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity font-mono mt-0.5"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          {formatTime(o.timestamp)}
        </p>
      </div>
      {isErr && <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'rgba(248,113,113,0.6)' }} />}
    </div>
  );
}

export function OutputConsole() {
  const outputs = useSapiensStore((s) => s.outputs);
  const clearOutputs = useSapiensStore((s) => s.clearOutputs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [outputs]);

  const copyAll = async () => {
    const text = outputs.map((o) => `[${o.type.toUpperCase()}] ${o.content}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(3,6,14,0.96)',
        border: '1px solid rgba(52,211,153,0.18)',
        boxShadow: '0 0 0 1px rgba(52,211,153,0.06), inset 0 1px 0 rgba(52,211,153,0.1), 0 30px 60px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Subtle scanline */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff6420 2px, #00ff6420 3px)' }}
      />

      {/* Green top accent */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #065f46, #10b981, #065f46)', flexShrink: 0, position: 'relative', zIndex: 10 }} />

      {/* Title bar */}
      <div
        className="flex-shrink-0 flex items-center px-3 py-2 gap-2 relative z-10"
        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* macOS traffic lights */}
        <div className="flex items-center gap-1.5">
          {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
            <span
              key={c}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: c, opacity: 0.55 }}
            />
          ))}
        </div>

        {/* Icon + label */}
        <div className="flex items-center gap-1.5 ml-1">
          <Terminal className="w-3 h-3" style={{ color: 'rgba(52,211,153,0.5)' }} />
          <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Output
          </span>
        </div>

        <div className="flex-1" />

        {/* Controls */}
        {outputs.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono tabular-nums" style={{ color: 'rgba(52,211,153,0.35)' }}>
              {outputs.length}
            </span>
            <button
              onClick={copyAll}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all"
              style={{ color: copied ? '#34d399' : 'rgba(255,255,255,0.25)', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={clearOutputs}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#f87171';
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 relative z-10">
        {outputs.length === 0 ? (
          <div className="flex items-center gap-2 font-mono text-[11px] select-none py-1"
            style={{ color: 'rgba(52,211,153,0.3)' }}>
            <span style={{ color: 'rgba(52,211,153,0.45)' }}>$</span>
            <span className="animate-pulse">_</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {outputs.map((o) => <OutputLine key={o.id} o={o} />)}
          </div>
        )}

        {/* Blinking cursor */}
        {outputs.length > 0 && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] mt-2 select-none"
            style={{ color: 'rgba(52,211,153,0.25)' }}>
            <span>$</span>
            <span className="w-1.5 h-3.5 animate-pulse rounded-sm"
              style={{ background: 'rgba(52,211,153,0.35)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
