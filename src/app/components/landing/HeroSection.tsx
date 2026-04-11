import { Brain } from 'lucide-react';
import { Button } from '../ui/button';

interface HeroSectionProps {
  onCreateClick: () => void;
  onLoadClick: () => void;
}

export function HeroSection({ onCreateClick, onLoadClick }: HeroSectionProps) {
  return (
    <div className="text-center mb-24 pt-8">
      <div className="flex justify-center mb-8">
        <div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-accent rounded-3xl shadow-lg">
          <Brain className="w-20 h-20 text-primary" />
        </div>
      </div>
      
      <h1 className="mb-6 text-5xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Sapiens — Experimental Cognitive Architecture
      </h1>
      
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
        A platform for building and experimenting with artificial cognitive systems.
        Create Sapiens instances, feed them knowledge, and observe how they reason, 
        organize information, and evolve their internal understanding.
      </p>
      
      <div className="flex gap-4 justify-center">
        <Button 
          size="lg" 
          onClick={onCreateClick}
          className="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          Create Sapiens
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          onClick={onLoadClick}
          className="px-8 py-6 text-lg"
        >
          Load Existing Sapiens
        </Button>
      </div>
    </div>
  );
}