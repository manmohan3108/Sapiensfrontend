import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { ANALYSE_GROUPS } from './AnalyseShell';
import type { AnalyseSection } from './AnalyseShell';
import '../../../styles/analyse-overview-notebook.css';

const descriptions: Record<Exclude<AnalyseSection, 'overview'>, string> = {
  awareness: 'Follow inputs, decisions, actions and saved understanding.',
  'working-memory': 'See which memories are available for retrieval and how strongly they are activated.',
  engram: 'Explore stored memories, their connections and retrieval.',
  goals: 'Inspect goals, plans, progress and unresolved work.',
  questioning: 'Review questions and their recorded investigations.',
  curiosity: 'Explore the information gaps and inquiries Sapiens identifies.',
  feedback: 'Review possible lessons and the evidence behind them.',
  'tool-learning': 'Read what Sapiens learned from each service and tool.',
  'engine-bus': 'Trace signals passed between engines and their delivery.',
  'engine-jobs': 'Inspect scheduled work, execution status and failures.',
  timeline: 'Browse conversation and memory events in time order.',
  simulation: 'Create and review simulation runs in a separate workspace.',
  debug: 'Inspect technical diagnostics and request details.',
  usage: 'Review model usage and configured limits.',
};

export function AnalyseOverview({ go, hrefFor }: { go: (section: AnalyseSection) => void; hrefFor: (section: AnalyseSection) => string }) {
  return <div className="analyse-overview">
    <p className="analyse-index-purpose">Explore this Sapien’s saved understanding, learning and activity.</p>
    <div className="analyse-index-groups">{ANALYSE_GROUPS.map((group, index) => <section className="analyse-index-group" key={group.label} aria-labelledby={'analyse-group-' + index}>
      <h2 id={'analyse-group-' + index}>{group.label}</h2>
      <ul>{group.items.map(item => {
        const content = <><item.icon className="analyse-index-icon" size={18} aria-hidden="true" /><span className="analyse-index-copy"><strong>{item.label}{item.id === 'simulation' && <ArrowUpRight size={14} aria-hidden="true" />}</strong><span>{descriptions[item.id]}</span></span></>;
        return <li key={item.id}>{item.id === 'usage'
          ? <button type="button" className="analyse-index-entry" aria-haspopup="dialog" onClick={() => go(item.id)}>{content}</button>
          : <Link className="analyse-index-entry" to={hrefFor(item.id)}>{content}</Link>}</li>;
      })}</ul>
    </section>)}</div>
  </div>;
}
