import { Brain, FileText, Eye, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';

export function CoreCapabilities() {
  const capabilities = [
    {
      icon: Brain,
      title: 'Memory-Driven Cognition',
      description: 'Persistent memory structures that retain and organize knowledge across sessions, enabling contextual understanding.',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Structured Knowledge Evolution',
      description: 'Dynamic knowledge graphs that grow and refine themselves as the system processes new information.',
      color: 'purple'
    },
    {
      icon: FileText,
      title: 'Interactive Input',
      description: 'Feed the system through files and text inputs, allowing it to ingest and process diverse information sources.',
      color: 'green'
    },
    {
      icon: Eye,
      title: 'Observable Reasoning',
      description: 'Track internal reasoning processes, memory updates, and cognitive state changes in real-time.',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500/20',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20'
  };

  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="mb-4">Core Capabilities</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Sapiens provides a comprehensive set of features for experimenting with cognitive architectures
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {capabilities.map((capability, index) => {
          const Icon = capability.icon;
          const colorClass = colorClasses[capability.color as keyof typeof colorClasses];
          return (
            <Card key={index} className="p-8 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl transition-colors ${colorClass}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">{capability.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}