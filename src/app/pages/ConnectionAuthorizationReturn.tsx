import { useEffect, useRef, useState } from 'react';
import { AUTHORIZATION_RETURN } from '../core/services/browserAuthorization';
import '../../styles/connections.css';

/** Public return page: it cannot exchange credentials or approve a connection. */
export function ConnectionAuthorizationReturn() {
  const handled = useRef(false);
  const [returned, setReturned] = useState(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState(null, '', window.location.pathname);
    if (!window.opener || !params.get('state')) return;
    window.opener.postMessage({ type: AUTHORIZATION_RETURN, state: params.get('state'),
      code: params.get('code') ?? '', cancelled: params.has('error') || !params.has('code') }, window.location.origin);
    setReturned(true);
  }, []);
  return <main className="product-surface science-product-theme connections-page min-h-screen p-6 text-sp-ink">
    <h1 className="text-xl font-semibold">Return to Connections</h1>
    <p role="status" className="my-4 max-w-lg text-sp-muted">{returned
      ? 'Continue in the Connections window to review the account. Access is not granted until you confirm it there.'
      : 'The original Connections window is unavailable. Close this window and start sign-in again from Connections.'}</p>
    <button type="button" onClick={() => window.close()} className="rounded-lg border border-sp-line px-4 py-2">Close this window</button>
  </main>;
}
