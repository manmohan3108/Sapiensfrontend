import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { backendAvailability } from '../core/api/backendAvailability';
import { SapiensBrandMark } from './customer/SapiensBrandMark';
import { ThemeToggle } from './ThemeToggle';
import '../../styles/science-direction.css';
import '../../styles/backend-unavailable.css';

const messages = {
  restarting: { title: 'The server is restarting.', description: 'Sapiens will be available again shortly. We are checking the connection automatically.' },
  unavailable: { title: 'Temporarily out of reach.', description: 'We cannot reach the Sapiens server right now. We are checking the connection automatically.' },
  offline: { title: 'You are offline.', description: 'Check your internet connection. We will keep checking for the server to become reachable.' },
  recovered: { title: 'Connection restored.', description: 'The server is responding again. Reload to refresh this page and continue.' },
};

function ConnectionIllustration({ paused }: { paused: boolean }) {
  return <div className={`connection-illustration${paused ? ' is-paused' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 420 420" fill="none" focusable="false">
      <path className="connection-guide" d="M20 210H400M210 20V400M70 70L350 350M70 350L350 70"/>
      <circle className="connection-guide" cx="210" cy="210" r="172"/>
      <g className="connection-orbits">
        {[0, 60, 120].map(angle => <ellipse key={angle} cx="210" cy="210" rx="155" ry="62" transform={`rotate(${angle} 210 210)`}/>)}
        <circle className="connection-marker" cx="365" cy="210" r="5"/>
      </g>
      <text x="34" y="60">Σ</text><text x="350" y="80">π</text><text x="45" y="352">θ</text><text x="348" y="360">∞</text>
    </svg>
    <SapiensBrandMark className="connection-core"/>
    <span className="connection-equation">x = r cos θ &nbsp;·&nbsp; y = r sin θ</span>
  </div>;
}

/** Keep the router mounted underneath; recovery never replays a user action. */
export function BackendUnavailableScreen() {
  const availability = useSyncExternalStore(backendAvailability.subscribe, backendAvailability.getSnapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const [paused, setPaused] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const open = availability !== 'available';

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  if (availability === 'available') return null;
  const message = messages[availability];
  const recovered = availability === 'recovered';
  return <dialog ref={dialog} className="direction-page direction-world direction-science backend-unavailable"
    aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => event.preventDefault()}>
    <div className="connection-grid" aria-hidden="true"/>
    <header className="connection-header">
      <span className="connection-brand"><SapiensBrandMark/>Sapiens</span>
      <ThemeToggle className="connection-theme"/>
    </header>
    <div className="connection-main">
      <div className="connection-copy">
        <p className="connection-status" role="status" aria-live="polite"><span aria-hidden="true"/>{recovered ? 'Server available' : 'Waiting for connection'}</p>
        <h1 id={titleId}>{message.title}</h1>
        <p id={descriptionId} className="connection-description">{message.description}</p>
        <button type="button" className="connection-reload" onClick={() => window.location.reload()} autoFocus>
          <RefreshCw size={19} aria-hidden="true"/>Reload page
        </button>
        <p className="connection-note">Reloading may discard unsaved edits.</p>
      </div>
      <div className="connection-study">
        <ConnectionIllustration paused={paused || recovered}/>
        {!recovered && <button type="button" className="connection-motion" onClick={() => setPaused(value => !value)}>
          {paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}{paused ? 'Resume animation' : 'Pause animation'}
        </button>}
      </div>
    </div>
    <footer className="connection-footer">Check any interrupted action before submitting it again.</footer>
  </dialog>;
}
