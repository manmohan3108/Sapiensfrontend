import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  AlertCircle, CheckCircle2, Clock3, ArrowRight, KeyRound, Loader2,
  LockKeyhole, Plug, RefreshCw, RotateCcw, ShieldCheck, Trash2, XCircle,
} from 'lucide-react';
import { useSapiensStore } from '../core/state/sapiensStore';
import { ConnectionRequestError, connectionsService } from '../core/services/connectionsService';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import '../../styles/connections.css';
import type {
  ConnectionFormValue, ConnectionProvider, ConnectionsResponse, CreateConnectionPayload,
  SapiensConnection, SapiensConnectionRequest, UpdateConnectionPayload,
} from '../types/connectionTypes';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';

import { connectionAccountLabel, ConnectionAccountDetails, ConnectionSubscriptions, FulfilledRequests } from '../components/connections/ConnectionDetails';
import { ConnectionFields } from '../components/connections/ConnectionFields';
import { ConnectionGuidance } from '../components/connections/ConnectionGuidance';

const accent = 'var(--sp-accent)';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function formatDate(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  connected: { label: 'Connected', color: 'var(--sp-success, #34d399)', bg: 'rgba(52,211,153,.11)', icon: CheckCircle2 },
  pending: { label: 'Requested', color: 'var(--sp-warning, #fbbf24)', bg: 'rgba(251,191,36,.11)', icon: Clock3 },
  denied: { label: 'Denied', color: 'var(--sp-danger, #f87171)', bg: 'rgba(248,113,113,.11)', icon: XCircle },
  needs_attention: { label: 'Needs attention', color: 'var(--sp-warning, #fb923c)', bg: 'rgba(251,146,60,.12)', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status.replaceAll('_', ' '), color: 'var(--sp-muted, #94a3b8)', bg: 'rgba(148,163,184,.1)', icon: AlertCircle };
  const Icon = config.icon;
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ color: config.color, background: config.bg, border: `1px solid color-mix(in srgb, ${config.color} 20.78%, transparent)` }}><Icon className="h-3 w-3" />{config.label}</span>;
}

