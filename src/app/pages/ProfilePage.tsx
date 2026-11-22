import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth, authErrorMessage } from '../contexts/AuthContext';
import type { AccountProfile } from '../types/authTypes';
import '../../styles/account-profile.css';

const emptyProfile: AccountProfile = {
  first_name: '', last_name: '', preferred_name: '', occupation: '', organisation: '', timezone: '', about: '',
};
const fields: { key: Exclude<keyof AccountProfile, 'about'>; label: string; autoComplete?: string; maxLength: number; placeholder?: string }[] = [
  { key: 'first_name', label: 'First name', autoComplete: 'given-name', maxLength: 150 },
  { key: 'last_name', label: 'Last name', autoComplete: 'family-name', maxLength: 150 },
  { key: 'preferred_name', label: 'Preferred name', autoComplete: 'nickname', maxLength: 150 },
  { key: 'occupation', label: 'Role or occupation', autoComplete: 'organization-title', maxLength: 150 },
  { key: 'organisation', label: 'Organisation', autoComplete: 'organization', maxLength: 150 },
  { key: 'timezone', label: 'Timezone', maxLength: 64, placeholder: 'Asia/Kolkata' },
];

export function ProfilePage() {
  const { user, saveProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const recovery = location.state?.profileOwner === user?.user_id ? location.state : null;
  const [profile, setProfile] = useState<AccountProfile>(() => ({ ...emptyProfile, ...user?.profile, ...recovery?.profileDraft }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const update = (key: keyof AccountProfile, value: string) => {
    setProfile(current => ({ ...current, [key]: value })); setSaved(false); setError('');
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false);
    try {
      const result = await saveProfile(profile);
      setProfile({ ...emptyProfile, ...result.profile }); setSaved(true);
      if (recovery) navigate(location.pathname, { replace: true, state: null });
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { setBusy(false); }
  };
  return <main className="account-profile product-surface science-product-theme">
    <div className="account-profile-content">
      <h1>My profile</h1>
      <p>Help your Sapiens know who you are. These optional details are shared with your Sapiens when they next think or respond.</p>
      <form onSubmit={submit} aria-busy={busy}>
        {recovery && !saved && <p role="alert">Your account was created, but we couldn’t confirm your optional details were saved. Your entries are below; check them and select Save profile. {recovery.profileSaveError}</p>}
        <fieldset disabled={busy}>
          <legend className="sr-only">Account-holder details</legend>
          <div className="account-profile-grid">
            {fields.map(field => <label key={field.key} htmlFor={`profile-${field.key}`}>
              <span>{field.label}</span>
              <input id={`profile-${field.key}`} name={field.key} value={profile[field.key]} maxLength={field.maxLength} autoComplete={field.autoComplete} placeholder={field.placeholder} onChange={event => update(field.key, event.target.value)} />
            </label>)}
          </div>
          <label htmlFor="profile-about"><span>About me</span><textarea id="profile-about" name="about" rows={4} maxLength={1000} value={profile.about} onChange={event => update('about', event.target.value)} aria-describedby="profile-about-help" /></label>
          <p id="profile-about-help" className="account-profile-note">Share useful background or preferences. Avoid passwords and other secrets. Up to 1,000 characters.</p>
          <label htmlFor="profile-email"><span>Email</span><input id="profile-email" type="email" value={user?.email || ''} readOnly /></label>
          <p className="account-profile-note">Saving does not start work or resume a paused Sapien.</p>
          <button type="submit">{busy ? 'Saving…' : 'Save profile'}</button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {saved && <p role="status">Profile saved.</p>}
      </form>
    </div>
  </main>;
}
