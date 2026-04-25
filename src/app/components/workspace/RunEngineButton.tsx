import { useState, useRef } from 'react';
import { Cpu, Sparkles, CheckCircle2, AlertCircle, Plus, Minus, RefreshCw } from 'lucide-react';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';

type RunState = 'idle' | 'running' | 'success' | 'error';

export function RunEngineButton() {
  const { runEngine } = useSapiens();
  const status = useSapiensStore((state) => state.status);

  const [runState, setRunState] = useState<RunState>('idle');
  const [runCount, setRunCount] = useState(1);
  const [currentRun, setCurrentRun] = useState(0);
  const [totalRuns, setTotalRuns] = useState(1);
  const abortRef = useRef(false);

  const isRunning = runState === 'running';
  const isSuccess = runState === 'success';
  const isError = runState === 'error';
  const isDisabled = isRunning || status === 'loading' || status === 'processing';

  const clampCount = (v: number) => Math.max(1, Math.min(20, v));

  const handleDecrement = () => {
    if (!isRunning) setRunCount((c) => clampCount(c - 1));
  };
  const handleIncrement = () => {
    if (!isRunning) setRunCount((c) => clampCount(c + 1));
  };
  const handleCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) setRunCount(clampCount(v));
  };

  const handleClick = async () => {
    if (isRunning) return;

    abortRef.current = false;
    const total = runCount;
    setTotalRuns(total);
    setCurrentRun(0);
    setRunState('running');

    try {
      for (let i = 1; i <= total; i++) {
        if (abortRef.current) break;
        setCurrentRun(i);
        await runEngine();
      }
      setRunState('success');
    } catch {
      setRunState('error');
    } finally {
      // Auto-reset after feedback
      setTimeout(() => {
        setRunState('idle');
        setCurrentRun(0);
      }, 3000);
    }
  };

  const handleAbort = () => {
    abortRef.current = true;
  };

  /* ── Success state ── */
  if (isSuccess) {
    return (
      <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {totalRuns > 1 ? `Done — ${totalRuns} runs` : 'Engine Done'}
      </div>
    );
  }

  /* ── Error state ── */
  if (isError) {
    return (
      <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-red-500/15 border border-red-500/30 text-red-400">
        <AlertCircle className="w-3.5 h-3.5" />
        Failed {currentRun > 0 ? `on run ${currentRun}` : ''}
      </div>
    );
  }

  /* ── Running state ── */
  if (isRunning) {
    return (
      <div className="flex items-center gap-1.5 h-8">
        {/* Progress pill */}
        <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-violet-500/15 border border-violet-500/40 text-violet-300 select-none">
          <span className="relative w-3.5 h-3.5 flex-shrink-0">
            <span className="absolute inset-0 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
          </span>

          {totalRuns > 1 ? (
            <span className="flex items-center gap-1">
              <span className="text-violet-200 tabular-nums">
                Run {currentRun} / {totalRuns}
              </span>
              {/* mini progress bar */}
              <span className="w-14 h-1 rounded-full bg-violet-900/60 overflow-hidden ml-1">
                <span
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 transition-all duration-500"
                  style={{ width: `${(currentRun / totalRuns) * 100}%` }}
                />
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              Thinking
              <span className="flex gap-0.5 items-end pb-px ml-0.5">
                <span className="w-0.5 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </span>
          )}
        </div>

        {/* Abort button — only visible in multi-run */}
        {totalRuns > 1 && (
          <button
            onClick={handleAbort}
            title="Stop after current run"
            className="flex items-center gap-1 px-2 h-8 rounded-lg text-xs
              bg-red-500/10 border border-red-500/30 text-red-400
              hover:bg-red-500/20 hover:border-red-400/50
              transition-all duration-150 active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            Stop
          </button>
        )}
      </div>
    );
  }

  /* ── Idle state ── */
  return (
    <div className="flex items-center gap-1 h-8">
      {/* Run-count stepper */}
      <div
        className="flex items-center h-8 rounded-lg overflow-hidden border border-white/10 bg-white/5
          backdrop-blur-sm select-none"
      >
        <button
          onClick={handleDecrement}
          disabled={runCount <= 1}
          title="Decrease run count"
          className="flex items-center justify-center w-6 h-full text-slate-400
            hover:text-slate-200 hover:bg-white/10
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-90"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>

        <div className="relative flex items-center justify-center px-1.5 h-full min-w-[2.4rem]">
          <input
            type="number"
            min={1}
            max={20}
            value={runCount}
            onChange={handleCountInput}
            className="w-full text-center text-xs text-slate-200 bg-transparent
              focus:outline-none tabular-nums leading-none
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {runCount > 1 && (
            <span className="absolute -top-0.5 -right-0.5 text-[9px] text-violet-400 font-medium leading-none">×</span>
          )}
        </div>

        <button
          onClick={handleIncrement}
          disabled={runCount >= 20}
          title="Increase run count"
          className="flex items-center justify-center w-6 h-full text-slate-400
            hover:text-slate-200 hover:bg-white/10
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-90"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Main Run Engine button */}
      <button
        onClick={handleClick}
        disabled={isDisabled}
        title={
          runCount > 1
            ? `Run Engine ${runCount} times sequentially`
            : 'Run Engine — Trigger cognitive rethink'
        }
        className="relative group flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs
          bg-gradient-to-r from-violet-600/80 to-indigo-600/80
          hover:from-violet-500 hover:to-indigo-500
          border border-violet-500/40 hover:border-violet-400/60
          text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/40
          transition-all duration-200 overflow-hidden
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.97]"
      >
        {/* Shimmer sweep */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        <Cpu className="w-3.5 h-3.5 relative transition-transform group-hover:rotate-12" />
        <span className="relative">
          Run Engine{runCount > 1 ? ` ×${runCount}` : ''}
        </span>
        <Sparkles className="w-2.5 h-2.5 relative opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}
