import { useState } from 'react';
import { Brain, Home, Save, ChevronRight, Cpu, Wifi, Bug, Clock, DatabaseZap, Hourglass, PlugZap, BarChart3, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ThemeToggle } from '../ThemeToggle';
import { RunEngineButton } from './RunEngineButton';
import { LlmUsageDialog } from './LlmUsageDialog';

export function HeaderBar() {
  const [showLlmUsage, setShowLlmUsage] = useState(false);
  const { currentSapiens } = useSapiensStore();
  const { saveSapiens, returnToHome } = useSapiens();
  const navigate = useNavigate();
  const status = useSapiensStore((s) => s.status);
  const isOverloaded = useSapiensStore((s) => s.isOverloaded);
  const showDebugPanel = useSapiensStore((s) => s.showDebugPanel);
  const toggleDebugPanel = useSapiensStore((s) => s.toggleDebugPanel);
  const setShowMemoryTimeline = useSapiensStore((s) => s.setShowMemoryTimeline);

  if (!currentSapiens) return null;

  const isProcessing = status === 'processing' || status === 'loading';

  const statusColors = {
    idle:       { dot: '#34d399', label: 'Ready',      glow: 'rgba(52,211,153,0.5)' },
    processing: { dot: '#fbbf24', label: 'Processing', glow: 'rgba(251,191,36,0.5)' },
    loading:    { dot: '#60a5fa', label: 'Loading',    glow: 'rgba(96,165,250,0.5)' },
    error:      { dot: '#f87171', label: 'Error',      glow: 'rgba(248,113,113,0.5)' },
  };
  const sc = statusColors[status] ?? statusColors.idle;

  return (
    <header>
      {/* Rainbow-ish top accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 35%, #06b6d4 65%, #7c3aed 100%)' }} />

      {/* Main bar */}
      <div
        className="min-h-14 px-3 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-3 min-[1800px]:flex-nowrap min-[1800px]:gap-4"
        style={{
          background: 'rgba(6,10,21,0.96)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* ── LEFT: Brand + Instance ── */}
        <div className="flex flex-1 items-center gap-3 min-w-0 lg:gap-4">

          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 20px rgba(124,58,237,0.5)',
              }}
            >
              <Brain className="w-5 h-5 text-white" />
            </div>
            {/* Online ring */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: sc.dot,
                borderColor: '#060a15',
                boxShadow: `0 0 6px ${sc.glow}`,
              }}
            />
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-white/30 font-mono hidden sm:block">Sapiens AI</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/20 hidden sm:block flex-shrink-0" />
            <span className="text-sm text-white/90 font-medium truncate max-w-[180px]">
              {currentSapiens.name}
            </span>
            {currentSapiens.role && (
              <span
                className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] flex-shrink-0"
                style={{
                  background: 'rgba(124,58,237,0.18)',
                  border: '1px solid rgba(124,58,237,0.35)',
                  color: '#c4b5fd',
                }}
              >
                {currentSapiens.role}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-white/10" />

          {/* Status */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: sc.dot,
                boxShadow: `0 0 8px ${sc.glow}`,
                animation: isProcessing ? 'pulse 1s infinite' : 'none',
              }}
            />
            <span className="text-xs" style={{ color: sc.dot }}>{sc.label}</span>
            {isProcessing && (
              <Wifi className="w-3 h-3 animate-pulse" style={{ color: sc.dot }} />
            )}
          </div>

          {/* Overloaded pill */}
          {isOverloaded && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
              title="Sapien is processing background work. New goals you mention may not stick until it catches up."
              style={{
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.35)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <Hourglass className="w-3 h-3" style={{ color: '#fbbf24' }} />
              <span className="text-[11px] font-medium" style={{ color: '#fbbf24' }}>Catching up…</span>
            </div>
          )}

          {/* Instance ID */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Cpu className="w-3 h-3 text-white/20" />
            <span className="text-[10px] text-white/25 font-mono">
              {currentSapiens.id.slice(0, 14)}…
            </span>
          </div>
        </div>

        {/* ── RIGHT: Actions ── */}
        <div className="order-3 flex w-full items-center gap-2 overflow-x-auto border-t border-white/[0.06] pt-2 pb-0.5 min-[1800px]:order-none min-[1800px]:w-auto min-[1800px]:flex-shrink-0 min-[1800px]:overflow-visible min-[1800px]:border-0 min-[1800px]:pt-0 min-[1800px]:pb-0">
          <ThemeToggle
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-all"
          />

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={() => setShowLlmUsage(true)}
            title="View AI usage and global limits"
            aria-haspopup="dialog"
            className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs transition-all duration-150"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(103,232,249,0.75)' }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI usage</span>
          </button>

          <button
            onClick={() => navigate('/connections')}
            title="Manage external account connections"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.22)', color: 'rgba(103,232,249,0.78)' }}
          >
            <PlugZap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connections</span>
          </button>

          <button
            onClick={() => navigate('/engine-bus')}
            title="Monitor Engine Bus signals and delivery flows"
            className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs transition-all duration-150"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'rgba(110,231,183,0.78)' }}
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Engine Bus</span>
          </button>

          {/* Engram Explorer */}
          <button
            onClick={() => navigate('/engram')}
            title="Open Engram Memory Explorer"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={{
              background: 'rgba(129,140,248,0.1)',
              border: '1px solid rgba(129,140,248,0.25)',
              color: 'rgba(165,180,252,0.8)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.2)';
              (e.currentTarget as HTMLElement).style.color = '#a5b4fc';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.1)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(165,180,252,0.8)';
            }}
          >
            <DatabaseZap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Memory</span>
          </button>

          {/* Memory Timeline toggle */}
          <button
            onClick={() => setShowMemoryTimeline(true)}
            title="Open Memory Timeline"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: 'rgba(196,181,253,0.7)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.18)';
              (e.currentTarget as HTMLElement).style.color = '#c4b5fd';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(196,181,253,0.7)';
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Timeline</span>
          </button>

          {/* Debug Panel toggle */}
          <button
            onClick={toggleDebugPanel}
            title="Toggle Debug Panel"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={
              showDebugPanel
                ? { background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', color: '#67e8f9' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
            }
            onMouseEnter={e => {
              if (!showDebugPanel) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.25)';
                (e.currentTarget as HTMLElement).style.color = '#a5f3fc';
              }
            }}
            onMouseLeave={e => {
              if (!showDebugPanel) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
              }
            }}
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug</span>
          </button>

          <div className="w-px h-5 bg-white/10" />

          <RunEngineButton />

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={() => saveSapiens()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.65)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={returnToHome}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>
      </div>
      <LlmUsageDialog
        open={showLlmUsage}
        onOpenChange={setShowLlmUsage}
        sapienId={currentSapiens.id}
        sapienName={currentSapiens.name}
      />
    </header>
  );
}
