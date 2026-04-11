import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = 'An unexpected error occurred';
  let errorDetails: string | undefined;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || errorMessage;
    errorDetails = error.data?.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack;
  }

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Application Error</CardTitle>
              <CardDescription>
                Something went wrong while running the application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="font-mono text-sm text-destructive">{errorMessage}</p>
            {errorDetails && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  View technical details
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {errorDetails}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGoHome} variant="default" className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
            <Button onClick={handleReload} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            If this problem persists, please contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}