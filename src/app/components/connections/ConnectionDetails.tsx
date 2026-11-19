import { RateLimitButton } from '../shared/RateLimitButton';
import { secondsRemaining } from '../../core/api/rateLimits';
import { useState } from 'react';
import type { ConnectionProvider, SapiensConnection, SapiensConnectionRequest } from '../../types/connectionTypes';

const verifiedIdentityLabels: Record<string, string> = {
  mail: 'Email', userPrincipalName: 'Sign-in name', displayName: 'Name', username: 'Username',
};

function dateLabel(value: string | null) {
  if (!value) return 'Time not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
}

export function connectionAccountLabel(connection: SapiensConnection): string {
  const metadata = connection.metadata;
  return [
    `#${connection.id} ${connection.account_label}`,
    connection.workspace || 'No workspace', connection.account_identifier || 'No identity',
    typeof metadata.port === 'number' ? `port ${metadata.port}` : '',
    metadata.read_only === true ? 'Read-only' : metadata.read_only === false ? 'Writes enabled where permitted' : '',
    connection.status.replaceAll('_', ' '),
  ].filter(Boolean).join(' · ');
}

export function ConnectionAccountDetails({ connection, provider }: { connection: SapiensConnection; provider?: ConnectionProvider }) {
  const metadata = connection.metadata;
  const identity = metadata.provider_identity;
  const verified = identity && typeof identity === 'object' ? Object.entries(identity)
    .filter(([key, value]) => Object.keys(verifiedIdentityLabels).includes(key) && typeof value === 'string' && value)
    .map(([key, value]) => ({ label: verifiedIdentityLabels[key], value: String(value) })) : [];
  const choices = provider?.fields.filter(field => field.choices?.length && typeof metadata[field.name] === 'string') ?? [];
  const technical = Object.entries({ enabled_tools: 'Tool name filter', allowed_scopes: 'Permission filter', command_timeout: 'Command time limit (seconds)', preset: 'Tool collection code' })
    .map(([key, label]) => ({ label, value: metadata[key] }))
    .filter(item => (typeof item.value === 'string' || typeof item.value === 'number') && item.value !== '');
  if (identity && typeof identity === 'object' && 'id' in identity && typeof identity.id === 'string' && identity.id) {
    technical.push({ label: 'Verified account ID', value: identity.id });
  }
  return <div className="my-3 space-y-2 text-sm break-words">
    <dl className="grid gap-3 sm:grid-cols-2">
      <div><dt className="text-sp-muted">{provider?.fields.find(field => field.source === 'workspace')?.label ?? 'Workspace'}</dt><dd>{connection.workspace || 'Not provided'}</dd></div>
      <div><dt className="text-sp-muted">{provider?.fields.find(field => field.source === 'account_identifier')?.label ?? 'Account'}</dt><dd>{connection.account_identifier || 'Not provided'}</dd></div>
      <div><dt className="text-sp-muted">Connection</dt><dd>#{connection.id}</dd></div>
      {typeof metadata.port === 'number' && <div><dt className="text-sp-muted">Port</dt><dd>{metadata.port}</dd></div>}
      {choices.map(field => <div key={field.name}><dt className="text-sp-muted">{field.label}</dt><dd>{field.choice_details?.[String(metadata[field.name])]?.label ?? String(metadata[field.name])}</dd></div>)}
    </dl>
    <p className="text-sp-muted">{metadata.read_only === true ? 'Reading only. Change operations are disabled.' : 'Actions are limited by the account’s permissions and any configured restrictions.'}</p>
    {typeof metadata.access_note === 'string' && metadata.access_note && <p>Owner’s access description: {metadata.access_note}</p>}
    {verified.length > 0 && <div><p className="font-medium">Last verified account</p><dl className="mt-1 grid gap-2 sm:grid-cols-2">{verified.map(item => <div key={item.label}><dt className="text-sp-muted">{item.label}</dt><dd>{item.value}</dd></div>)}</dl></div>}
    {technical.length > 0 && <details><summary className="cursor-pointer text-sp-muted">Advanced details</summary><dl className="mt-2 space-y-2">{technical.map(item => <div key={item.label}><dt className="text-sp-muted">{item.label}</dt><dd>{String(item.value)}</dd></div>)}</dl></details>}
  </div>;
}


