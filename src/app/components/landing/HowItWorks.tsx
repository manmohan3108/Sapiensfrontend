import { ArrowRight, FileInput, Database, Cpu, Network } from 'lucide-react';
import { Card } from '../ui/card';

export function HowItWorks() {
  const steps = [
    {
      icon: FileInput,
      title: 'Input',
      description: 'Feed information through files or text'
    },
    {
      icon: Database,
      title: 'Memory',
      description: 'Data is stored in structured memory systems'
    },
    {
      icon: Cpu,
      title: 'Cognitive Engines',
      description: 'Multiple reasoning processes analyze information'
    },
    {
      icon: Network,
      title: 'Knowledge Evolution',
      description: 'Understanding grows and adapts over time'
    }
  ];

  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-slate-900 mb-4">How It Works</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          A simple pipeline that transforms information into structured knowledge
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex items-center gap-4">
              <Card className="p-6 border-slate-200 bg-white hover:shadow-md transition-shadow w-64">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              </Card>
              
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-slate-400 hidden md:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
