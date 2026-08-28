import { useState } from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useSapiens } from '../../hooks/useSapiens';

interface CreateSapiensFormProps {
  onNameChange?: (name: string) => void;
}

export function CreateSapiensForm({ onNameChange }: CreateSapiensFormProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createSapiens } = useSapiens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await createSapiens({
        name: name.trim(),
        ...(role.trim() ? { role: role.trim() } : {}),
      });
      
      // Reset form
      setName('');
      setRole('');
      onNameChange?.('');
    } catch (error) {
      console.error('Failed to create Sapiens:', error);
      setError('Unable to connect to the backend server. Please try again shortly.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="mx-auto max-w-xl rounded-3xl border-border/70 bg-card/90 shadow-xl shadow-violet-950/5 backdrop-blur">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">Begin its story</p>
        <CardTitle className="text-2xl">First, give it a name</CardTitle>
        <CardDescription>
          Start with one small choice. You can shape everything else after you meet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Its name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Atlas"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                onNameChange?.(e.target.value);
              }}
              required
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Its role <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="role"
              type="text"
              placeholder="e.g. Research assistant"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isCreating}
            />
          </div>
          
          <Button
            type="submit"
            className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700"
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
            {isCreating ? 'Creating…' : name.trim() ? `Begin with ${name.trim()}` : 'Begin creating'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Give it a name, optionally define its role, and begin.</p>
        </form>
      </CardContent>
    </Card>
  );
}
