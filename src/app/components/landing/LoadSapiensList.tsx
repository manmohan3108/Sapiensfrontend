import { useEffect, useState } from 'react';
import { ArrowRight, FolderOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Sapiens } from '../../types/sapiensTypes';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiens } from '../../hooks/useSapiens';
import { formatDateTime } from '../../utils/formatters';

export function LoadSapiensList() {
  const [sapiensList, setSapiensList] = useState<Sapiens[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { loadSapiens } = useSapiens();

  const fetchList = async () => {
      setIsLoading(true);
      try {
        const list = await sapiensService.listSapiens();
        setSapiensList(list);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch Sapiens list:', error);
        setError('Unable to connect to backend server. Please ensure the server is running.');
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => { fetchList(); }, []);

  const handleLoad = async (sapiens: Sapiens) => {
    try {
      setLoadingId(sapiens.id);
      await loadSapiens(sapiens);
    } catch (error) {
      console.error('Failed to load Sapiens:', error);
    } finally { setLoadingId(null); }
  };

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-2xl rounded-3xl border-border/70">
        <CardContent className="py-14" aria-live="polite" aria-busy="true">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="font-medium">Looking for your saved memories…</p>
            <p className="mt-1 text-sm">This should only take a moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-2xl rounded-3xl border-border/70">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Service Unavailable</AlertTitle>
            <AlertDescription>
              We couldn’t reach your saved memories. Check your connection or try again.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={fetchList} className="mt-4 w-full"><RefreshCw className="mr-2 size-4" />Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (sapiensList.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl rounded-3xl border-dashed border-border/80 bg-muted/20">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mb-4 opacity-30" />
            <p className="mb-1 text-lg font-medium text-foreground">No saved memories yet</p>
            <p className="text-sm">Create your first Sapiens above, and it will appear here next time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl rounded-3xl border-border/70 shadow-lg shadow-slate-950/5">
      <CardHeader>
        <CardTitle>Your saved Sapiens</CardTitle>
        <CardDescription>
          Choose a memory to continue in its workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sapiensList.map((sapiens) => (
            <div
              key={sapiens.id}
              className="flex flex-col gap-4 rounded-2xl border border-border p-4 transition-all hover:border-violet-300 hover:bg-violet-50/40 sm:flex-row sm:items-center sm:justify-between dark:hover:border-violet-800 dark:hover:bg-violet-950/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">
                    {sapiens.name}
                  </h3>
                  {sapiens.role && (
                    <Badge variant="secondary" className="text-xs">
                      {sapiens.role}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Created {formatDateTime(sapiens.createdAt)}
                </p>
              </div>
              
              <Button
                onClick={() => handleLoad(sapiens)}
                className="w-full bg-violet-600 text-white hover:bg-violet-700 sm:ml-4 sm:w-auto"
                disabled={loadingId !== null}
              >
                {loadingId === sapiens.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {loadingId === sapiens.id ? 'Opening…' : <>Open <ArrowRight className="ml-2 size-4" /></>}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
