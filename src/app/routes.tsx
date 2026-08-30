import { createBrowserRouter, Navigate } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { AnalysePage } from './pages/AnalysePage';
import { ErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
    ErrorBoundary,
  },
  {
    path: '/workspace',
    Component: WorkspacePage,
    ErrorBoundary,
  },
  {
    path: '/engram',
    Component: () => <Navigate to="/admin/analyse/engram" replace />,
    ErrorBoundary,
  },
  {
    path: '/connections',
    Component: ConnectionsPage,
    ErrorBoundary,
  },
  {
    path: '/engine-bus',
    Component: () => <Navigate to="/admin/analyse/engine-bus" replace />,
    ErrorBoundary,
  },
  {
    path: '/admin/analyse',
    Component: AnalysePage,
    ErrorBoundary,
  },
  {
    path: '/admin/analyse/:section',
    Component: AnalysePage,
    ErrorBoundary,
  },
  {
    path: '*',
    ErrorBoundary,
    Component: () => (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060a15' }}>
        <div className="text-center">
          <h1 className="mb-2 text-white/80">404 — Page Not Found</h1>
          <p className="text-white/40">The page you&apos;re looking for doesn&apos;t exist.</p>
          <a href="/" className="text-violet-400 hover:text-violet-300 hover:underline mt-4 inline-block transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    ),
  },
]);
