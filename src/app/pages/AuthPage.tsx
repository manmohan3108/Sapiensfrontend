import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AlertCircle, Brain, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { authErrorMessage, useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!username.trim()) { setError('Enter your username.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    if (isRegister && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address, or leave it blank.'); return; }
    if (isRegister && password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    if (isRegister && password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const user = isRegister
        ? await register({ username: username.trim(), password, ...(email.trim() ? { email: email.trim() } : {}) })
        : await login({ username: username.trim(), password });
      const requested = (location.state as { from?: string } | null)?.from;
      const allowedRequested = requested && (user.role === 'admin' ? requested.startsWith('/admin') : !requested.startsWith('/admin'));
      navigate(allowedRequested ? requested : user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (caught) { setError(authErrorMessage(caught)); }
    finally { setBusy(false); }
  };

  return <div className="relative grid min-h-screen overflow-hidden bg-[#070b16] text-white lg:grid-cols-[1.05fr_.95fr]">
    <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%,rgba(124,58,237,.25),transparent 34%),radial-gradient(circle at 90% 85%,rgba(6,182,212,.12),transparent 30%),radial-gradient(rgba(148,163,184,.16) 1px,transparent 1px)', backgroundSize: 'auto,auto,32px 32px' }} />
    <section className="relative hidden min-h-screen flex-col justify-between border-r border-white/[.07] p-12 lg:flex xl:p-16">
      <Link to="/login" className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-violet-600 shadow-[0_0_35px_rgba(124,58,237,.4)]"><Brain className="size-6" /></span><span className="text-lg font-semibold">Sapiens</span></Link>
      <div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-300/65">One identity, two focused experiences</p><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Continue where your digital mind left off.</h1><p className="mt-5 max-w-lg text-base leading-7 text-white/45">Customers enter their workspace. App administrators enter the analysis platform. The same secure sign-in establishes the correct experience from your server-provided role.</p><div className="mt-9 flex items-center gap-3 text-sm text-white/55"><ShieldCheck className="size-5 text-emerald-300" />Short-lived access with rotating session refresh</div></div>
      <p className="text-xs text-white/25">This app login is separate from Django&apos;s /admin/ cookie login.</p>
    </section>
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-10"><ThemeToggle className="absolute right-5 top-5 border border-white/10 bg-white/5 text-white hover:bg-white/10" /><div className="w-full max-w-md"><div className="mb-8 lg:hidden"><span className="inline-flex items-center gap-2 text-lg font-semibold"><Brain className="size-6 text-violet-400" />Sapiens</span></div><div className="rounded-3xl border border-white/[.09] bg-white/[.035] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"><span className="grid size-11 place-items-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/25"><LockKeyhole className="size-5 text-violet-200" /></span><h1 className="mt-5 text-2xl font-semibold">{isRegister ? 'Create your account' : 'Welcome back'}</h1><p className="mt-2 text-sm text-white/40">{isRegister ? 'Customer accounts are ready to use immediately.' : 'Sign in as a customer or app administrator.'}</p>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        {notice && !error && <p role="status" className="rounded-xl border border-violet-400/20 bg-violet-400/[.07] p-3 text-xs leading-5 text-violet-100/80">{notice}</p>}
        <label className="block"><span className="mb-1.5 block text-xs text-white/55">Username</span><input autoFocus autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} disabled={busy} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15" /></label>
        {isRegister && <label className="block"><span className="mb-1.5 block text-xs text-white/55">Email <span className="text-white/25">(optional)</span></span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm outline-none transition focus:border-violet-400/60" /></label>}
        <label className="block"><span className="mb-1.5 block text-xs text-white/55">Password</span><span className="relative block"><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 pr-11 text-sm outline-none transition focus:border-violet-400/60" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white/60" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
        {isRegister && <label className="block"><span className="mb-1.5 block text-xs text-white/55">Confirm password</span><input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 text-sm outline-none transition focus:border-violet-400/60" /></label>}
        {error && <div role="alert" className="flex gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[.07] p-3 text-xs leading-5 text-red-100/80"><AlertCircle className="mt-0.5 size-4 shrink-0 text-red-300" />{error}</div>}
        <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{busy && <Loader2 className="size-4 animate-spin" />}{busy ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create customer account' : 'Sign in')}</button>
      </form><p className="mt-6 text-center text-sm text-white/40">{isRegister ? 'Already have an account?' : 'New to Sapiens?'} <Link to={isRegister ? '/login' : '/register'} className="font-medium text-violet-300 hover:text-violet-200">{isRegister ? 'Sign in' : 'Create a customer account'}</Link></p></div></div></main>
  </div>;
}
