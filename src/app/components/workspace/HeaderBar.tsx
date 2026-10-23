import { Home, Save, ChevronRight, Wifi, Hourglass, PlugZap, ScanSearch, LogOut, Beaker } from 'lucide-react';
import { Link } from 'react-router';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ThemeToggle } from '../ThemeToggle';
import { RunEngineButton } from './RunEngineButton';
import { useAuth } from '../../contexts/AuthContext';
import { SapiensPresence } from '../customer/SapiensPresence';

export function HeaderBar() {
  const { currentSapiens } = useSapiensStore();
  const { saveSapiens, returnToHome } = useSapiens();
  const status = useSapiensStore((s) => s.status);
  const isOverloaded = useSapiensStore((s) => s.isOverloaded);
  const { user, logout } = useAuth();

  if (!currentSapiens) return null;

  const isProcessing = status === 'processing' || status === 'loading';

  const statusColors = {
    idle:       { dot: 'var(--sp-success, #34d399)', label: 'Ready', glow: 'rgba(52,211,153,0.5)' },
    processing: { dot: 'var(--sp-warning, #fbbf24)', label: 'Processing', glow: 'rgba(251,191,36,0.5)' },
    loading:    { dot: 'var(--sp-accent, #60a5fa)', label: 'Loading',    glow: 'rgba(96,165,250,0.5)' },
    error:      { dot: 'var(--sp-danger, #f87171)', label: 'Error',      glow: 'rgba(248,113,113,0.5)' },
  };
  const sc = statusColors[status] ?? statusColors.idle;

  return (
    <header>
      {/* Shared violet brand accent */}
      <div style={{ height: '2px', background: 'var(--sp-accent, #7c3aed)' }} />

      {/* Main bar */}
      <div
        className="min-h-14 px-3 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-3 min-[1800px]:flex-nowrap min-[1800px]:gap-4"
        style={{
          background: 'rgb(var(--sp-panel-rgb, 6 10 21) / 0.96)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.07)',
        }}
      >
        {/* ── LEFT: Brand + Instance ── */}
        <div className="flex flex-1 items-center gap-3 min-w-0 lg:gap-4">

          {/* Logo */}
          <div className="relative flex-shrink-0">
            <SapiensPresence size={36} />
            {/* Online ring */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: sc.dot,
                borderColor: 'var(--sp-bg, #060a15)',
                boxShadow: `0 0 6px ${sc.glow}`,
              }}
            />
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-sp-muted font-mono hidden sm:block">Sapiens AI</span>
            <ChevronRight className="w-3.5 h-3.5 text-sp-muted hidden sm:block flex-shrink-0" />
            <span className="text-sm text-sp-ink font-medium truncate max-w-[180px]">
              {currentSapiens.name}
            </span>
            <span className="shrink-0 rounded border border-sp-line px-1.5 py-0.5 font-mono text-[10px] text-sp-muted">
              ID {currentSapiens.id}
            </span>
            {currentSapiens.role && (
              <span
                className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] flex-shrink-0"
                style={{
                  background: 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.18)',
                  border: '1px solid rgb(var(--sp-accent-rgb, 124 58 237) / 0.35)',
                  color: 'var(--sp-accent, #c4b5fd)',
                }}
              >
                {currentSapiens.role}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-sp-ink/10" />

          {/* Status */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.04)',
              border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.08)',
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
              <Hourglass className="w-3 h-3" style={{ color: 'var(--sp-warning, #fbbf24)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--sp-warning, #fbbf24)' }}>Catching up…</span>
            </div>
          )}

        </div>

        {/* ── RIGHT: Actions ── */}
        <div className="order-3 flex w-full flex-wrap items-center gap-2 overflow-visible border-t border-sp-line pt-2 pb-0.5 min-[1800px]:order-none min-[1800px]:w-auto min-[1800px]:flex-shrink-0 min-[1800px]:overflow-visible min-[1800px]:border-0 min-[1800px]:pt-0 min-[1800px]:pb-0">
          <ThemeToggle
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sp-muted hover:text-sp-ink hover:bg-sp-ink/[0.06] rounded-lg transition-all"
          />

          <div className="w-px h-5 bg-sp-ink/10" />

          {(user?.role === 'customer' || user?.role === 'admin') && <Link
            to="/connections"
            title="Manage external account connections"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={{ background: 'rgb(var(--sp-accent-rgb, 34 211 238) / 0.08)', border: '1px solid rgb(var(--sp-accent-rgb, 34 211 238) / 0.22)', color: 'var(--sp-accent, rgba(103,232,249,0.78))' }}
          >
            <PlugZap className="w-3.5 h-3.5" />
            <span className="inline">Connections</span>
          </Link>}

          <details className="workspace-tools relative">
            <summary className="cursor-pointer rounded-lg border border-sp-line px-3 py-2 text-xs text-sp-ink">Tools</summary>
            <div className="workspace-tools-menu">
          {user?.role === 'admin' && <Link
            to="/admin/analyse"
            title="Open the analysis platform"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={{ background: 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.12)', border: '1px solid rgb(var(--sp-accent-rgb, 139 92 246) / 0.3)', color: 'var(--sp-accent, #c4b5fd)' }}
          >
            <ScanSearch className="w-3.5 h-3.5" />
            <span className="inline">Analyse</span>
          </Link>}

          {user?.role === 'admin' && <Link
            to={`/admin/simulations?sapienId=${encodeURIComponent(currentSapiens.id)}&sapienName=${encodeURIComponent(currentSapiens.name)}&returnTo=%2Fworkspace`}
            title={`Open simulations for ${currentSapiens.name}`}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150"
            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.28)', color: 'var(--sp-warning, #fcd34d)' }}
          >
            <Beaker className="w-3.5 h-3.5" />
            <span className="inline">Simulation</span>
          </Link>}

          <div className="w-px h-5 bg-sp-ink/10" />

          <RunEngineButton />
            </div>
          </details>

          <div className="w-px h-5 bg-sp-ink/10" />

          <button
            onClick={() => saveSapiens()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.05)',
              border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.1)',
              color: 'var(--sp-muted, rgb(var(--sp-ink-rgb, 255 255 255) / 0.65))',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.09)';
              (e.currentTarget as HTMLElement).style.color = 'var(--sp-ink, rgb(var(--sp-ink-rgb, 255 255 255) / 0.9))';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.05)';
              (e.currentTarget as HTMLElement).style.color = 'var(--sp-muted, rgb(var(--sp-ink-rgb, 255 255 255) / 0.65))';
            }}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="inline">Save</span>
          </button>

          <button
            onClick={returnToHome}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-sp-muted hover:text-sp-ink hover:bg-sp-ink/[0.05] transition-all duration-150"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="inline">Your Sapiens</span>
          </button>
          <button onClick={() => void logout()} title={`Sign out ${user?.username ?? ''}`} className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs text-sp-muted transition hover:bg-red-400/[.06] hover:text-sp-danger"><LogOut className="h-3.5 w-3.5" /><span className="inline">Sign out</span></button>
        </div>
      </div>
    </header>
  );
}
