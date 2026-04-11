import { FlaskConical, BookOpen, Cpu, Search } from 'lucide-react';
import { Card } from '../ui/card';

export function UseCases() {
  const useCases = [
    {
      icon: FlaskConical,
      title: 'Research Experimentation',
      description: 'Test hypotheses about cognitive architectures, memory systems, and reasoning patterns.'
    },
    {
      icon: BookOpen,
      title: 'Knowledge Exploration',
      description: 'Build systems that can ingest, organize, and explore large bodies of information.'
    },
    {
      icon: Cpu,
      title: 'AI Cognition Prototyping',
      description: 'Develop and iterate on novel approaches to artificial intelligence and reasoning systems.'
    },
    {
      icon: Search,
      title: 'Studying Reasoning Systems',
      description: 'Observe and analyze how different cognitive processes interact and produce emergent behaviors.'
    }
  ];

  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-slate-900 mb-4">Example Use Cases</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore the possibilities of cognitive system experimentation
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {useCases.map((useCase, index) => {
          const Icon = useCase.icon;
          return (
            <Card 
              key={index} 
              className="p-6 border-slate-200 hover:border-blue-400 transition-all cursor-default"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-slate-900">{useCase.title}</h3>
                  <p className="text-slate-600">{useCase.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
