import { Network, Database, Lightbulb } from 'lucide-react';
import { Card } from '../ui/card';

export function WhatIsSapiens() {
  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-slate-900 mb-4">What is Sapiens?</h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Sapiens is a cognitive system architecture designed to simulate aspects of human-like thinking. 
          Instead of being a single black-box AI model, Sapiens organizes memory, reasoning engines, 
          and structured knowledge to process information over time.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-center mb-3 text-slate-900">Structured Memory</h3>
          <p className="text-slate-600 text-center">
            Information is organized in a structured memory system that evolves with each interaction.
          </p>
        </Card>

        <Card className="p-6 border-slate-200 hover:border-purple-300 transition-colors">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Lightbulb className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-center mb-3 text-slate-900">Reasoning Engines</h3>
          <p className="text-slate-600 text-center">
            Multiple cognitive processes work together to analyze, synthesize, and generate insights.
          </p>
        </Card>

        <Card className="p-6 border-slate-200 hover:border-green-300 transition-colors">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Network className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-center mb-3 text-slate-900">Knowledge Evolution</h3>
          <p className="text-slate-600 text-center">
            The system's understanding grows and adapts as it processes new information and experiences.
          </p>
        </Card>
      </div>
    </div>
  );
}
