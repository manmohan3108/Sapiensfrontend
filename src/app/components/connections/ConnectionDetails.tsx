import { useId, useState } from 'react';
import type { SapiensConnection, SapiensConnectionRequest } from '../../types/connectionTypes';

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
    typeof metadata.preset === 'string' ? `preset: ${metadata.preset}` : '',
    connection.status.replaceAll('_', ' '),
  ].filter(Boolean).join(' · ');
}

export function ConnectionAccountDetails({ connection }: { connection: SapiensConnection }) {
  const metadata = connection.metadata;
  const identity = metadata.provider_identity;
  const verified = identity && typeof identity === 'object' ? Object.entries(identity)
    .filter(([key, value]) => ['mail', 'userPrincipalName', 'displayName', 'id'].includes(key) && typeof value === 'string')
    .map(([key, value]) => `${key}: ${value}`).join('; ') : '';
  return <div className="my-3 space-y-2 text-sm break-words">
    <p>{connectionAccountLabel(connection)}</p>
    {verified && <p className="text-sp-muted">Last verified identity: {verified}</p>}
    {Object.entries({ access_note: 'Owner access description', enabled_tools: 'Tool filter', allowed_scopes: 'Configured scopes', command_timeout: 'Command timeout (seconds)' }).map(([key, label]) => {
      const value = metadata[key];
      if ((typeof value !== 'string' && typeof value !== 'number') || value === '') return null;
      return <p key={key} className="text-sp-muted">{label}: {value}</p>;
    })}
  </div>;
}

export function ConnectionPublicKey({ connection }: { connection: SapiensConnection }) {
  const publicKeyId = useId();
  const [copyStatus, setCopyStatus] = useState('');
  const publicKey = connection.metadata.public_key;
  if (typeof publicKey !== 'string' || !publicKey) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(publicKey); setCopyStatus('Public key copied'); }
    catch { setCopyStatus('Select the public key below and copy it manually.'); }
  };
  return <section className="mt-4 space-y-3 rounded-lg border border-sp-line p-4" aria-label="SSH public key installation">
    <h3 className="text-sm font-medium">{connection.status === 'connected' ? 'SSH public key' : 'Install and verify SSH access'}</h3>
    <p className="text-sm text-sp-muted">Install this public key for {connection.account_identifier} on {connection.workspace}. The private key is encrypted on the server and is never displayed.</p>
    <label className="block text-sm" htmlFor={publicKeyId}>Public key</label>
    <textarea id={publicKeyId} readOnly value={publicKey} rows={3} spellCheck={false}
      className="w-full rounded border border-sp-line bg-sp-panel p-2 font-mono text-sm text-sp-ink focus-visible:ring-2 focus-visible:ring-sp-accent" />
    <button type="button" onClick={() => void copy()} className="rounded border border-sp-line px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-sp-accent">Copy public key</button>
    <p role="status" className="text-sm text-sp-muted">{copyStatus}</p>
    {connection.status !== 'connected' && <p className="text-sm text-sp-muted">After installation, edit this connection to enter the VM’s trusted host fingerprint, then save and verify. The host fingerprint identifies the VM; it is different from this public key. SSH tools remain unavailable until verification succeeds.</p>}
    <p className="text-sm text-sp-muted">Use a dedicated non-root account. VM file permissions and database roles control access; the access description does not enforce it. Keep application secrets and administrator privileges out of this account’s reach.</p>
    <p className="text-sm text-sp-muted">To replace the key, create and verify a separate connection first. Disconnect removes local credentials; remove this public key from the VM to revoke it there. An already-running command may continue.</p>
  </section>;
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
    <button type="button" onClick={() => void save()} disabled={busy || connection.status !== 'connected'}
      className="mt-2 rounded-lg border border-sp-line px-3 py-2 text-sm hover:bg-sp-ink/5 disabled:opacity-40">{busy ? 'Saving…' : 'Save notification settings'}</button>
    {connection.status !== 'connected' && <p className="mt-2 text-sm text-sp-muted">Verify this account before changing subscriptions.</p>}
  </details>;
}