export function FulfilledRequests({ requests, connections }: {
  requests: SapiensConnectionRequest[]; connections: SapiensConnection[];
}) {
  const fulfilled = requests.filter(request => request.status === 'connected');
  if (!fulfilled.length) return null;
  return <section aria-label="Fulfilled access requests">
    <h2 className="text-sm font-semibold">Fulfilled requests</h2>
    <p className="mt-1 text-sm text-sp-muted">Past owner decisions. Check the saved account's current health before relying on access.</p>
    <div className="mt-3 space-y-3">{fulfilled.map(request => {
      const account = connections.find(item => item.id === request.metadata.connection_id);
      return <article key={request.id} className="rounded-xl border border-sp-line p-4">
        <p className="font-medium break-words">{request.metadata.access?.target || request.provider}</p>
        <p className="mt-1 text-sm break-words">{request.reason || 'Access request fulfilled.'}</p>
        <p className="mt-2 text-sm text-sp-muted break-words">{account
          ? connectionAccountLabel(account)
          : request.metadata.connection_id ? 'The selected account has been removed.' : 'Legacy request: selected account was not recorded.'}</p>
        <p className="mt-1 text-sm text-sp-muted">{dateLabel(request.resolved_at)}</p>
      </article>;
    })}</div>
  </section>;
}

export function ConnectionSubscriptions({ connection, busy, onSave }: {
  connection: SapiensConnection; busy: boolean; onSave: (resources: string[]) => Promise<void>;
}) {
  const stored = connection.metadata.notification_resources;
  const [resources, setResources] = useState(Array.isArray(stored) ? stored.join('\n') : '');
  const [error, setError] = useState('');
  const status = String(connection.metadata.notification_status || 'not_configured').replaceAll('_', ' ');
  const save = async () => {
    if (busy || secondsRemaining('api_write') > 0) return;
    setError('');
    const requested = resources.split('\n').map(value => value.trim()).filter(Boolean);
    if (requested.length > 20) { setError('Choose at most 20 notification resources.'); return; }
    try { await onSave(requested); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not save notification settings. Try again.'); }
  };
  return <details className="mt-4 border-t border-sp-line pt-3">
    <summary className="cursor-pointer text-sm">Incoming notifications: {status}</summary>
    <p className="mt-2 text-sm text-sp-muted">Only the resources you choose are subscribed. This setting does not grant permission to send replies.</p>
    {Boolean(connection.metadata.notification_gap_detected_at) && <p role="status" className="mt-2 text-sm text-sp-warning">The service reported missed notifications. Renewing the subscription cannot recover those messages.</p>}
    <label className="mt-3 block text-sm" htmlFor={`notification-resources-${connection.id}`}>Resources to listen to</label>
    <p id={`notification-help-${connection.id}`} className="mt-1 text-sm text-sp-muted">One Microsoft Graph resource per line: me/messages for your mailbox, chats/CHAT_ID/messages for a chat, or teams/TEAM_ID/channels/CHANNEL_ID/messages for a channel. Clear all lines to stop listening.</p>
    <textarea id={`notification-resources-${connection.id}`} name="notification_resources" rows={3}
      aria-describedby={`notification-help-${connection.id}`} spellCheck={false} autoComplete="off"
      value={resources} onChange={event => setResources(event.target.value)} disabled={busy || connection.status !== 'connected'}
      className="mt-2 w-full rounded-lg border border-sp-line bg-sp-panel p-3 text-sm text-sp-ink" />
    {error && <p role="alert" className="mt-2 text-sm text-sp-danger">{error}</p>}
    <RateLimitButton type="button" onClick={() => void save()} disabled={busy || connection.status !== 'connected'}
      className="mt-2 rounded-lg border border-sp-line px-3 py-2 text-sm hover:bg-sp-ink/5 disabled:opacity-40">{busy ? 'Saving…' : 'Save notification settings'}</RateLimitButton>
    {connection.status !== 'connected' && <p className="mt-2 text-sm text-sp-muted">Verify this account before changing subscriptions.</p>}
  </details>;
}
