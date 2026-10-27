import { WorkingMemoryAnalysis } from '../components/analyse/WorkingMemoryAnalysis';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Clock3 } from 'lucide-react';
import { useSapiensStore } from '../core/state/sapiensStore';
import { AnalyseGoals } from '../components/analyse/AnalyseGoals';
import { DebugPanel } from '../components/workspace/DebugPanel';
import { MemoryTimeline } from '../components/workspace/MemoryTimeline';
import { LlmUsageDialog } from '../components/workspace/LlmUsageDialog';
import { EngramPage } from './EngramPage';
import { EngineBusPage } from './EngineBusPage';
import { useOrchestratorStatus } from '../hooks/useOrchestratorStatus';
import { AwarenessDiagnostics as AwarenessAnalysis } from '../components/analyse/AwarenessDiagnostics';
import { FeedbackInspection } from '../components/analyse/FeedbackInspection';
import { ToolLearningInspection } from '../components/analyse/ToolLearningInspection';
import { EngineJobsInspection } from '../components/analyse/EngineJobsInspection';
import { QuestioningInspection } from '../components/analyse/QuestioningInspection';
import { CuriosityInspection } from '../components/analyse/CuriosityInspection';

import { AnalyseShell, ANALYSE_NAV } from '../components/analyse/AnalyseShell';
import type { AnalyseSection } from '../components/analyse/AnalyseShell';
import { AnalyseOverview } from '../components/analyse/AnalyseOverview';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
export function AnalysePage() {
  const [scopeParams] = useSearchParams();
  const navigate = useNavigate();
  const { section: rawSection } = useParams();
  const currentSapiens = useSapiensStore(s => s.currentSapiens);
  const setTimeline = useSapiensStore(s => s.setShowMemoryTimeline);
  const showTimeline = useSapiensStore(s => s.showMemoryTimeline);
  const [usageOpen, setUsageOpen] = useState(false);
  useOrchestratorStatus();
  const section = (ANALYSE_NAV.some(n => n.id === rawSection) ? rawSection : 'overview') as AnalyseSection;
  useEffect(() => { if (!currentSapiens) navigate('/admin'); }, [currentSapiens, navigate]);
  useEffect(() => { if (section === 'usage') setUsageOpen(true); }, [section]);
  if (!currentSapiens) return null;
  const hrefFor = (id: AnalyseSection, params?: Record<string, string>) => {
    if (id === 'simulation') {
      const returnTo = (section === 'overview' ? '/admin/analyse' : '/admin/analyse/' + section) + (scopeParams.size ? '?' + scopeParams : '');
      return '/admin/simulations?sapienId=' + encodeURIComponent(currentSapiens.id) + '&sapienName=' + encodeURIComponent(currentSapiens.name) + '&returnTo=' + encodeURIComponent(returnTo);
    }
    const query = params ? '?' + new URLSearchParams(params) : '';
    return (id === 'overview' ? '/admin/analyse' : '/admin/analyse/' + id) + query;
  };
  const go = (id: AnalyseSection, params?: Record<string, string>) => {
    if (id === 'usage') { setUsageOpen(true); return; }
    navigate(hrefFor(id, params));
  };
  return <AnalyseShell section={section} name={currentSapiens.name} sapienId={currentSapiens.id} go={go}>
    {section === 'overview' && <AnalyseOverview go={go} hrefFor={hrefFor} />}
    {section === 'awareness' && <AwarenessAnalysis sapienId={currentSapiens.id} />}
    {section === 'working-memory' && <WorkingMemoryAnalysis key={currentSapiens.id} sapienId={Number(currentSapiens.id)} openEngram={() => go('engram')} />}
    {section === 'goals' && <AnalyseGoals key={currentSapiens.id} sapienId={Number(currentSapiens.id)} />}
    {section === 'engram' && <EngramPage embedded />}
    {section === 'engine-bus' && <EngineBusPage embedded />}
    {section === 'engine-jobs' && <EngineJobsInspection sapienId={currentSapiens.id} />}
    {section === 'questioning' && <QuestioningInspection sapienId={currentSapiens.id} />}
    {section === 'curiosity' && <CuriosityInspection sapienId={currentSapiens.id} />}
    {section === 'tool-learning' && <ToolLearningInspection key={currentSapiens.id} sapienId={currentSapiens.id} />}
    {section === 'feedback' && <FeedbackInspection key={currentSapiens.id} sapienId={currentSapiens.id} />}
    {section === 'timeline' && <div className={panel + ' analyse-timeline-entry'}><Clock3 className="h-5 w-5 text-white/65" /><div><h2>Cognitive timeline</h2><p>Inspect conversation and memory events chronologically.</p></div><button onClick={() => setTimeline(true)} className="analyse-button">Open detailed timeline</button></div>}
    {section === 'debug' && <div className={panel + ' analyse-debug-page'}><DebugPanel onClose={() => go('overview')} /></div>}
    {showTimeline && <MemoryTimeline />}
    <LlmUsageDialog compactDetails open={usageOpen} onOpenChange={open => { setUsageOpen(open); if (!open && section === 'usage') go('overview'); }} sapienId={currentSapiens.id} sapienName={currentSapiens.name} />
  </AnalyseShell>;
}
