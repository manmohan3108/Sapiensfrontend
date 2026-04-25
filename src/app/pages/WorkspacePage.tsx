import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { HeaderBar } from '../components/workspace/HeaderBar';
import { CombinedInputPanel } from '../components/workspace/CombinedInputPanel';
import { ActivityLog } from '../components/workspace/ActivityLog';
import { OutputConsole } from '../components/workspace/OutputConsole';
import { ChatWindow } from '../components/workspace/ChatWindow';
import { useSapiensStore } from '../core/state/sapiensStore';
import { useSapiens } from '../hooks/useSapiens';

export function WorkspacePage() {
  const navigate = useNavigate();
  const currentSapiens = useSapiensStore((state) => state.currentSapiens);
  const { refreshSapiensState } = useSapiens();

  useEffect(() => {
    if (!currentSapiens) navigate('/');
  }, [currentSapiens, navigate]);

  useEffect(() => {
    if (currentSapiens) refreshSapiensState();
  }, [currentSapiens, refreshSapiensState]);

  if (!currentSapiens) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#080d1a] dark:bg-[#080d1a]">
      {/* Ambient background orbs — absolute, pointer-events-none */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Violet orb — top left */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
        />
        {/* Indigo orb — bottom right */}
        <div
          className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }}
        />
        {/* Cyan orb — center bottom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #0ea5e9 0%, transparent 70%)' }}
        />
        {/* Emerald orb — top right */}
        <div
          className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)' }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-20">
        <HeaderBar />
      </div>

      {/* Three-panel workspace */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-2.5 p-2.5">

          {/* Left — Knowledge Upload */}
          <div className="col-span-3 h-full min-h-0">
            <CombinedInputPanel />
          </div>

          {/* Center — Chat */}
          <div className="col-span-5 h-full min-h-0">
            <ChatWindow />
          </div>

          {/* Right — Activity + Output stacked */}
          <div className="col-span-4 h-full min-h-0 flex flex-col gap-2.5">
            <div className="flex-[55] min-h-0">
              <ActivityLog />
            </div>
            <div className="flex-[45] min-h-0">
              <OutputConsole />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
