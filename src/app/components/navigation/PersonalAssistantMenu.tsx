import { useEffect, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { Sapiens } from '../../types/sapiensTypes';
import { SapienActivityActions } from '../customer/SapienActivityControl';
import { ThemeToggle } from '../ThemeToggle';

export function PersonalAssistantMenu({ sapien, open, onOpenChange, trigger }: {
  sapien: Sapiens; open: boolean; onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement>;
}) {
  const { logout } = useAuth();
  // This component stays mounted while the dialog is closed.
  const activity = useSapienActivity(sapien, true);
  const { refresh } = activity;

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="app-nav-scrim" />
      <Dialog.Content className="app-menu-dialog product-surface science-product-theme personal-chat-options"
        onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <Dialog.Title>Assistant menu</Dialog.Title>
        <Dialog.Description className="sr-only">Manage your assistant activity and account.</Dialog.Description>
        <Dialog.Close className="app-dialog-close" aria-label="Close assistant menu"><X size={20} aria-hidden="true" /></Dialog.Close>
        <div className="personal-chat-menu">
          <SapienActivityActions sapien={sapien} controller={activity} />
          <nav aria-label="Account"><Link to="/account/profile" onClick={() => onOpenChange(false)}>My profile</Link></nav>
          <div className="personal-chat-theme"><span>Appearance</span><ThemeToggle /></div>
          <button type="button" onClick={() => void logout()}><LogOut size={16} aria-hidden="true" />Sign out</button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
