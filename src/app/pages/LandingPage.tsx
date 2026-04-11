import { useRef } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { WhatIsSapiens } from '../components/landing/WhatIsSapiens';
import { CoreCapabilities } from '../components/landing/CoreCapabilities';
import { UseCases } from '../components/landing/UseCases';
import { HowItWorks } from '../components/landing/HowItWorks';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { Separator } from '../components/ui/separator';
import { ThemeToggle } from '../components/ThemeToggle';

export function LandingPage() {
  const createSectionRef = useRef<HTMLDivElement>(null);
  const loadSectionRef = useRef<HTMLDivElement>(null);

  const scrollToCreate = () => {
    createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToLoad = () => {
    loadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <HeroSection onCreateClick={scrollToCreate} onLoadClick={scrollToLoad} />
        
        <WhatIsSapiens />
        
        <CoreCapabilities />
        
        <UseCases />
        
        <HowItWorks />
        
        <Separator className="my-16" />
        
        <div ref={createSectionRef} className="mb-16 scroll-mt-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Create Your Sapiens Instance</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start experimenting with cognitive architecture by creating a new Sapiens instance
            </p>
          </div>
          <CreateSapiensForm />
        </div>
        
        <div className="flex items-center gap-4 mb-12">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground uppercase tracking-wide">
            Or
          </span>
          <Separator className="flex-1" />
        </div>
        
        <div ref={loadSectionRef} className="scroll-mt-8">
          <LoadSapiensList />
        </div>
      </div>
    </div>
  );
}