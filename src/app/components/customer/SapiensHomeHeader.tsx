import type { MouseEventHandler } from 'react';
import { Beaker, LogOut, Plus, ScanSearch } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ThemeToggle';
import { SapiensBrandMark } from './SapiensBrandMark';

/** Shared navigation for the two identity directories, not the workspace. */
export function SapiensHomeHeader({ onCreate }: { onCreate: MouseEventHandler<HTMLButtonElement> }) {
  const { user, logout } = useAuth();
  const admin = user?.role === 'admin';
  return <header className="home-header">
    <nav className="home-container home-nav" aria-label="Primary navigation">
      <Link className="home-brand" to="/" aria-label="Sapiens home"><SapiensBrandMark />Sapiens<span>.</span></Link>
      <div className="home-nav-actions">
        {admin && <><Link to="/admin/analyse"><ScanSearch size={16} />Analyse</Link><Link to="/admin/simulations"><Beaker size={16} />Simulation Lab</Link></>}
        <ThemeToggle />
        <button className="home-create-button" onClick={onCreate}><Plus size={17} /><span>Create a Sapiens</span></button>
        <button className="home-signout" onClick={() => void logout()} aria-label="Sign out"><LogOut size={18} /></button>
      </div>
    </nav>
  </header>;
}
