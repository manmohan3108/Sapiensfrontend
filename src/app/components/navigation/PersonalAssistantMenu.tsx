import { useEffect, type RefObject, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { Sapiens } from '../../types/sapiensTypes';
import { SapienActivityActions } from '../customer/SapienActivityControl';
import { ThemeToggle } from '../ThemeToggle';
import { RunEngineButton } from '../workspace/RunEngineButton';

interface MobileMenuProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement>; navigation: ReactNode; accountName: string; pickerOpen: boolean;
}

export function PersonalAssistantMenu({ sapien, ...props }: MobileMenuProps & { sapien?: Sapiens }) {
  return sapien ? <AssistantActivityMenu key={sapien.id} sapien={sapien} {...props} /> : <MobileNavigationMenu {...props} />;
}

function AssistantActivityMenu({ sapien, ...props }: MobileMenuProps & { sapien: Sapiens }) {
  const { open } = props;
  // This component stays mounted while the dialog is closed.
  const activity = useSapienActivity(sapien, true);
  const { refresh } = activity;

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  return <MobileNavigationMenu {...props}><SapienActivityActions sapien={sapien} controller={activity} /><RunEngineButton /></MobileNavigationMenu>;
}

function MobileNavigationMenu({ open, onOpenChange, trigger, navigation, accountName, pickerOpen, children }: MobileMenuProps & { children?: ReactNode }) {
  const { logout } = useAuth();
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="app-nav-scrim" />
      <Dialog.Content className="app-menu-dialog product-surface science-product-theme personal-chat-options"
        onCloseAutoFocus={event => { event.preventDefault(); if (!pickerOpen) trigger.current?.focus(); }}>
        <Dialog.Title>Menu</Dialog.Title>
        <Dialog.Description className="sr-only">Navigate your Sapiens and manage your account.</Dialog.Description>
        <Dialog.Close className="app-dialog-close" aria-label="Close menu"><X size={20} aria-hidden="true" /></Dialog.Close>
        <div className="personal-chat-menu">
          <nav aria-label="Main navigation">{navigation}</nav>
          {children}
          <p className="mobile-menu-account">{accountName}</p>
          <nav aria-label="Account"><Link to="/account/profile" onClick={() => onOpenChange(false)}>My profile</Link></nav>
          <div className="personal-chat-theme"><span>Appearance</span><ThemeToggle /></div>
          <button type="button" onClick={() => void logout()}><LogOut size={16} aria-hidden="true" />Sign out</button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
