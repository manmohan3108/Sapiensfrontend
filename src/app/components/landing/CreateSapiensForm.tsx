import { useState } from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useSapiens } from '../../hooks/useSapiens';

export function CreateSapiensForm() {
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
        role: role.trim() || undefined,
      });
      
      // Reset form
      setName('');
      setRole('');
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
        <CardTitle className="text-2xl">Create your Sapiens</CardTitle>
        <CardDescription>
          A name is all you need. You can shape its role as you go.
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Atlas, Studio Memory"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isCreating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role (optional)</Label>
            <Input
              id="role"
              type="text"
              placeholder="e.g. Research companion, Story editor"
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
            {isCreating ? 'Creating your memory…' : 'Create and enter workspace'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
