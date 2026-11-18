import { apiConfig } from '../config/apiConfig';
import { ConnectionRequestError, connectionsService, type AuthorizationStart } from './connectionsService';
import type { SapiensConnection, UpdateConnectionPayload } from '../../types/connectionTypes';

function bindBrowser(popup: Window, signal: AbortSignal): Promise<string> {
  const url = new URL(`${apiConfig.baseUrl}/connections/authorization/browser`);
  if (url.protocol !== 'https:') throw new Error('Secure sign-in requires the HTTPS backend address.');
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', receive);
      signal.removeEventListener('abort', abort);
      window.clearTimeout(expired);
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== url.origin || event.source !== popup
        || event.data?.type !== 'sapiens-connection-browser' || typeof event.data.binding !== 'string') return;
      cleanup(); resolve(event.data.binding);
    };
    const abort = () => { cleanup(); reject(new Error('Sign-in stopped.')); };
    const expired = window.setTimeout(() => {
      cleanup(); reject(new Error('Sign-in could not start. Check the backend callback and frontend return settings with your administrator.'));
    }, 15000);
    window.addEventListener('message', receive);
    signal.addEventListener('abort', abort, { once: true });
    popup.location.href = url.href;
  });
}

function waitForNextCheck(signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => { window.clearTimeout(timer); reject(new Error('Sign-in stopped.')); };
    const timer = window.setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 2000);
    signal.addEventListener('abort', abort, { once: true });
  });
}

async function waitForAccount(sapienId: number, started: AuthorizationStart,
  signal: AbortSignal): Promise<SapiensConnection> {
  const deadline = Date.now() + 10 * 60 * 1000;
  // Read-only status checks survive providers that detach a popup's opener.
  // Never repeat token exchange or infer cancellation from popup.closed alone.
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    const { connection } = await connectionsService.get(sapienId, started.connection.id, signal);
    if (connection.metadata.authorization_attempt !== started.connection.metadata.authorization_attempt)
      throw new ConnectionRequestError('A newer sign-in replaced this attempt. Review the saved account.', connection);
    const stage = connection.metadata.setup_stage;
    if (stage === 'awaiting_confirmation') return connection;
    if (stage !== 'awaiting_sign_in')
      throw new ConnectionRequestError(connection.guidance?.description ?? 'Sign-in did not complete. Review the saved account and try again.', connection);
    await waitForNextCheck(signal);
  }
  throw new ConnectionRequestError('Sign-in expired. Start again from the saved account.', started.connection);
}

/** The backend receives OAuth codes and tokens; this browser observes safe account status only. */
export async function authorizeConnection(sapienId: number, payload: UpdateConnectionPayload,
  signal: AbortSignal, onStage: (stage: string) => void): Promise<SapiensConnection> {
  const popup = window.open('about:blank', '_blank', 'popup,width=640,height=760');
  if (!popup) throw new Error('Allow the sign-in window in your browser, then try again.');
  let started: AuthorizationStart | undefined;
  try {
    signal.throwIfAborted();
    onStage('Preparing secure sign-in…');
    const binding = await bindBrowser(popup, signal);
    signal.throwIfAborted();
    started = await connectionsService.startAuthorization(sapienId, { ...payload, browser_binding: binding });
    signal.throwIfAborted();
    const url = new URL(started.authorization_url);
    if (url.protocol !== 'https:') throw new Error('The service returned an invalid sign-in address.');
    popup.location.href = url.href;
    onStage('Complete sign-in in the opened window. Access stays disabled until you review and confirm the account here.');
    return await waitForAccount(sapienId, started, signal);
  } catch (error) {
    if (started) {
      // Cancellation is scoped to this exact attempt; a completed or newer attempt is untouched.
      await connectionsService.cancelAuthorization(sapienId, started.connection.id, started.state).catch(() => undefined);
      if (!(error instanceof ConnectionRequestError))
        throw new ConnectionRequestError(error instanceof Error ? error.message : 'Sign-in stopped.', started.connection);
    }
    throw error;
  } finally {
    popup.close();
    onStage('');
  }
}
