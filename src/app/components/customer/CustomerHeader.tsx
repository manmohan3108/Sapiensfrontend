import { Brain, LogOut } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ThemeToggle';

export function CustomerHeader({ publicPage = false }: { publicPage?: boolean }) {
  const { user, logout } = useAuth();
  return <header className="customer-header"><nav aria-label="Primary navigation" className="customer-container customer-nav">
    <Link to="/" className="customer-brand" aria-label="Sapiens home"><span><Brain size={23} aria-hidden="true" /></span>Sapiens<span className="brand-period">.</span></Link>
    <div className="customer-nav-actions">
      {publicPage && <a className="landing-nav-link" href="#how-it-works">How it works</a>}
      <ThemeToggle className="customer-theme" />
      {user ? <><Link className="customer-nav-link" to={user.role === 'admin' ? '/admin' : '/home'}>{user.role === 'admin' ? 'Admin home' : 'Your Sapiens'}</Link>{!publicPage && <button className="customer-icon-button" onClick={() => void logout()} aria-label="Sign out"><LogOut size={19} /></button>}</> : <Link className="customer-nav-link" to="/login">Sign in</Link>}
    </div>
  </nav></header>;
}
