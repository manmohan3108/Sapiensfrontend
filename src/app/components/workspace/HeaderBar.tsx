import { Brain, Home, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ThemeToggle } from '../ThemeToggle';

export function HeaderBar() {
  const { currentSapiens } = useSapiensStore();
  const { saveSapiens, returnToHome } = useSapiens();
  const status = useSapiensStore((state) => state.status);

  if (!currentSapiens) {
    return null;
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg">
                    {currentSapiens.name}
                  </h1>
                  {currentSapiens.role && (
                    <Badge variant="secondary">{currentSapiens.role}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  ID: {currentSapiens.id}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Button
              variant="outline"
              onClick={() => saveSapiens()}
              disabled={status === 'loading'}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Button
              variant="ghost"
              onClick={returnToHome}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}