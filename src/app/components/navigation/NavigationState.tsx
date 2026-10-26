import { createContext, useCallback, useContext, useState, type ReactNode, type SetStateAction } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type NavigationMemory = { views: Map<string, unknown>; destinations: Map<string, string>; scroll: Map<string, number> };
const NavigationContext = createContext<NavigationMemory | null>(null);
function SessionNavigationState({ children }: { children: ReactNode }) {
  const [memory] = useState<NavigationMemory>(() => ({ views: new Map(), destinations: new Map(), scroll: new Map() }));
  return <NavigationContext.Provider value={memory}>{children}</NavigationContext.Provider>;
}
export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Only UI state in memory. Signing out or changing accounts drops it all.
  return <SessionNavigationState key={user ? `${user.user_id}:${user.role}` : 'guest'}>{children}</SessionNavigationState>;
}
export function useNavigationMemory() {
  const memory = useContext(NavigationContext);
  if (!memory) throw new Error('NavigationStateProvider is missing');
  return memory;
}
export function useRememberedState<T>(key: string, initial: T): [T, (next: SetStateAction<T>) => void] {
  const memory = useNavigationMemory();
  const [, render] = useState(0);
  // Initial arrays/objects must keep their identity across renders, just like useState.
  if (!memory.views.has(key)) memory.views.set(key, initial);
  const value = memory.views.get(key) as T;
  const setValue = useCallback((next: SetStateAction<T>) => {
    const previous = memory.views.get(key) as T;
    memory.views.set(key, typeof next === 'function' ? (next as (value: T) => T)(previous) : next);
    render(count => count + 1);
  }, [memory, key]);
  return [value, setValue];
}
