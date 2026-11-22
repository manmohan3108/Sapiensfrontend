import { FormEvent, useState } from 'react';
import { useRateLimitCountdown } from '../core/api/rateLimits';
import { Link, useLocation, useNavigate } from 'react-router';
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { authErrorMessage, useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLandingMotion } from '../components/customer/useLandingMotion';
import { ScienceDetail } from '../components/customer/ScienceDetail';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import '../../styles/customer.css';
import '../../styles/auth.css';
import { authDestination, authLink, readAuthIntent } from '../core/auth/navigation';
import type { AccountProfile, RegistrationResult } from '../types/authTypes';

const profileFields = [
  { key: 'first_name', label: 'First name', autoComplete: 'given-name' },
  { key: 'last_name', label: 'Last name', autoComplete: 'family-name' },
  { key: 'preferred_name', label: 'What should your Sapiens call you?', autoComplete: 'nickname' },
  { key: 'occupation', label: 'Role or occupation', autoComplete: 'organization-title' },
  { key: 'organisation', label: 'Organisation', autoComplete: 'organization' },
] as const;

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const retrySeconds = useRateLimitCountdown(mode);
  const motionRef = useLandingMotion();
  const { login, register, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const intent = readAuthIntent(location.search, location.state);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [profile, setProfile] = useState<Partial<AccountProfile>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (busy || retrySeconds > 0) return;
    if (!username.trim()) { setError('Enter your username.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    if (isRegister && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address, or leave it blank.'); return; }
    if (isRegister && password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    if (isRegister && password !== confirm) { setError('The passwords do not match.'); return; }
    if (isRegister && profile.timezone?.trim()) {
      try { new Intl.DateTimeFormat(undefined, { timeZone: profile.timezone.trim() }); }
      catch { setError('Enter a valid timezone, such as Asia/Kolkata, or leave it blank.'); return; }
    }
    setBusy(true);
    try {
      const user = isRegister
        ? await register({ username: username.trim(), password, ...(email.trim() ? { email: email.trim() } : {}),
          profile: Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value)) })
        : await login({ username: username.trim(), password });
      if (isRegister && (user as RegistrationResult).profileSaveError) {
        navigate('/account/profile', { replace: true, state: { profileDraft: profile, profileOwner: user.user_id,
          profileSaveError: (user as RegistrationResult).profileSaveError } });
        return;
      }
      navigate(authDestination(user, intent), { replace: true });
    } catch (caught) { setError(authErrorMessage(caught)); }
    finally { setBusy(false); }
  };

  return <div ref={motionRef} className="customer-surface customer-auth auth-science">
    <header className="customer-container customer-nav"><Link to="/" className="customer-brand" aria-label="Sapiens home"><SapiensBrandMark/>Sapiens</Link><ThemeToggle className="customer-theme" /></header>
    <main className="customer-container auth-layout">
      <section className="auth-introduction" aria-label="About Sapiens">
        <div className="auth-identity-art" data-motion-scene aria-hidden="true">
          <ScienceDetail variant="auth" />
          <img src="/concepts/sapiens-core-orange.png" width="440" height="440" alt="" />
        </div>
        <div className="auth-story-copy">
          <p className="customer-eyebrow">AN AI INDIVIDUAL</p>
          <h2>{isRegister ? 'An individual, shaped by experience.' : 'An individual to return to.'}</h2>
          <p className="auth-story-description">{isRegister ? 'We’re building AI that notices, asks, understands and acts. Create your Sapiens and begin exploring.' : 'Bring a new question, an idea or something that matters to you. Continue with the same Sapiens.'}</p>
        </div>
      </section>
      <div className="auth-form-shell"><span className="auth-lock" aria-hidden="true"><LockKeyhole size={22} /></span><h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1><p className="customer-form-description">{isRegister ? 'Start with an account. You can create your Sapiens next.' : 'Sign in to continue.'}</p>
        <form onSubmit={submit} noValidate>
          {notice && !error && <p role="status" className="customer-notice">{notice}</p>}
          <div className="customer-field"><label htmlFor="auth-username">Username</label><input id="auth-username" autoFocus autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} disabled={busy} aria-required="true" /></div>
          {isRegister && <div className="customer-field"><label htmlFor="auth-email">Email <span className="font-normal">(optional)</span></label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></div>}
          <div className="customer-field"><label htmlFor="auth-password">Password</label><div className="relative"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} aria-required="true" aria-describedby={isRegister ? 'password-help' : undefined} style={{ paddingRight: 52 }} /><button type="button" onClick={() => setShowPassword(value => !value)} className="customer-icon-button absolute right-1 top-0.5" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{isRegister && <small id="password-help">Use at least 8 characters.</small>}</div>
          {isRegister && <div className="customer-field"><label htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy} aria-required="true" /></div>}
          {isRegister && <details className="auth-optional-profile">
            <summary>Help your Sapiens know you <span>(optional)</span></summary>
            <p id="auth-profile-help">Share a little about yourself so your Sapiens can use it when relevant. Skip any field. You can update these details later in My profile.</p>
            <fieldset disabled={busy} aria-describedby="auth-profile-help">
              <legend className="sr-only">Optional account-holder details</legend>
              {profileFields.map(field => <div className="customer-field" key={field.key}>
                <label htmlFor={`auth-${field.key}`}>{field.label}</label>
                <input id={`auth-${field.key}`} name={field.key} autoComplete={field.autoComplete} maxLength={150}
                  value={profile[field.key] ?? ''} onChange={event => setProfile(current => ({ ...current, [field.key]: event.target.value }))} />
              </div>)}
              <div className="customer-field"><label htmlFor="auth-timezone">Timezone</label>
                <input id="auth-timezone" name="timezone" autoComplete="off" placeholder="e.g. Asia/Kolkata" maxLength={64}
                  value={profile.timezone ?? ''} onChange={event => setProfile(current => ({ ...current, timezone: event.target.value }))} />
                <button type="button" className="auth-use-timezone" onClick={() => setProfile(current => ({ ...current, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }))}>Use my device’s timezone</button>
              </div>
              <div className="customer-field"><label htmlFor="auth-about">About you</label>
                <textarea id="auth-about" name="about" rows={4} maxLength={1000} autoComplete="off" aria-describedby="auth-about-help"
                  value={profile.about ?? ''} onChange={event => setProfile(current => ({ ...current, about: event.target.value }))} />
                <small id="auth-about-help">Useful background, interests or preferences. Up to 1,000 characters. Don’t include passwords or secrets.</small>
              </div>
            </fieldset>
          </details>}
          {error && <p role="alert" className="customer-notice flex items-start gap-2"><AlertCircle size={18} className="shrink-0 mt-1" />{error}</p>}
          {retrySeconds > 0 && <p id="auth-rate-limit" role="timer" aria-live="off" className="customer-notice tabular-nums">Try again in {retrySeconds} seconds.</p>}
          <button disabled={busy || retrySeconds > 0} aria-describedby={retrySeconds > 0 ? 'auth-rate-limit' : undefined} className="customer-primary w-full">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Sapiens?'} <Link to={authLink(isRegister ? '/login' : '/register', intent)}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        <Link to="/" className="auth-back">Back to the main page</Link>
      </div>
    </main>
  </div>;
}
