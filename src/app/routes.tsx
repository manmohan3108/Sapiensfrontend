import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/workspace',
    Component: WorkspacePage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2">404 - Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          <a href="/" className="text-primary hover:underline mt-4 inline-block">
            Return to Home
          </a>
        </div>
      </div>
    ),
    errorElement: <ErrorBoundary />,
  },
]);