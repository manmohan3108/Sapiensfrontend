import type { MouseEventHandler } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { sapiensDirectoryPath } from '../../core/auth/navigation';

/** Navigation only: retain the selected Sapien and leave running simulations alone. */
export function YourSapiensLink({ className = '', iconOnly = false, onClick }: {
  className?: string;
  iconOnly?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { user } = useAuth();
  if (!user) return null;
  return <Link to={sapiensDirectoryPath(user.role)} onClick={onClick}
    className={`inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${className}`}
    aria-label={iconOnly ? 'Your Sapiens' : undefined} title={iconOnly ? 'Your Sapiens' : undefined}>
    <LayoutGrid size={16} aria-hidden="true" className="shrink-0" />
    {!iconOnly && <span>Your Sapiens</span>}
  </Link>;
}
