import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { IdentityArt } from '../components/customer/IdentityArt';
import { sapiensService } from '../core/services/sapiensService';
import { useSapiensStore } from '../core/state/sapiensStore';
import type { Sapiens } from '../types/sapiensTypes';
import { validateCreation, creationFailureIsDefinitive } from '../core/customer/creation';
import '../../styles/customer.css';

export function CustomerHomePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<Sapiens[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [query, setQuery] = useState('');
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<{ id: string; message: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(params.get('create') === '1');
  const [name, setName] = useState('');
  const [focus, setFocus] = useState('');
  const [errors, setErrors] = useState<{ name?: string; focus?: string }>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [unknown, setUnknown] = useState(false);
  const [confirmed, setConfirmed] = useState<Sapiens | null>(null);
  const busy = useRef(false);
  const active = useRef(true);
  const fetchVersion = useRef(0);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => { if (params.get('create') === '1') { setDialogOpen(true); setParams({}, { replace: true }); } }, [params, setParams]);

  const refresh = useCallback(async () => {
    const version = ++fetchVersion.current;
    setLoading(true); setListError(false);
    try {
      const result = await sapiensService.listSapiens();
      if (active.current && version === fetchVersion.current) setList(result);
    } catch { if (active.current && version === fetchVersion.current) setListError(true); }
    finally { if (active.current && version === fetchVersion.current) setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const openIndividual = async (individual: Sapiens, justCreated = false) => {
    if (opening) return;
    setOpening(individual.id); setOpenError(null);
    try {
      const available = await sapiensService.listSapiens();
      if (!active.current) return;
      setList(available);
      const selected = available.find(item => item.id === individual.id);
      if (!selected) throw new Error('This Sapiens isn’t available to this account.');
      useSapiensStore.getState().setCurrentSapiens(selected);
      navigate('/workspace', { state: justCreated ? { createdName: individual.name } : undefined });
    } catch {
      if (active.current) setOpenError({ id: individual.id, message: justCreated ? `${individual.name} was created, but we couldn’t open it.` : `We couldn’t open ${individual.name}. Try again or refresh your Sapiens.` });
    } finally { if (active.current) setOpening(null); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || confirmed || unknown) return;
    const invalid = validateCreation(name, focus);
    setErrors(invalid);
    if (Object.keys(invalid).length) { if (invalid.name) nameInput.current?.focus(); else document.getElementById('sapiens-focus')?.focus(); return; }
    busy.current = true; setCreating(true); setCreateError('');
    try {
      const result = await sapiensService.createSapiens({ name: name.trim(), ...(focus.trim() ? { role: focus.trim() } : {}) });
      if (!active.current) return;
      const identity: Sapiens = { id: result.sapiensId, name: result.name, role: result.role, createdAt: result.createdAt, lastModified: result.createdAt };
      setConfirmed(identity);
      await openIndividual(identity, true);
    } catch (error) {
      if (!active.current) return;
      if (creationFailureIsDefinitive(error)) setCreateError('We couldn’t create your Sapiens. Check your entries and try again.');
      else { setUnknown(true); setCreateError('We couldn’t confirm whether your Sapiens was created.'); }
    } finally { busy.current = false; if (active.current) setCreating(false); }
  };

  const showCreation = (event: React.MouseEvent<HTMLButtonElement>) => { trigger.current = event.currentTarget; setDialogOpen(true); };
  const inspectHome = () => { setDialogOpen(false); void refresh(); };
  const filtered = list.filter(item => [item.name, item.role].some(value => value?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));

  return <div className="customer-surface"><a className="customer-skip" href="#customer-main">Skip to content</a><CustomerHeader />
    <main id="customer-main" className="customer-container customer-home">
      {loading ? <div className="customer-state" role="status" aria-busy="true">Loading your Sapiens…</div>
        : listError ? <div className="customer-state" role="alert"><h1>We couldn’t load your Sapiens</h1><p>Your list is unavailable right now.</p><button className="customer-secondary" onClick={() => void refresh()}>Try again</button></div>
        : list.length === 0 ? <section className="customer-empty"><IdentityArt stage={0} /><h1 ref={heading} tabIndex={-1}>Your shared history starts here.</h1><p>Create a Sapiens with its own name and conversation history. Return to the same individual whenever you come back.</p><button className="customer-primary" onClick={showCreation}>Create a Sapiens <Plus size={17} /></button><Link to="/">What is a Sapiens?</Link></section>
        : <><div className="customer-home-heading"><div><h1 ref={heading} tabIndex={-1}>Your Sapiens</h1><p>Choose an individual to continue with.</p></div><button className="customer-secondary" onClick={showCreation}><Plus size={17} />Create a Sapiens</button></div>
          {list.length > 3 && <div className="customer-search"><label htmlFor="sapiens-search">Search your Sapiens</label><input id="sapiens-search" type="search" placeholder="Search by name or focus" value={query} onChange={e => setQuery(e.target.value)} /></div>}
          {filtered.length === 0 ? <div className="customer-state" role="status"><h2>No Sapiens match your search</h2><button className="customer-secondary" onClick={() => setQuery('')}>Clear search</button></div> : <div className="customer-grid">{filtered.map(item => <article className="identity-card" key={item.id}><span className="identity-monogram" aria-hidden="true">{Array.from(item.name)[0]?.toUpperCase()}</span><h2>{item.name}</h2>{item.role && <p>{item.role}</p>}
            {openError?.id === item.id && <p role="alert">{openError.message}</p>}
            <button className="customer-primary" disabled={opening !== null} onClick={() => void openIndividual(item)}>{opening === item.id ? 'Opening…' : `Open ${item.name}`}<ArrowUpRight size={17} className="shrink-0" /></button></article>)}</div>}
        </>}
      {unknown && !dialogOpen && <div className="customer-notice" role="status"><strong>Creation outcome unknown.</strong> A refreshed list or matching name does not confirm which request created an individual. We have not repeated the request.<br /><button className="customer-secondary" onClick={showCreation}>Review creation outcome</button></div>}
      {confirmed && !dialogOpen && <div className="customer-notice" role="status">{confirmed.name} was created.<br /><button className="customer-secondary" disabled={opening !== null} onClick={() => void openIndividual(confirmed, true)}>Open {confirmed.name}</button></div>}
    </main>
    <Dialog.Root open={dialogOpen} onOpenChange={value => { if (!busy.current && !opening) setDialogOpen(value); }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" /><Dialog.Content className="customer-surface customer-dialog fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 border p-8 shadow-2xl" onOpenAutoFocus={event => { if (!confirmed && !unknown) { event.preventDefault(); nameInput.current?.focus(); } }} onCloseAutoFocus={event => { event.preventDefault(); (trigger.current?.isConnected ? trigger.current : heading.current)?.focus(); }}>
        <Dialog.Title className="customer-form-title">{confirmed ? `${confirmed.name} was created` : 'Create a Sapiens'}</Dialog.Title>
        <Dialog.Description className="customer-form-description mt-3">{confirmed ? 'Your individual has been created. Opening its workspace does not create another.' : 'Give this individual a name. Its conversations will have their own history.'}</Dialog.Description>
        <button className="customer-icon-button absolute right-3 top-3" aria-label="Close creation" disabled={creating || opening !== null} onClick={() => setDialogOpen(false)}><X size={18} /></button>
        {confirmed ? <div><p className="customer-notice" role="status">{openError?.message || 'Opening the workspace…'}</p><div className="customer-form-actions"><button className="customer-secondary" disabled={opening !== null} onClick={inspectHome}>Back to your Sapiens</button><button className="customer-primary" disabled={opening !== null} onClick={() => void openIndividual(confirmed, true)}>{opening ? 'Opening…' : `Open ${confirmed.name}`}</button></div></div>
          : <form onSubmit={submit} noValidate>
            {list.length > 0 && <p className="customer-form-description mt-4">This creates a separate Sapiens. To continue with an existing one, open it from your home.</p>}
            {createError && <div className="customer-notice" role="alert">{createError}{unknown && <p>Check your Sapiens before deciding what to do next. Refreshing the list or finding a matching name cannot confirm this request’s outcome. We won’t submit it again automatically.</p>}</div>}
            <div className="customer-field"><label htmlFor="sapiens-name">Name</label><input ref={nameInput} id="sapiens-name" autoComplete="off" placeholder="e.g. Atlas" value={name} disabled={creating || unknown} aria-required="true" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} onChange={e => setName(e.target.value)} onBlur={() => setErrors(value => ({ ...value, name: validateCreation(name, focus).name }))} />{errors.name && <p id="name-error" className="customer-field-error" role="alert">{errors.name}</p>}</div>
            <div className="customer-field"><label htmlFor="sapiens-focus">Focus <span className="font-normal">(optional)</span></label><input id="sapiens-focus" autoComplete="off" placeholder="e.g. Ideas and reading" value={focus} disabled={creating || unknown} aria-invalid={Boolean(errors.focus)} aria-describedby={`focus-help${errors.focus ? ' focus-error' : ''}`} onChange={e => setFocus(e.target.value)} onBlur={() => setErrors(value => ({ ...value, focus: validateCreation(name, focus).focus }))} /><small id="focus-help">Descriptive context about what you’d like to explore together. It may inform conversations; it does not add specialist skills or access. Leave it blank to use the default, “generalist.”</small>{errors.focus && <p id="focus-error" className="customer-field-error" role="alert">{errors.focus}</p>}</div>
            <div className="customer-form-actions"><button type="button" className="customer-secondary" disabled={creating} onClick={() => unknown ? inspectHome() : setDialogOpen(false)}>{unknown ? 'Check your Sapiens' : 'Cancel'}</button>{!unknown && <button type="submit" className="customer-primary" disabled={creating}>{creating ? 'Creating…' : 'Create Sapiens'}</button>}</div>
            <p className="sr-only" role="status">{creating ? 'Creating your Sapiens. Please wait.' : ''}</p>
          </form>}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
