import { connectionsService } from './connectionsService';
import type { SapiensConnection, UpdateConnectionPayload } from '../../types/connectionTypes';

export const AUTHORIZATION_RETURN = 'sapiens-connection-authorization';

/** Only authorization codes cross this browser boundary; tokens stay on the backend. */
export async function authorizeConnection(sapienId: number, payload: UpdateConnectionPayload,
  signal: AbortSignal, onStage: (stage: string) => void): Promise<SapiensConnection> {
  const popup = window.open('about:blank', '_blank', 'popup,width=640,height=760');
  if (!popup) throw new Error('Allow the sign-in window in your browser, then try again.');
  try {
    signal.throwIfAborted();
    onStage('Preparing secure sign-in…');
    const started = await connectionsService.startAuthorization(sapienId, payload);
    signal.throwIfAborted();
    const url = new URL(started.authorization_url);
    if (url.protocol !== 'https:') throw new Error('The service returned an invalid sign-in address.');
    if (popup.closed) {
      await connectionsService.completeAuthorization(sapienId, started.connection.id, started.state, '', true);
      throw new Error('The sign-in window closed. Start sign-in again.');
    }
    const result = await new Promise<{ code: string; cancelled: boolean }>((resolve, reject) => {
      const cleanup = () => {
        window.removeEventListener('message', receive);
        signal.removeEventListener('abort', abort);
        window.clearInterval(closed);
        window.clearTimeout(expired);
      };
      const finish = (code: string, cancelled: boolean) => { cleanup(); resolve({ code, cancelled }); };
      const receive = (event: MessageEvent) => {
        if (event.origin !== window.location.origin || event.source !== popup
          || event.data?.type !== AUTHORIZATION_RETURN || event.data?.state !== started.state) return;
        finish(typeof event.data.code === 'string' ? event.data.code : '', event.data.cancelled === true);
      };
      const abort = () => { cleanup(); reject(new Error('Sign-in stopped because the selected Sapien or page changed.')); };
      const closed = window.setInterval(() => { if (popup.closed) finish('', true); }, 500);
      const expired = window.setTimeout(() => finish('', false), 10 * 60 * 1000);
      window.addEventListener('message', receive);
      signal.addEventListener('abort', abort, { once: true });
      popup.location.href = url.href;
      onStage('Waiting for sign-in. Complete it in the opened window, or close that window to cancel.');
    });
    signal.throwIfAborted();
    onStage(result.cancelled ? 'Cancelling sign-in…' : 'Checking the signed-in account…');
    const completed = await connectionsService.completeAuthorization(sapienId, started.connection.id,
      started.state, result.code, result.cancelled);
    signal.throwIfAborted();
    return completed.connection;
  } finally {
    popup.close();
    onStage('');
  }
}
