import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ANALYSE_GROUPS } from './AnalyseShell';
import type { AnalyseSection } from './AnalyseShell';
import { ScienceDetail } from '../customer/ScienceDetail';
import '../../../styles/analyse-overview-notebook.css';

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

/** Notebook sketches only: these do not represent live measurements or traces. */
function NotebookFigure({ index }: { index: number }) {
  return <svg className="analyse-notebook-figure" viewBox="0 0 144 82" fill="none" aria-hidden="true" focusable="false">
    {index === 0 ? <><path className="notebook-guide" d="M10 66H136M20 12V73M48 62V70M76 62V70M104 62V70"/><path d="M20 65C45 65 43 22 70 22S100 65 132 65"/><path className="notebook-guide" d="M70 22V66"/><circle cx="70" cy="22" r="3"/><text x="116" y="24">∫</text></>
      : index === 1 ? <><path className="notebook-guide" d="M72 7V76M12 42H132"/><ellipse cx="72" cy="42" rx="53" ry="21"/><ellipse cx="72" cy="42" rx="53" ry="21" transform="rotate(-36 72 42)"/><circle cx="72" cy="42" r="4"/><circle cx="121" cy="34" r="3"/><text x="12" y="18">Δ</text></>
      : index === 2 ? <><path className="notebook-guide" d="M10 43H136M20 10V73M50 39V47M80 39V47M110 39V47"/><path d="M20 43C30 12 40 12 50 43S70 74 80 43S100 12 110 43S126 63 134 43"/><text x="115" y="16">λ</text></>
      : <><circle cx="72" cy="42" r="31"/><path d="M45 58L72 11L99 58ZM45 58H99"/><path className="notebook-guide" d="M25 42H119M72 2V80M33 72H111"/><path d="M63 27Q72 33 80 27"/><circle cx="72" cy="11" r="3"/><text x="104" y="25">θ</text></>}
  </svg>;
}

export function AnalyseOverview({ go }: { go: (section: AnalyseSection) => void }) {
  return <div className="analyse-overview">
    <div className="analyse-directory-intro"><div><h2>Choose what to explore.</h2><p>Open a tool to inspect its records, behaviour and evidence.</p></div><div className="analyse-notebook-intro-art"><ScienceDetail variant="surround" /></div></div>
    <div className="analyse-tool-groups">{ANALYSE_GROUPS.map((group, index) => <section className="analyse-tool-group" key={group.label} aria-labelledby={'analyse-group-' + index}>
      <div className="analyse-notebook-margin"><span className="analyse-notebook-index" aria-hidden="true">0{index + 1}</span><h3 id={'analyse-group-' + index}>{group.label}</h3><NotebookFigure index={index} /></div>
      <div className="analyse-tool-grid">{group.items.map(item => <button type="button" className="analyse-tool-tile" key={item.id} onClick={() => go(item.id)}>
        <span className="analyse-tool-heading"><item.icon size={18} aria-hidden="true" /><strong>{item.label}</strong>{item.id === 'simulation' ? <ArrowUpRight size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</span>
        <span className="analyse-tool-description">{descriptions[item.id]}</span>
      </button>)}</div>
    </section>)}</div>
  </div>;
}
