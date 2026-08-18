import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Sapiens</CardTitle>
        <CardDescription>
          Initialize a new cognitive instance
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
              placeholder="Enter Sapiens name"
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
              placeholder="e.g., Research Assistant, Analyst"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isCreating}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || isCreating}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Sapiens'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
