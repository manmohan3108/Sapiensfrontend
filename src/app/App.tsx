import { PresentationProvider } from './contexts/PresentationContext';
import { RouterProvider } from 'react-router';
import { RateLimitNotice } from './components/RateLimitNotice';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BackendUnavailableScreen } from './components/BackendUnavailableScreen';
import { NavigationStateProvider } from './components/navigation/NavigationState';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PresentationProvider><NavigationStateProvider><RouterProvider router={router} /></NavigationStateProvider></PresentationProvider>
        <Toaster richColors position="bottom-right" closeButton />
        <BackendUnavailableScreen />
        <RateLimitNotice />
      </AuthProvider>
    </ThemeProvider>
  );
}
