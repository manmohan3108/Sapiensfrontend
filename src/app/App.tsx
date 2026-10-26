import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationStateProvider } from './components/navigation/NavigationState';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationStateProvider><RouterProvider router={router} /></NavigationStateProvider>
        <Toaster richColors position="bottom-right" closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}
