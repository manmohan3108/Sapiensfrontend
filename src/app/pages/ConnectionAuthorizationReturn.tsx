import { useEffect, useRef, useState } from 'react';
import '../../styles/connections.css';

/** Public return page: it cannot exchange credentials or approve a connection. */
export function ConnectionAuthorizationReturn() {
  const handled = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
    setReady(params.get('result') === 'ready');
  }, []);
  return <main className="product-surface science-product-theme connections-page min-h-screen p-6 text-sp-ink">
    <h1 className="text-xl font-semibold">Return to Connections</h1>
    <p role="status" className="my-4 max-w-lg text-sp-muted">{ready
      ? 'Continue in the Connections window to review the account. Access is not granted until you confirm it there.'
      : 'Sign-in could not be completed. Return to Connections, review the saved account and start again. No new access has been granted.'}</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => window.close()} className="rounded-lg border border-sp-line px-4 py-2 hover:bg-sp-recessed">Close this window</button>
      <a href="/connections" className="rounded-lg border border-sp-line px-4 py-2 hover:bg-sp-recessed">Open Connections</a>
    </div>
  </main>;
}
