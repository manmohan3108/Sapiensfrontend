import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AlertCircle, Brain, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { authErrorMessage, useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { IdentityArt } from '../components/customer/IdentityArt';
import '../../styles/customer.css';
import { authDestination, authLink, readAuthIntent } from '../core/auth/navigation';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const intent = readAuthIntent(location.search, location.state);
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
      navigate(authDestination(user.role, intent), { replace: true });
    } catch (caught) { setError(authErrorMessage(caught)); }
    finally { setBusy(false); }
  };

  return <div className="customer-surface customer-auth">
    <header className="customer-container customer-nav"><Link to="/" className="customer-brand"><span><Brain size={23} /></span>Sapiens<span className="brand-period">.</span></Link><ThemeToggle className="customer-theme" /></header>
    <main className="customer-container auth-layout">
      <section className="auth-introduction" aria-label="About your Sapiens"><IdentityArt stage={1} /><p className="customer-eyebrow">ONE INDIVIDUAL. MANY CONVERSATIONS.</p><h2>A familiar name.<br />A new conversation.</h2><p>Return to your Sapiens and the history you share.</p></section>
      <div className="auth-form-shell"><span className="auth-lock"><LockKeyhole size={22} /></span><h1>{isRegister ? 'Create your account' : 'Sign in to Sapiens'}</h1><p className="customer-form-description">{isRegister ? 'Create your account. You can create your Sapiens next.' : 'Return to your Sapiens, or create one after you sign in.'}</p>
        <form onSubmit={submit} noValidate>
          {notice && !error && <p role="status" className="customer-notice">{notice}</p>}
          <div className="customer-field"><label htmlFor="auth-username">Username</label><input id="auth-username" autoFocus autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} disabled={busy} aria-required="true" /></div>
          {isRegister && <div className="customer-field"><label htmlFor="auth-email">Email <span className="font-normal">(optional)</span></label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></div>}
          <div className="customer-field"><label htmlFor="auth-password">Password</label><div className="relative"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} aria-required="true" aria-describedby={isRegister ? 'password-help' : undefined} style={{ paddingRight: 52 }} /><button type="button" onClick={() => setShowPassword(value => !value)} className="customer-icon-button absolute right-1 top-0.5" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{isRegister && <small id="password-help">Use at least 8 characters.</small>}</div>
          {isRegister && <div className="customer-field"><label htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy} aria-required="true" /></div>}
          {error && <p role="alert" className="customer-notice flex items-start gap-2"><AlertCircle size={18} className="shrink-0 mt-1" />{error}</p>}
          <button disabled={busy} className="customer-primary w-full">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Sapiens?'} <Link to={authLink(isRegister ? '/login' : '/register', intent)}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        <Link to="/" className="auth-back">Back to Sapiens</Link>
      </div>
    </main>
  </div>;
}
