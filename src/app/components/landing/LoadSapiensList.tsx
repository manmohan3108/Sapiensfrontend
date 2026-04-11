import { useEffect, useState } from 'react';
import { FolderOpen, Loader2, AlertCircle } from 'lucide-react';
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
  const { loadSapiens } = useSapiens();

  useEffect(() => {
    const fetchList = async () => {
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

    fetchList();
  }, []);

  const handleLoad = async (sapiens: Sapiens) => {
    try {
      await loadSapiens(sapiens);
    } catch (error) {
      console.error('Failed to load Sapiens:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading saved Sapiens...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Service Unavailable</AlertTitle>
            <AlertDescription>
              The Sapiens backend service is currently unavailable. Please contact your system administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (sapiensList.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg mb-1">No saved Sapiens found</p>
            <p className="text-sm">Create a new Sapiens to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Load Existing Sapiens</CardTitle>
        <CardDescription>
          Select a previously created instance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sapiensList.map((sapiens) => (
            <div
              key={sapiens.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
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
                  Created: {formatDateTime(sapiens.createdAt)}
                </p>
              </div>
              
              <Button
                onClick={() => handleLoad(sapiens)}
                className="ml-4"
              >
                Load
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}