import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock3, ExternalLink, KeyRound, Loader2,
  LockKeyhole, Plug, PlugZap, RefreshCw, RotateCcw, ShieldCheck, Trash2, XCircle,
} from 'lucide-react';
import { useSapiensStore } from '../core/state/sapiensStore';
import { connectionsService } from '../core/services/connectionsService';
import type {
  ConnectionFormValue, ConnectionProvider, ConnectionsResponse, CreateConnectionPayload,
  SapiensConnection, SapiensConnectionRequest, UpdateConnectionPayload,
} from '../types/connectionTypes';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';

const accent = '#22d3ee';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function formatDate(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  connected: { label: 'Connected', color: '#34d399', bg: 'rgba(52,211,153,.11)', icon: CheckCircle2 },
  pending: { label: 'Requested', color: '#fbbf24', bg: 'rgba(251,191,36,.11)', icon: Clock3 },
  denied: { label: 'Denied', color: '#f87171', bg: 'rgba(248,113,113,.11)', icon: XCircle },
  needs_attention: { label: 'Needs attention', color: '#fb923c', bg: 'rgba(251,146,60,.12)', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status.replaceAll('_', ' '), color: '#94a3b8', bg: 'rgba(148,163,184,.1)', icon: AlertCircle };
  const Icon = config.icon;
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}35` }}><Icon className="h-3 w-3" />{config.label}</span>;
}

function ProviderForm({ provider, request, connection, busy, onCancel, onSubmit }: {
  provider: ConnectionProvider;
  request?: SapiensConnectionRequest;
  connection?: SapiensConnection;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateConnectionPayload | UpdateConnectionPayload) => Promise<void>;
}) {
  const initial = useMemo(() => Object.fromEntries(provider.fields.map(field => {
    if (!connection) return [field.name, field.type === 'boolean' ? false : ''];
    if (field.type === 'password') return [field.name, ''];
    if (field.name === 'base_url') return [field.name, connection.workspace];
    if (field.name === 'email') return [field.name, connection.account_identifier];
    if (field.type === 'boolean') return [field.name, Boolean(connection.metadata?.[field.name])];
    return [field.name, String(connection.metadata?.[field.name] ?? '')];
  })), [provider, connection]);
  const [values, setValues] = useState<Record<string, ConnectionFormValue>>(initial);
  const [accountLabel, setAccountLabel] = useState(connection?.account_label ?? '');
  const [validation, setValidation] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    provider.fields.forEach(field => {
      if (field.required && field.type !== 'boolean' && !(connection && field.type === 'password') && !String(values[field.name] ?? '').trim()) errors[field.name] = `${field.label} is required`;
      if (field.type === 'url' && values[field.name] && !String(values[field.name]).trim().startsWith('https://')) errors[field.name] = 'Use a secure https:// URL';
    });
    setValidation(errors);
    if (Object.keys(errors).length) return;
    try {
      if (connection) {
        const update: UpdateConnectionPayload = {};
        if (accountLabel.trim() !== connection.account_label) update.account_label = accountLabel.trim();
        provider.fields.forEach(field => {
          const value = values[field.name];
          if (field.type === 'password' && !String(value ?? '').trim()) return;
          if (field.name === 'base_url') update.base_url = String(value ?? '').trim();
          else if (field.name === 'email') update.email = String(value ?? '').trim();
          else if (field.name === 'api_token') update.api_token = String(value ?? '').trim();
          else if (field.name === 'read_only') update.read_only = Boolean(value);
        });
        await onSubmit(update);
      } else {
        await onSubmit({ provider: provider.id, ...(accountLabel.trim() ? { account_label: accountLabel.trim() } : {}), ...values });
      }
      setValues(initial); // Clears password/token fields immediately after submission.
      setAccountLabel('');
    } finally {
      setValues(current => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, provider.fields.find(f => f.name === key)?.type === 'password' ? '' : value])));
    }
  };

  return <form onSubmit={submit} className="rounded-2xl p-5" style={{ background: 'rgba(10,17,31,.96)', border: `1px solid ${accent}35`, boxShadow: '0 24px 70px rgba(0,0,0,.42)' }}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><KeyRound className="h-4 w-4" style={{ color: accent }} /><h2 className="text-sm font-semibold text-white">{connection ? `Edit ${connection.account_label}` : `Connect ${provider.label}`}</h2></div><p className="mt-1 text-xs text-white/40">{connection ? 'Leave the API token blank to keep the saved token. Stored tokens are never displayed.' : 'Credentials are submitted securely and are never shown again.'}</p></div>
      {request && <StatusBadge status={request.status} />}
    </div>
    {request?.reason && <div className="mb-5 rounded-xl p-3 text-xs" style={{ background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.18)', color: '#fde68a' }}><span className="font-medium">Why access was requested: </span>{request.reason}</div>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1.5 block text-xs text-white/55">Account label <span className="text-white/25">(optional)</span></span><input value={accountLabel} onChange={e => setAccountLabel(e.target.value)} disabled={busy} placeholder={`e.g. Product team ${provider.label}`} className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:ring-1" style={{ background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.1)' }} /></label>
      {provider.fields.map(field => field.type === 'boolean' ?
        <label key={field.name} className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)' }}><input type="checkbox" checked={Boolean(values[field.name])} onChange={e => setValues(v => ({ ...v, [field.name]: e.target.checked }))} disabled={busy} className="h-4 w-4 accent-cyan-400" /><span><span className="block text-xs text-white/70">{field.label}</span><span className="text-[11px] text-white/30">Limits this connection to non-destructive provider operations.</span></span></label>
        : <label key={field.name} className={field.type === 'url' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-xs text-white/55">{field.label}{field.required && !(connection && field.type === 'password') && <span className="ml-1 text-red-400">*</span>}</span><input type={field.type === 'password' ? 'password' : field.type} autoComplete={field.type === 'password' ? 'new-password' : 'off'} placeholder={connection && field.type === 'password' ? 'Enter only to replace the saved token' : undefined} value={String(values[field.name] ?? '')} onChange={e => { setValues(v => ({ ...v, [field.name]: e.target.value })); setValidation(v => ({ ...v, [field.name]: '' })); }} disabled={busy} aria-invalid={Boolean(validation[field.name])} className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20" style={{ background: 'rgba(255,255,255,.045)', border: `1px solid ${validation[field.name] ? 'rgba(248,113,113,.65)' : 'rgba(255,255,255,.1)'}` }} />{validation[field.name] && <span className="mt-1 block text-[11px] text-red-400">{validation[field.name]}</span>}</label>
      )}
    </div>
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="rounded-lg px-4 py-2 text-xs text-white/45 hover:bg-white/5 hover:text-white/70 disabled:opacity-40">Cancel</button><button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" style={{ background: accent }}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}{busy ? (connection ? 'Saving…' : 'Connecting…') : connection ? 'Save and verify' : request ? 'Approve and connect' : `Connect ${provider.label}`}</button></div>
  </form>;
}

export function ConnectionsPage() {
  const navigate = useNavigate();
  const currentSapiens = useSapiensStore(state => state.currentSapiens);
  const sapienId = currentSapiens ? Number.parseInt(currentSapiens.id, 10) : NaN;
  const [data, setData] = useState<ConnectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<number | undefined>();
  const [activeConnection, setActiveConnection] = useState<number | undefined>();
  const [busyKey, setBusyKey] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'disconnect' | 'deny'; id: number; label: string } | null>(null);

  useEffect(() => { if (!currentSapiens) navigate('/'); }, [currentSapiens, navigate]);
  const load = useCallback(async () => {
    if (!Number.isFinite(sapienId)) return;
    setLoading(true); setError('');
    try { setData(await connectionsService.list(sapienId)); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [sapienId]);
  useEffect(() => { void load(); }, [load]);

  const provider = data?.providers.find(item => item.id === activeProvider);
  const request = data?.requests.find(item => item.id === activeRequest);
  const connectionToEdit = data?.connections.find(item => item.id === activeConnection);
  const pending = data?.requests.filter(item => item.status === 'pending') ?? [];
  const denied = data?.requests.filter(item => item.status === 'denied') ?? [];

  const openForm = (providerId: string, requestId?: number) => {
    const existing = requestId ? undefined : data?.connections.find(item => item.provider === providerId);
    setActiveProvider(providerId);
    setActiveRequest(requestId);
    setActiveConnection(existing?.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const create = async (payload: CreateConnectionPayload) => {
    if (busyKey) return;
    setBusyKey('create');
    try { await connectionsService.create(sapienId, payload); toast.success(`${provider?.label ?? 'Provider'} connected`); setActiveProvider(null); setActiveRequest(undefined); await load(); }
    catch (err) {
      toast.error('Connection failed', { description: errorMessage(err) });
      // Verification failures may still create a needs-attention connection.
      // Refresh safe metadata only; submitted credentials are never retained.
      await load();
    }
    finally { setBusyKey(''); }
  };
  const updateConnection = async (payload: UpdateConnectionPayload) => {
    if (busyKey || !connectionToEdit) return;
    setBusyKey('update');
    try {
      await connectionsService.update(sapienId, connectionToEdit.id, payload);
      toast.success(`${connectionToEdit.account_label} updated and verified`);
      setActiveProvider(null); setActiveConnection(undefined); await load();
    } catch (err) {
      toast.error('Connection update failed', { description: errorMessage(err) });
      await load();
    } finally { setBusyKey(''); }
  };
  const verify = async (connection: SapiensConnection) => {
    if (busyKey) return; setBusyKey(`verify-${connection.id}`);
    try { await connectionsService.verify(sapienId, connection.id); toast.success(`${connection.account_label} verified`); await load(); }
    catch (err) { toast.error('Verification failed', { description: errorMessage(err) }); await load(); }
    finally { setBusyKey(''); }
  };
  const updateRequest = async (item: SapiensConnectionRequest, action: 'reject' | 'reopen') => {
    if (busyKey) return; setBusyKey(`request-${item.id}`);
    try { await connectionsService.updateRequest(sapienId, item.id, action); toast.success(action === 'reject' ? 'Request denied' : 'Request reopened'); await load(); }
    catch (err) { toast.error('Could not update request', { description: errorMessage(err) }); }
    finally { setBusyKey(''); setConfirm(null); }
  };
  const disconnect = async (connectionId: number) => {
    if (busyKey) return; setBusyKey(`disconnect-${connectionId}`);
    try { await connectionsService.disconnect(sapienId, connectionId); toast.success('Connection disconnected'); await load(); }
    catch (err) { toast.error('Disconnect failed', { description: errorMessage(err) }); }
    finally { setBusyKey(''); setConfirm(null); }
  };

  if (!currentSapiens) return null;
  return <div className="min-h-screen text-white" style={{ background: '#060a15' }}>
    <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 12% 0%, rgba(34,211,238,.14), transparent 35%), radial-gradient(circle at 90% 70%, rgba(124,58,237,.12), transparent 38%), radial-gradient(rgba(148,163,184,.16) 1px, transparent 1px)', backgroundSize: 'auto, auto, 32px 32px' }} />
    <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#060a15]/90 backdrop-blur-xl"><div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} /><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg,#0891b2,#4f46e5)', boxShadow: '0 0 20px rgba(34,211,238,.25)' }}><PlugZap className="h-4 w-4" /></div><div className="min-w-0"><h1 className="truncate text-sm font-semibold">Connections</h1><p className="truncate text-[11px] text-white/35">{currentSapiens.name} · external accounts</p></div></div><button onClick={() => navigate('/workspace')} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/45 hover:bg-white/5 hover:text-white/75"><ArrowLeft className="h-3.5 w-3.5" />Workspace</button></div></header>
    <main className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {loading && !data ? <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-white/40"><Loader2 className="h-5 w-5 animate-spin" style={{ color: accent }} />Loading connections…</div>
      : error && !data ? <div className="mx-auto mt-16 max-w-lg rounded-2xl p-6 text-center" style={{ background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.2)' }}><AlertCircle className="mx-auto h-7 w-7 text-red-400" /><h2 className="mt-3 text-sm font-medium">Couldn’t load connections</h2><p className="mt-1 text-xs text-white/40">{error}</p><button onClick={() => void load()} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs hover:bg-white/5"><RefreshCw className="mr-2 inline h-3.5 w-3.5" />Try again</button></div>
      : data && <>
        {provider && <ProviderForm key={`${provider.id}-${activeRequest ?? activeConnection ?? 'new'}`} provider={provider} request={request} connection={connectionToEdit} busy={busyKey === 'create' || busyKey === 'update'} onCancel={() => { setActiveProvider(null); setActiveRequest(undefined); setActiveConnection(undefined); }} onSubmit={payload => connectionToEdit ? updateConnection(payload as UpdateConnectionPayload) : create(payload as CreateConnectionPayload)} />}

        {pending.length > 0 && <section><div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-semibold">Access requested by {currentSapiens.name}</h2><span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">{pending.length} awaiting you</span></div><div className="grid gap-3">{pending.map(item => { const catalog = data.providers.find(p => p.id === item.provider); return <article key={item.id} className="rounded-2xl p-4 sm:p-5" style={{ background: 'linear-gradient(135deg,rgba(251,191,36,.09),rgba(12,18,32,.92))', border: '1px solid rgba(251,191,36,.26)' }}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><span className="text-sm font-medium">{catalog?.label ?? item.provider}</span><StatusBadge status={item.status} /></div><p className="mt-2 max-w-2xl text-xs leading-5 text-white/48">{item.reason || `${currentSapiens.name} needs access to this provider to continue requested work.`}</p><p className="mt-1 text-[10px] text-white/25">Requested {formatDate(item.created_at)}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => setConfirm({ kind: 'deny', id: item.id, label: catalog?.label ?? item.provider })} disabled={Boolean(busyKey)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300/70 hover:bg-red-400/10 disabled:opacity-40">Deny</button><button onClick={() => openForm(item.provider, item.id)} disabled={!catalog || Boolean(busyKey)} className="rounded-lg px-4 py-2 text-xs font-medium text-slate-950 disabled:opacity-40" style={{ background: '#fbbf24' }}>Review & connect</button></div></div></article>; })}</div></section>}

        <section><div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-sm font-semibold">Connected accounts</h2><p className="mt-1 text-xs text-white/35">Accounts and workspaces available only to this Sapiens.</p></div>{loading && <Loader2 className="h-4 w-4 animate-spin text-white/30" />}</div>{data.connections.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center"><Plug className="mx-auto h-7 w-7 text-white/20" /><h3 className="mt-3 text-sm text-white/65">No accounts connected yet</h3><p className="mt-1 text-xs text-white/30">Choose an available provider below to get started.</p></div> : <div className="grid gap-3 lg:grid-cols-2">{data.connections.map(connection => { const catalog = data.providers.find(p => p.id === connection.provider); return <article key={connection.id} className="rounded-2xl p-5" style={{ background: 'rgba(10,16,29,.86)', border: `1px solid ${connection.status === 'needs_attention' ? 'rgba(251,146,60,.3)' : 'rgba(255,255,255,.08)'}` }}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{connection.account_label}</h3>{connection.is_default && <span className="rounded-full bg-indigo-400/10 px-2 py-0.5 text-[10px] text-indigo-300">Default</span>}</div><p className="mt-1 text-[11px] uppercase tracking-wider text-white/25">{catalog?.label ?? connection.provider}</p></div><StatusBadge status={connection.status} /></div><dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-white/28">Account</dt><dd className="mt-1 truncate text-white/65">{connection.account_identifier || 'Not provided'}</dd></div><div><dt className="text-white/28">Workspace</dt><dd className="mt-1 truncate text-white/65" title={connection.workspace}>{connection.workspace || 'Not provided'}</dd></div><div className="sm:col-span-2"><dt className="text-white/28">Last verified</dt><dd className="mt-1 flex items-center gap-1.5 text-white/60"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />{formatDate(connection.last_verified_at)}</dd></div></dl>{connection.status === 'needs_attention' && <p className="mt-4 rounded-lg bg-orange-400/[.07] px-3 py-2 text-[11px] leading-4 text-orange-200/80">The saved credentials could not be verified. Verify them again, or reconnect with fresh credentials.</p>}<div className="mt-5 flex flex-wrap gap-2 border-t border-white/[.06] pt-4"><button onClick={() => void verify(connection)} disabled={Boolean(busyKey)} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/55 hover:bg-white/5 disabled:opacity-40">{busyKey === `verify-${connection.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}Verify saved credentials</button><button onClick={() => openForm(connection.provider)} disabled={!catalog || Boolean(busyKey)} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/15 px-3 py-2 text-[11px] text-cyan-200/65 hover:bg-cyan-400/[.06] disabled:opacity-40"><RotateCcw className="h-3 w-3" />Edit / update</button><button onClick={() => setConfirm({ kind: 'disconnect', id: connection.id, label: connection.account_label })} disabled={Boolean(busyKey)} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-red-300/55 hover:bg-red-400/[.07] hover:text-red-300 disabled:opacity-40"><Trash2 className="h-3 w-3" />Disconnect</button></div></article>; })}</div>}</section>

        <section><div className="mb-3"><h2 className="text-sm font-semibold">Available providers</h2><p className="mt-1 text-xs text-white/35">Connection forms are generated from the backend provider catalog.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.providers.map(item => <button key={item.id} onClick={() => openForm(item.id)} disabled={Boolean(busyKey)} className="group rounded-2xl p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-40" style={{ background: 'rgba(10,16,29,.72)', border: '1px solid rgba(255,255,255,.08)' }}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/[.09]"><Plug className="h-4 w-4 text-cyan-300" /></div><div><span className="block text-sm font-medium">{item.label}</span><span className="text-[10px] text-white/28">{item.fields.length} setup fields</span></div></div><ExternalLink className="h-3.5 w-3.5 text-white/15 group-hover:text-cyan-300" /></div></button>)}</div></section>

        {denied.length > 0 && <section><div className="mb-3"><h2 className="text-sm font-semibold text-white/70">Denied requests</h2><p className="mt-1 text-xs text-white/30">These stay closed until you explicitly reopen them.</p></div><div className="space-y-2">{denied.map(item => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><span className="text-xs font-medium">{data.providers.find(p => p.id === item.provider)?.label ?? item.provider}</span><StatusBadge status="denied" /></div>{item.reason && <p className="mt-1 text-[11px] text-white/35">{item.reason}</p>}</div><button onClick={() => void updateRequest(item, 'reopen')} disabled={Boolean(busyKey)} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/55 hover:bg-white/5 disabled:opacity-40">{busyKey === `request-${item.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Reopen request</button></div>)}</div></section>}
      </>}
    </main>
    <AlertDialog open={Boolean(confirm)} onOpenChange={open => { if (!open && !busyKey) setConfirm(null); }}><AlertDialogContent className="border-white/10 bg-[#0b1220] text-white"><AlertDialogHeader><AlertDialogTitle>{confirm?.kind === 'disconnect' ? `Disconnect ${confirm.label}?` : `Deny ${confirm?.label} access?`}</AlertDialogTitle><AlertDialogDescription className="text-white/45">{confirm?.kind === 'disconnect' ? 'This permanently removes the saved connection and its encrypted credentials. It cannot be undone.' : `${currentSapiens.name} will be told access was denied and will not request it again unless you reopen it.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={Boolean(busyKey)} className="border-white/10 bg-transparent text-white hover:bg-white/5">Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyKey)} onClick={event => { event.preventDefault(); if (!confirm) return; if (confirm.kind === 'disconnect') void disconnect(confirm.id); else { const item = data?.requests.find(r => r.id === confirm.id); if (item) void updateRequest(item, 'reject'); } }} className="bg-red-600 text-white hover:bg-red-500">{busyKey ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}{confirm?.kind === 'disconnect' ? 'Disconnect permanently' : 'Deny request'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