function RequestDetails({ request }: { request: SapiensConnectionRequest }) {
  const access = request.metadata.access;
  return <div className="my-3 space-y-2 text-sm">
    <p className="font-medium">Request #{request.id}</p>
    <ConnectionGuidance guidance={request.guidance} />
    <p className="break-words text-sp-muted">{request.reason || 'Access is needed to continue work.'}</p>
    {access && <dl className="grid gap-2 sm:grid-cols-2">
      <div><dt className="text-sp-muted">Target or workspace</dt><dd className="break-words">{access.target || 'Owner to specify'}</dd></div>
      <div><dt className="text-sp-muted">Account requirement</dt><dd className="break-words">{access.account || 'Owner to choose'}</dd></div>
      {access.operations.length > 0 && <div className="sm:col-span-2"><dt className="text-sp-muted">Needed access</dt><dd className="break-words">{access.operations.join('; ')}</dd></div>}
      {access.connection_id && <div><dt className="text-sp-muted">Existing connection to review</dt><dd>#{access.connection_id}</dd></div>}
    </dl>}
    {(request.metadata.additional_reasons?.length || request.metadata.work_refs?.length) ? <details>
      <summary className="cursor-pointer text-sp-muted">Related work</summary>
      <ul className="mt-2 space-y-1 break-words">
        {request.metadata.additional_reasons?.map((reason, index) => <li key={`reason-${index}`}>{reason}</li>)}
        {request.metadata.work_refs?.map(ref => <li key={ref}>{ref}</li>)}
      </ul>
    </details> : null}
  </div>;
}

function savedSetupRequest(connection: SapiensConnection, requests: SapiensConnectionRequest[]) {
  return requests.find(item => item.id === connection.metadata.setup_request_id && item.provider === connection.provider);
}

function ProviderForm({ provider, request, connection, connections, busy, onCancel, onSubmit, onFulfill, onEditConnection }: {
  provider: ConnectionProvider;
  request?: SapiensConnectionRequest;
  connection?: SapiensConnection;
  connections: SapiensConnection[];
  onFulfill: (connectionId: number) => Promise<void>;
  onEditConnection: (connectionId: number) => void;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateConnectionPayload | UpdateConnectionPayload) => Promise<void>;
}) {
  const initial = useMemo(() => Object.fromEntries(provider.fields.map(field => {
    if (!connection) return [field.name, field.type === 'boolean' ? Boolean(field.default ?? false) : String(field.default ?? '')];
    if (field.type === 'password' || field.source === 'credential') return [field.name, ''];
    if (field.source === 'workspace') return [field.name, connection.workspace];
    if (field.source === 'account_identifier') return [field.name, connection.account_identifier];
    if (field.type === 'boolean') return [field.name, Boolean(connection.metadata?.[field.name])];
    return [field.name, String(connection.metadata?.[field.name] ?? '')];
  })), [provider, connection]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const [values, setValues] = useState<Record<string, ConnectionFormValue>>(initial);
  const [accountLabel, setAccountLabel] = useState(connection?.account_label ?? '');
  const [selectedConnection, setSelectedConnection] = useState('');
  const selectedAccount = connections.find(account => account.id === Number(selectedConnection));
  const requestBlocked = Boolean(request && request.status !== 'pending');
  const [generationId] = useState(() => crypto.randomUUID());
  const generatesKey = Boolean(provider.capabilities?.key_generation);
  const [validation, setValidation] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requestBlocked) return;
    const errors: Record<string, string> = {};
    provider.fields.forEach(field => {
      if (field.required && field.type !== 'boolean' && !(connection && (field.type === 'password' || field.source === 'credential')) && !String(values[field.name] ?? '').trim()) errors[field.name] = `${field.label} is required`;
      if (field.type === 'url' && values[field.name] && !String(values[field.name]).trim().startsWith('https://')) errors[field.name] = 'Use a secure https:// URL';
      if (field.choices?.length && values[field.name] && !field.choices.includes(String(values[field.name]))) errors[field.name] = `Choose a supported ${field.label.toLowerCase()}`;
    });
    setValidation(errors);
    if (Object.keys(errors).length) {
      const form = event.currentTarget;
      requestAnimationFrame(() => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus());
      return;
    }
    try {
      if (connection) {
        const update: UpdateConnectionPayload = {};
        if (accountLabel.trim() !== connection.account_label) update.account_label = accountLabel.trim();
        provider.fields.forEach(field => {
          const value = values[field.name];
          if ((field.type === 'password' || field.source === 'credential') && !String(value ?? '').trim()) return;
          update[field.name] = value;
        });
        await onSubmit(update);
      } else {
        await onSubmit({ provider: provider.id, ...(generatesKey ? { action: 'generate_key', generation_id: generationId } : {}), ...(accountLabel.trim() ? { account_label: accountLabel.trim() } : {}), ...Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value === 'boolean' || String(value).trim())) });
      }
      setValues(initial); // Clears password/token fields immediately after submission.
      setAccountLabel('');
    } catch {
      // The parent reports the failure; retain non-secret form values for correction.
    } finally {
      setValues(current => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, provider.fields.some(f => f.name === key && (f.type === 'password' || f.source === 'credential')) ? '' : value])));
    }
  };

  return <form onSubmit={submit} className="connections-form rounded-2xl p-5" style={{ background: 'rgb(var(--sp-panel-rgb, 10 17 31) / .96)', border: `1px solid color-mix(in srgb, ${accent} 20.78%, transparent)`, boxShadow: '0 24px 70px rgb(var(--sp-shadow-rgb, 0 0 0) / var(--sp-shadow-opacity, .42))' }}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><KeyRound className="h-4 w-4" style={{ color: accent }} /><h2 ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-sp-ink">{connection ? `Edit ${connection.account_label}` : `Connect ${provider.label}`}</h2></div><p className="mt-1 text-xs text-sp-muted">{connection ? 'Leave credential fields blank to keep their saved values. Stored credentials are never displayed.' : 'Enter the account details this service requires. Saved credentials are never displayed.'}</p></div>
      {request && <StatusBadge status={request.status} />}
    </div>
    {provider.description && <p className="mb-4 text-sm text-sp-muted">{provider.description}</p>}
    {request && <>
      <RequestDetails request={request} />
      {requestBlocked && <p role="status" className="mb-3 text-sm text-sp-warning">This request is {request.status}. Reopen a denied request before fulfilling it; a completed request cannot be reassigned.</p>}
      {!connection && connections.length > 0 && <fieldset className="mb-5 space-y-3 rounded-lg border border-sp-line p-4">
        <legend className="px-1 text-sm font-medium">Use an existing account</legend>
        <label htmlFor="fulfillment-account" className="block text-sm text-sp-muted">Choose an account that meets this request</label>
        <select id="fulfillment-account" name="fulfillment-account" value={selectedConnection} onChange={event => setSelectedConnection(event.target.value)} disabled={busy} className="w-full rounded-lg border border-sp-line bg-sp-panel p-2 text-sp-ink">
          <option value="">Select an account…</option>
          {connections.map(account => <option key={account.id} value={account.id}>{connectionAccountLabel(account)}</option>)}
        </select>
        {selectedAccount && <><ConnectionAccountDetails connection={selectedAccount} provider={provider} /><ConnectionGuidance guidance={selectedAccount.guidance} compact={selectedAccount.status === 'connected'} /></>}
        <p className="text-sm text-sp-muted">Confirm that the chosen account meets the target and access requirements above. Authentication will be checked before this request is fulfilled.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!selectedConnection || busy || requestBlocked} onClick={() => void onFulfill(Number(selectedConnection))} className="rounded-lg bg-sp-action px-3 py-2 text-sm text-sp-on-action disabled:opacity-40">Verify and fulfill request #{request.id}</button>
          <button type="button" disabled={!selectedConnection || busy} onClick={() => onEditConnection(Number(selectedConnection))} className="rounded-lg border border-sp-line px-3 py-2 text-sm disabled:opacity-40">Edit this account</button>
        </div>
      </fieldset>}
      <p className="mb-3 text-sm text-sp-muted">{requestBlocked ? 'Review the request status before continuing.' : connection ? `Save and verify this account to fulfill request #${request.id}.` : generatesKey ? 'Or prepare a new account below. This request stays pending until setup and verification are complete.' : 'Or enter a new account below to fulfill this request.'}</p>
    </>}
    {connection && <ConnectionAccountDetails connection={connection} provider={provider} />}
    <ConnectionGuidance guidance={connection?.guidance ?? provider.setup} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1.5 block text-xs text-sp-muted">Account label <span className="text-sp-muted">(optional)</span></span><input name="account_label" autoComplete="off" value={accountLabel} onChange={e => setAccountLabel(e.target.value)} disabled={busy} placeholder={`e.g. Product team ${provider.label}`} className="w-full rounded-lg px-3 py-2.5 text-sm text-sp-ink outline-none placeholder:text-sp-muted focus:ring-1" style={{ background: 'rgb(var(--sp-ink-rgb, 255 255 255) / .045)', border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / .1)' }} /></label>
      <div className="sm:col-span-2"><ConnectionFields fields={provider.fields} values={values} errors={validation}
        editing={Boolean(connection)} busy={busy} onChange={(name, value) => {
          setValues(current => ({ ...current, [name]: value }));
          setValidation(current => ({ ...current, [name]: '' }));
        }} /></div>
    </div>
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="rounded-lg px-4 py-2 text-xs text-sp-muted hover:bg-sp-ink/5 hover:text-sp-ink disabled:opacity-40">Cancel</button><button type="submit" disabled={busy || requestBlocked} className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-sp-on-action disabled:cursor-not-allowed disabled:opacity-50" style={{ background: 'var(--sp-action)' }}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockKeyhole className="h-3.5 w-3.5" />}{busy ? (connection ? 'Saving…' : generatesKey ? 'Preparing access…' : 'Connecting…') : connection ? (request ? `Save, verify & fulfill #${request.id}` : 'Save and verify') : provider.setup?.action_label ?? (generatesKey ? 'Generate access key' : request ? 'Approve and connect' : `Connect ${provider.label}`)}</button></div>
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
  const formTrigger = useRef<HTMLElement | null>(null);
  const confirmationTrigger = useRef<HTMLButtonElement | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'disconnect' | 'deny'; id: number; label: string } | null>(null);

  useEffect(() => { if (!currentSapiens) navigate('/home'); }, [currentSapiens, navigate]);
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
  const confirmationRequest = confirm?.kind === 'deny' ? data?.requests.find(item => item.id === confirm.id) : undefined;
  const confirmationAccount = confirm?.kind === 'disconnect' ? data?.connections.find(item => item.id === confirm.id) : undefined;
  const disconnectNotice = confirmationAccount?.guidance?.disconnect_notice
    ?? data?.providers.find(item => item.id === confirmationAccount?.provider)?.disconnect_notice;

  const openForm = (providerId: string, requestId?: number, connectionId?: number) => {
    formTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const existing = connectionId === undefined ? undefined : data?.connections.find(item => item.id === connectionId);
    setActiveProvider(providerId);
    const setupRequest = existing && data ? savedSetupRequest(existing, data.requests) : undefined;
    setActiveRequest(requestId ?? (setupRequest?.status !== 'connected' ? setupRequest?.id : undefined));
    setActiveConnection(existing?.id);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const create = async (payload: CreateConnectionPayload) => {
    if (busyKey) return;
    setBusyKey('create');
    try { await connectionsService.create(sapienId, { ...payload, ...(activeRequest !== undefined ? { request_id: activeRequest } : {}) }); toast.success(payload.action === 'generate_key' ? 'Access key saved — complete setup, then verify' : `${provider?.label ?? 'Provider'} connected`); setActiveProvider(null); setActiveRequest(undefined); await load(); }
    catch (err) {
      toast.error('Connection failed', { description: errorMessage(err) });
      if (err instanceof ConnectionRequestError && err.connection) {
        const saved = err.connection;
        setData(current => current ? { ...current, connections: [...current.connections.filter(item => item.id !== saved.id), saved] } : current);
        setActiveConnection(saved.id);
      }
      // Verification failures may still create a needs-attention connection.
      // Refresh safe metadata only; submitted credentials are never retained.
      await load();
      throw err;
    }
    finally { setBusyKey(''); }
  };
  const updateConnection = async (payload: UpdateConnectionPayload) => {
    if (busyKey || !connectionToEdit) return;
    setBusyKey('update');
    try {
      await connectionsService.update(sapienId, connectionToEdit.id, { ...payload, ...(activeRequest !== undefined ? { request_id: activeRequest } : {}) });
      toast.success(`${connectionToEdit.account_label} updated and verified`);
      setActiveProvider(null); setActiveConnection(undefined); setActiveRequest(undefined); await load();
    } catch (err) {
      toast.error('Connection update failed', { description: errorMessage(err) });
      await load();
      throw err;
    } finally { setBusyKey(''); }
  };
  const fulfillRequest = async (connectionId: number) => {
    if (busyKey || activeRequest === undefined) return;
    setBusyKey('fulfill');
    try {
      await connectionsService.fulfillRequest(sapienId, activeRequest, connectionId);
      toast.success('Access request fulfilled');
      setActiveProvider(null); setActiveRequest(undefined); setActiveConnection(undefined);
      await load();
    } catch (err) {
      toast.error('Could not fulfill request', { description: errorMessage(err) });
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
  const configureSubscriptions = async (connectionId: number, resources: string[]) => {
    if (busyKey) return;
    setBusyKey(`subscriptions-${connectionId}`);
    try {
      await connectionsService.configureSubscriptions(sapienId, connectionId, resources);
      toast.success('Notification changes queued', { description: 'Refresh this page to see the completed subscription state.' });
      await load();
    } catch (err) {
      toast.error('Could not configure notifications', { description: errorMessage(err) });
      throw err;
    } finally { setBusyKey(''); }
  };
  const disconnect = async (connectionId: number) => {
    if (busyKey) return; setBusyKey(`disconnect-${connectionId}`);
    try { const result = await connectionsService.disconnect(sapienId, connectionId); toast.success('Connection disconnected'); if (result.remote_cleanup_confirmed === false) toast.warning('Remote notification cleanup was not confirmed. Local access is removed; the remote subscription may remain until expiry.'); await load(); }
    catch (err) { toast.error('Disconnect failed', { description: errorMessage(err) }); }
    finally { setBusyKey(''); setConfirm(null); }
  };

  if (!currentSapiens) return null;
  return <div className="product-surface science-product-theme connections-page min-h-screen text-sp-ink">
    <header className="connections-header"><div className="connections-header-inner"><div className="connections-identity"><SapiensBrandMark /><div><h1>Connections</h1><p>{currentSapiens.name} · Sapien ID {currentSapiens.id}</p></div></div></div></header>
    <main className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="connections-intro"><h2>Connect the services {currentSapiens.name} can use.</h2><p>Link an account so your Sapiens can work with that service. Review access requests and manage connected accounts here.</p></div>
      {error && data && <div role="alert" className="connections-refresh-error"><span>Couldn’t refresh connections. The information below may be out of date.</span><button onClick={() => void load()} disabled={loading}>Try again</button></div>}
      {loading && !data ? <div role="status" className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-sp-muted"><Loader2 className="h-5 w-5 animate-spin" style={{ color: accent }} />Loading connections…</div>
      : error && !data ? <div role="alert" className="mx-auto mt-16 max-w-lg rounded-2xl p-6 text-center" style={{ background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.2)' }}><AlertCircle className="mx-auto h-7 w-7 text-sp-danger" /><h2 className="mt-3 text-sm font-medium">Couldn’t load connections</h2><p className="mt-1 text-xs text-sp-muted">{error}</p><button onClick={() => void load()} className="mt-4 rounded-lg border border-sp-line px-4 py-2 text-xs hover:bg-sp-ink/5"><RefreshCw className="mr-2 inline h-3.5 w-3.5" />Try again</button></div>
      : data && <>
        {provider && <ProviderForm key={`${provider.id}-${activeRequest ?? 'none'}-${activeConnection ?? 'new'}`} provider={provider} request={request} connection={connectionToEdit} connections={data.connections.filter(item => item.provider === provider.id)} onFulfill={fulfillRequest} onEditConnection={id => openForm(provider.id, activeRequest, id)} busy={Boolean(busyKey)} onCancel={() => { setActiveProvider(null); setActiveRequest(undefined); setActiveConnection(undefined); requestAnimationFrame(() => formTrigger.current?.focus()); }} onSubmit={payload => connectionToEdit ? updateConnection(payload as UpdateConnectionPayload) : create(payload as CreateConnectionPayload)} />}

        {pending.length > 0 && <section><div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-sp-warning" /><h2 className="text-sm font-semibold">Access requested by {currentSapiens.name}</h2><span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-sp-warning">{pending.length} awaiting you</span></div><div className="grid gap-3">{pending.map(item => { const catalog = data.providers.find(p => p.id === item.provider); return <article key={item.id} className="rounded-2xl p-4 sm:p-5" style={{ background: 'linear-gradient(135deg,rgba(251,191,36,.09),rgb(var(--sp-panel-rgb, 12 18 32) / .92))', border: '1px solid rgba(251,191,36,.26)' }}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><span className="text-sm font-medium">{catalog?.label ?? item.provider}</span><StatusBadge status={item.status} /></div><RequestDetails request={item} /><p className="mt-1 text-[10px] text-sp-muted">Requested {formatDate(item.created_at)}</p></div><div className="flex shrink-0 gap-2"><button onClick={event => { confirmationTrigger.current = event.currentTarget; setConfirm({ kind: 'deny', id: item.id, label: catalog?.label ?? item.provider }); }} disabled={Boolean(busyKey)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-sp-danger hover:bg-red-400/10 disabled:opacity-40">Deny</button><button onClick={() => openForm(item.provider, item.id)} disabled={!catalog || Boolean(busyKey)} className="rounded-lg px-4 py-2 text-xs font-medium text-sp-on-action disabled:opacity-40" style={{ background: 'var(--sp-action)' }}>{item.guidance?.action_label ?? 'Review & connect'}</button></div></div></article>; })}</div></section>}

        <section><div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-sm font-semibold">Saved accounts</h2><p className="mt-1 text-xs text-sp-muted">Check account health, repair access or disconnect. Accounts linked to a pending request show what verification will fulfill.</p></div>{loading && <Loader2 className="h-4 w-4 animate-spin text-sp-muted" />}</div>{data.connections.length === 0 ? <div className="connections-empty rounded-2xl border border-dashed border-sp-line px-5 py-6"><Plug className="mx-auto h-7 w-7 text-sp-muted" /><h3 className="mt-3 text-sm text-sp-muted">No accounts connected yet</h3><p className="mt-1 text-xs text-sp-muted">{data.providers.length ? 'Start by choosing a service below. You’ll review its setup before connecting.' : 'No supported services are available to connect right now.'}</p>{data.providers.length > 0 && <a href="#connection-services" className="connections-text-link">Choose a service <ArrowRight size={15} /></a>}</div> : <div className="connections-account-list">{data.connections.map(connection => { const catalog = data.providers.find(p => p.id === connection.provider); const setupRequest = savedSetupRequest(connection, data.requests); const reviewSetup = connection.guidance?.next_action === 'edit'; return <article key={connection.id} className="connections-account rounded-2xl p-5" style={{ background: 'rgb(var(--sp-panel-rgb, 10 16 29) / .86)', border: `1px solid ${connection.status === 'needs_attention' ? 'rgba(251,146,60,.3)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / .08)'}` }}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{connection.account_label}</h3></div><p className="mt-1 text-[11px] uppercase tracking-wider text-sp-muted">{catalog?.label ?? connection.provider}</p></div><StatusBadge status={connection.status} /></div><ConnectionAccountDetails connection={connection} provider={catalog} />
        <p className="mt-3 flex items-center gap-1.5 text-sm text-sp-muted"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />Last verified: {formatDate(connection.last_verified_at)}</p>
        <ConnectionGuidance guidance={connection.guidance} compact={connection.status === 'connected'} />{setupRequest && <div className="mt-4 rounded-lg border border-sp-line p-3"><p className="text-sm font-medium">Linked setup request · {setupRequest.status}</p><RequestDetails request={setupRequest} /><p className="text-sm text-sp-muted">{setupRequest.status === 'pending' ? 'Successful verification will fulfill this request using this account.' : setupRequest.status === 'denied' ? 'Reopen this request under Denied requests before verifying this account.' : 'This request is already fulfilled. Verification only updates this account.'}</p></div>}<div className="mt-5 flex flex-wrap gap-2 border-t border-sp-line pt-4"><button onClick={() => { if (reviewSetup) openForm(connection.provider, undefined, connection.id); else void verify(connection); }} disabled={Boolean(busyKey) || setupRequest?.status === 'denied'} className="flex items-center gap-1.5 rounded-lg border border-sp-line px-3 py-2 text-[11px] text-sp-muted hover:bg-sp-ink/5 disabled:opacity-40">{busyKey === `verify-${connection.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}{setupRequest?.status === 'pending' ? `${connection.guidance?.action_label ?? 'Verify and fulfill'} (request #${setupRequest.id})` : connection.guidance?.action_label ?? 'Check access'}</button><button onClick={() => openForm(connection.provider, undefined, connection.id)} disabled={!catalog || Boolean(busyKey)} className="flex items-center gap-1.5 rounded-lg border border-sp-accent/15 px-3 py-2 text-[11px] text-sp-accent hover:bg-sp-accent/[.06] disabled:opacity-40"><RotateCcw className="h-3 w-3" />Edit connection</button><button onClick={event => { confirmationTrigger.current = event.currentTarget; setConfirm({ kind: 'disconnect', id: connection.id, label: connection.account_label }); }} disabled={Boolean(busyKey)} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-sp-danger hover:bg-red-400/[.07] hover:text-sp-danger disabled:opacity-40"><Trash2 className="h-3 w-3" />Disconnect</button></div>{catalog?.capabilities?.subscriptions && <ConnectionSubscriptions connection={connection} busy={Boolean(busyKey)} onSave={resources => configureSubscriptions(connection.id, resources)} />}</article>; })}</div>}</section>

        <section id="connection-services"><div className="mb-3"><h2 className="text-sm font-semibold">Available services</h2><p className="mt-1 text-xs text-sp-muted">{data.providers.length ? 'Add another account for a service. Manage saved accounts above.' : 'No services are available to connect right now.'}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.providers.map(item => <button key={item.id} onClick={() => openForm(item.id)} disabled={Boolean(busyKey)} className="group rounded-2xl p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-40" style={{ background: 'rgb(var(--sp-panel-rgb, 10 16 29) / .72)', border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / .08)' }}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sp-accent/[.09]"><Plug className="h-4 w-4 text-sp-accent" /></div><div><span className="block text-sm font-medium">{item.label}</span><span className="text-[10px] text-sp-muted">{data.connections.some(connection => connection.provider === item.id) ? 'Add another account' : 'Set up connection'}</span></div></div><ArrowRight className="h-3.5 w-3.5 text-sp-muted group-hover:text-sp-accent" /></div></button>)}</div></section>

        <FulfilledRequests requests={data.requests} connections={data.connections} />
        {denied.length > 0 && <section><div className="mb-3"><h2 className="text-sm font-semibold text-sp-ink">Denied requests</h2><p className="mt-1 text-xs text-sp-muted">These stay closed until you explicitly reopen them.</p></div><div className="space-y-2">{denied.map(item => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border border-sp-line bg-sp-ink/[.02] p-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><span className="text-xs font-medium">{data.providers.find(p => p.id === item.provider)?.label ?? item.provider}</span><StatusBadge status="denied" /></div><RequestDetails request={item} /></div><button onClick={() => void updateRequest(item, 'reopen')} disabled={Boolean(busyKey)} className="flex items-center justify-center gap-1.5 rounded-lg border border-sp-line px-3 py-2 text-[11px] text-sp-muted hover:bg-sp-ink/5 disabled:opacity-40">{busyKey === `request-${item.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}Reopen request</button></div>)}</div></section>}
      </>}
    </main>
    <AlertDialog open={Boolean(confirm)} onOpenChange={open => { if (!open && !busyKey) setConfirm(null); }}><AlertDialogContent onCloseAutoFocus={event => { if (confirmationTrigger.current?.isConnected) { event.preventDefault(); confirmationTrigger.current.focus(); } }} className="product-surface science-product-theme connections-dialog product-dialog max-h-[85dvh] overflow-y-auto border-sp-line bg-sp-panel text-sp-ink"><AlertDialogHeader><AlertDialogTitle className="break-words">{confirm?.kind === 'disconnect' ? `Disconnect ${confirm.label}?` : `Deny ${confirm?.label} request #${confirm?.id} for ${confirmationRequest?.metadata.access?.target || 'the unspecified target'}?`}</AlertDialogTitle><AlertDialogDescription className="text-sp-muted">{confirm?.kind === 'disconnect' ? `This permanently removes the saved connection and its encrypted credentials. It cannot be undone. ${disconnectNotice ?? 'Check the external service if you also need to revoke access there.'}` : `${currentSapiens.name} will be told this specific access request was denied. Other accounts and requests are unaffected.`}</AlertDialogDescription>{confirmationRequest && <RequestDetails request={confirmationRequest} />}</AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={Boolean(busyKey)} className="border-sp-line bg-transparent text-sp-ink hover:bg-sp-ink/5">Cancel</AlertDialogCancel><AlertDialogAction disabled={Boolean(busyKey)} onClick={event => { event.preventDefault(); if (!confirm) return; if (confirm.kind === 'disconnect') void disconnect(confirm.id); else { const item = data?.requests.find(r => r.id === confirm.id); if (item) void updateRequest(item, 'reject'); } }} className="connections-destructive">{busyKey ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}{confirm?.kind === 'disconnect' ? 'Disconnect permanently' : 'Deny request'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
