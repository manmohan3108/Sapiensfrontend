import { useEffect, useRef } from 'react';
import { Terminal, AlertCircle } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';
import { Output as OutputType } from '../../types/sapiensTypes';

// True terminal entry
function OutputEntry({ output, index }: { output: OutputType; index: number }) {
  const isError = output.type === 'error';
  const isResult = output.type === 'result';

  return (
    <div className="group font-mono text-[11px] leading-relaxed">
      {/* Prompt line */}
      <div className="flex items-start gap-2">
        <span className="text-emerald-500/50 flex-shrink-0 mt-0.5 select-none">
          {isError ? '✗' : isResult ? '◆' : '›'}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`whitespace-pre-wrap break-words ${
            isError ? 'text-red-400/80' : isResult ? 'text-cyan-300/70' : 'text-emerald-300/70'
          }`}>
            {output.content}
          </p>
          <p className="text-white/15 text-[10px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(output.timestamp)}
          </p>
        </div>
        {isError && <AlertCircle className="w-3 h-3 text-red-500/60 flex-shrink-0 mt-0.5" />}
      </div>
    </div>
  );
}

export function OutputConsole() {
  const outputs = useSapiensStore((s) => s.outputs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [outputs]);

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50"
      style={{ background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(20px)' }}
    >
      {/* Terminal title bar */}
      <div
        className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <Terminal className="w-3 h-3 text-white/30" />
          <span className="text-[11px] text-white/25 font-mono">sapiens — output</span>
        </div>
        {outputs.length > 0 && (
          <span className="text-[10px] text-white/20 font-mono tabular-nums">{outputs.length} lines</span>
        )}
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5"
        style={{
          // Subtle scanline texture
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,100,0.012) 1px, rgba(0,255,100,0.012) 2px)',
        }}
      >
        {/* Static startup lines */}
        <div className="font-mono text-[10px] text-emerald-500/25 pb-1 border-b border-white/[0.04] mb-2 select-none">
          <p>Sapiens Cognitive AI — Output Stream v1.0</p>
          <p>Session initialized. Awaiting results…</p>
        </div>

        {outputs.length === 0 ? (
          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-500/30 select-none">
            <span>$</span>
            <span className="animate-pulse">_</span>
          </div>
        ) : (
          outputs.map((o, i) => (
            <OutputEntry key={o.id} output={o} index={i} />
          ))
        )}

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-500/25 select-none">
          <span>$</span>
          <span className="w-1.5 h-3.5 bg-emerald-500/40 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}
