import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link, useLocation } from 'react-router';
import { ChevronDown, LayoutGrid, Loader2, LogOut, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { sapiensService } from '../../core/services/sapiensService';
import { selectionStorage } from '../../core/auth/selectionStorage';
import type { Sapiens } from '../../types/sapiensTypes';
import { appArea, appDestinations, destinationAfterSwitch, simulationLabPath } from '../../core/navigation/appNavigation';
import { useNavigationMemory } from './NavigationState';
import { useSelectSapien } from './useSelectSapien';
import { useNavigationScroll } from './useNavigationScroll';
import { ThemeToggle } from '../ThemeToggle';
import { SapiensBrandMark } from '../customer/SapiensBrandMark';
import '../../../styles/app-navigation.css';

export function AppNavigationFrame({ children, requiresSelection = false }: { children: ReactNode; requiresSelection?: boolean }) {
  const { user, logout } = useAuth();
  const selected = useSapiensStore(state => state.currentSapiens);
  const location = useLocation();
  const memory = useNavigationMemory();
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const [target, setTarget] = useState('/workspace');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Sapiens[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { select, busy, error, clearError } = useSelectSapien();
  const pickerTrigger = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const area = appArea(location.pathname);
  useNavigationScroll(page, `${area === 'directory' ? 'directory' : selected?.id || 'none'}:${location.pathname}${location.search}`);
  const isRun = /^\/admin\/simulations\/[^/]+\/world(?:\/|$)/.test(location.pathname);
  const admin = user?.role === 'admin';
  const destinations = appDestinations(admin);
  const keyFor = (id: string) => `${selected?.id || 'none'}:${id}`;

  useEffect(() => {
    if (requiresSelection && !selected && !selectionStorage.read()) {
      setTarget(destinationAfterSwitch(location.pathname)); setPicker(true);
    }
  }, [requiresSelection, selected?.id, location.pathname]);

  useEffect(() => {
    if (area && area !== 'simulations') memory.destinations.set(keyFor(area), location.pathname + location.search);
    setMenu(false);
  }, [location.pathname, location.search, selected?.id, area, memory]);
  useEffect(() => {
    if (!picker) return;
    let active = true;
    setLoading(true); setListError(false); setItems([]);
    sapiensService.listSapiens().then(list => { if (active) setItems(list); })
      .catch(() => { if (active) setListError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [picker, attempt]);

  const openPicker = (destination: string) => {
    setTarget(destination); setQuery(''); clearError(); setMenu(false); setPicker(true);
  };
  const hrefFor = (item: typeof destinations[number]) => item.id === 'simulations'
    ? simulationLabPath(selected?.id, selected?.name, area === 'analyse' ? location.pathname : '/workspace')
    : memory.destinations.get(keyFor(item.id)) || item.path;
  const follow = (event: MouseEvent<HTMLAnchorElement>, item: typeof destinations[number]) => {
    // Preserve native open-in-new-tab behaviour; the destination guard also offers a picker.
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && item.needsSapien && !selected) {
      event.preventDefault(); openPicker(item.path);
    } else setMenu(false);
  };
  const links = destinations.map(item => <Link key={item.id} to={hrefFor(item)} aria-current={area === item.id ? 'page' : undefined} onClick={event => follow(event, item)}>{item.id === 'directory' && <LayoutGrid size={16} aria-hidden="true" />}{item.label}</Link>);
  const matched = items.filter(item => [item.name, item.id, item.role].some(value => value?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));

  return <div className="app-shell" data-app-area={area || 'other'}>
    <header className="app-navigation product-surface science-product-theme">
      <Link to="/" className="app-brand" aria-label="Sapiens website"><SapiensBrandMark /></Link>
      <nav className="app-destinations" aria-label="Main navigation">{links}</nav>
      <button ref={pickerTrigger} className="app-sapien-picker" onClick={() => openPicker(destinationAfterSwitch(location.pathname))} aria-haspopup="dialog" aria-expanded={picker}>
        <span><small>{isRun ? 'App Sapien' : 'Selected Sapien'}</small><strong>{selected?.name || 'Choose a Sapiens'}{selected && <em> #{selected.id}</em>}</strong></span><ChevronDown size={16} aria-hidden="true" />
      </button>
      <div className="app-account-controls"><ThemeToggle /><details className="app-account" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
        <summary aria-label="Account menu">Account<ChevronDown size={14} aria-hidden="true" /></summary>
        <div><p>{user?.username}<small>{admin ? 'Admin account' : 'Customer account'}</small></p><button onClick={() => void logout()}><LogOut size={16} />Sign out</button></div>
      </details></div>
      <button ref={menuTrigger} className="app-menu-button" aria-label="Open main navigation" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={20} /></button>
    </header>
    <Dialog.Root open={menu} onOpenChange={setMenu}><Dialog.Portal><Dialog.Overlay className="app-nav-scrim" /><Dialog.Content className="app-menu-dialog product-surface science-product-theme" onCloseAutoFocus={event => { event.preventDefault(); if (!picker) menuTrigger.current?.focus(); }}>
      <Dialog.Title>Go to</Dialog.Title><Dialog.Description className="sr-only">Navigate between your Sapiens and application pages.</Dialog.Description><Dialog.Close className="app-dialog-close" aria-label="Close navigation"><X size={20} /></Dialog.Close>
      <nav aria-label="Main navigation">{links}</nav>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={picker} onOpenChange={open => { if (!busy) setPicker(open); }}><Dialog.Portal><Dialog.Overlay className="app-nav-scrim" /><Dialog.Content className="app-picker-dialog product-surface science-product-theme" onCloseAutoFocus={event => { event.preventDefault(); pickerTrigger.current?.focus(); }}>
      <Dialog.Title>{selected ? 'Switch Sapiens' : 'Choose a Sapiens'}</Dialog.Title>
      <Dialog.Description>{isRun ? 'Open a workspace. This simulation keeps its original Sapien.' : `Choose who to open in ${target.startsWith('/admin/analyse') ? 'Analyse' : target === '/connections' ? 'Connections' : 'Workspace'}.`}</Dialog.Description>
      <Dialog.Close className="app-dialog-close" aria-label="Close Sapiens picker" disabled={Boolean(busy)}><X size={20} /></Dialog.Close>
      <label className="app-picker-search"><Search size={17} aria-hidden="true" /><input autoComplete="off" aria-label="Search Sapiens by name, ID or role" placeholder="Search name, ID or role" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="app-picker-list" aria-busy={loading || Boolean(busy)}>
        {loading ? <p role="status"><Loader2 size={18} className="animate-spin" />Loading your Sapiens…</p> : listError ? <div role="alert"><p>Couldn’t load your Sapiens.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : !items.length ? <p>No Sapiens yet. Create one from Your Sapiens.</p> : !matched.length ? <p>No Sapiens match this search.</p> : matched.map(item => <button key={item.id} disabled={Boolean(busy)} onClick={async () => { if (await select(item.id, target)) setPicker(false); }}>
          <span><strong>{item.name}</strong><small>{item.role || 'AI individual'} · ID {item.id}</small></span><span>{busy === item.id ? <Loader2 size={18} className="animate-spin" /> : item.id === selected?.id ? 'Current' : 'Open'}</span>
        </button>)}
      </div>
      {error && <p className="app-picker-error" role="alert">{error}</p>}
      <Link className="app-picker-directory" to={admin ? '/admin' : '/home'} onClick={() => setPicker(false)}>View all / create a Sapiens</Link>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
    <div ref={page} className="app-page">{children}</div>
  </div>;
}

export function OpenRunWorkspace({ sapienId }: { sapienId: string }) {
  const { select, busy, error } = useSelectSapien();
  return <div className="app-run-workspace"><button disabled={Boolean(busy)} onClick={() => void select(sapienId, '/workspace')}>{busy ? 'Opening…' : 'Open this Sapien’s workspace'}</button>{error && <p role="alert">{error}</p>}</div>;
}
