import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ANALYSE_GROUPS } from './AnalyseShell';
import type { AnalyseSection } from './AnalyseShell';

const descriptions: Record<Exclude<AnalyseSection, 'overview'>, string> = {
  awareness: 'Follow inputs, decisions, actions and saved understanding.',
  'working-memory': 'Inspect the context available for retrieval and its activation.',
  engram: 'Explore stored memories, their connections and retrieval.',
  goals: 'Inspect goals, plans, progress and unresolved work.',
  questioning: 'Review questions and their recorded investigations.',
  curiosity: 'Explore the information gaps and inquiries Sapiens identifies.',
  feedback: 'Review possible lessons and the evidence behind them.',
  'tool-learning': 'Inspect lessons from tool use and where guidance was used.',
  'engine-bus': 'Trace signals passed between engines and their delivery.',
  'engine-jobs': 'Inspect scheduled work, execution status and failures.',
  timeline: 'Browse conversation and memory events in time order.',
  simulation: 'Create and review simulation runs in a separate workspace.',
  debug: 'Inspect technical diagnostics and request details.',
  usage: 'Review model usage and configured limits.',
};

export function AnalyseOverview({ go }: { go: (section: AnalyseSection) => void }) {
  return <div className="analyse-overview">
    <div className="analyse-directory-intro"><h2>Choose what to explore.</h2><p>Open a tool to inspect its records, behaviour and evidence.</p></div>
    <div className="analyse-tool-groups">{ANALYSE_GROUPS.map((group, index) => <section className="analyse-tool-group" key={group.label} aria-labelledby={'analyse-group-' + index}>
      <h3 id={'analyse-group-' + index}>{group.label}</h3>
      <div className="analyse-tool-grid">{group.items.map(item => <button type="button" className="analyse-tool-tile" key={item.id} onClick={() => go(item.id)}>
        <span className="analyse-tool-heading"><item.icon size={18} aria-hidden="true" /><strong>{item.label}</strong>{item.id === 'simulation' ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</span>
        <span className="analyse-tool-description">{descriptions[item.id]}</span>
      </button>)}</div>
    </section>)}</div>
  </div>;
}
