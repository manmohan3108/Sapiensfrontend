import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, AlertCircle, RefreshCw, Search, SearchX } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { SapiensIdentityRow } from '../customer/SapiensIdentityRow';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Sapiens } from '../../types/sapiensTypes';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiens } from '../../hooks/useSapiens';
import { formatDateTime } from '../../utils/formatters';
import { SapiensPresence } from '../customer/SapiensPresence';

export function LoadSapiensList() {
  const [sapiensList, setSapiensList] = useState<Sapiens[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { loadSapiens } = useSapiens();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSapiens = sapiensList.filter((sapiens) =>
    [sapiens.name, sapiens.role, sapiens.id].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))
  );

  const fetchList = async () => {
      setIsLoading(true);
      try {
        const list = await sapiensService.listSapiens();
        setSapiensList(list);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch Sapiens list:', error);
        setSapiensList([]);
        setError((error as { message?: string }).message || 'Unable to reach the server. Try again.');
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
      setSapiensList([]);
      setError((error as { message?: string }).message || 'This Sapiens is unavailable. Refresh the list.');
    } finally { setLoadingId(null); }
  };

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-2xl rounded-3xl border-border/70">
        <CardContent className="py-14" aria-live="polite" aria-busy="true">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <SapiensPresence tone="orange" size={64} animated className="mb-3" />
            <p className="font-medium">Loading your Sapiens…</p>
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
            <AlertTitle>We couldn’t load your Sapiens</AlertTitle>
            <AlertDescription>
              {error}
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
            <SapiensPresence tone="orange" size={96} animated className="mb-4" />
            <p className="mb-1 text-lg font-medium text-foreground">No Sapiens yet</p>
            <p className="text-sm">Create your first Sapiens below.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="home-directory-content">
      <div>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Sapiens…"
            aria-label="Search Sapiens by name, focus or ID"
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-sp-accent focus:ring-2 focus:ring-sp-accent/20"
          />
        </div>
        <div className="home-identity-list">
          {filteredSapiens.map((sapiens) => (
            <SapiensIdentityRow key={sapiens.id} individual={sapiens} created={formatDateTime(sapiens.createdAt)}>
              <Button
                onClick={() => handleLoad(sapiens)}
                className="home-open-button"
                aria-label={loadingId === sapiens.id ? `Opening ${sapiens.name}` : `Open ${sapiens.name}`}
                disabled={loadingId !== null}
              >
                {loadingId === sapiens.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {loadingId === sapiens.id ? 'Opening…' : <>Open <ArrowRight className="ml-2 size-4" /></>}
              </Button>
            </SapiensIdentityRow>
          ))}
          {filteredSapiens.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">
              <SearchX className="mb-3 size-7 opacity-40" />
              <p className="font-medium text-foreground">No matching Sapiens</p>
              <p className="mt-1 text-sm">Try another name, focus or ID.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
