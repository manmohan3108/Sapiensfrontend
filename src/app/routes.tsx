import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { LandingPage } = await import('./pages/LandingPage');
      return { Component: LandingPage };
    },
  },
  {
    path: '/workspace',
    lazy: async () => {
      const { WorkspacePage } = await import('./pages/WorkspacePage');
      return { Component: WorkspacePage };
    },
  },
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2">404 - Page Not Found</h1>
          <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
          <a href="/" className="text-primary hover:underline mt-4 inline-block">
            Return to Home
          </a>
        </div>
      </div>
    ),
  },
]);
