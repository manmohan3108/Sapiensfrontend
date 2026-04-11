import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { HeaderBar } from '../components/workspace/HeaderBar';
import { CombinedInputPanel } from '../components/workspace/CombinedInputPanel';
import { ActivityLog } from '../components/workspace/ActivityLog';
import { OutputConsole } from '../components/workspace/OutputConsole';
import { useSapiensStore } from '../core/state/sapiensStore';
import { useSapiens } from '../hooks/useSapiens';

export function WorkspacePage() {
  const navigate = useNavigate();
  const currentSapiens = useSapiensStore((state) => state.currentSapiens);
  const { refreshSapiensState } = useSapiens();

  // Redirect to home if no Sapiens is loaded
  useEffect(() => {
    if (!currentSapiens) {
      navigate('/');
    }
  }, [currentSapiens, navigate]);

  // Fetch Sapiens state (activity logs and outputs) when workspace loads
  useEffect(() => {
    if (currentSapiens) {
      refreshSapiensState();
    }
  }, [currentSapiens, refreshSapiensState]);

  if (!currentSapiens) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <HeaderBar />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          {/* Left Panel - Combined Input Section */}
          <div className="col-span-3 h-full">
            <CombinedInputPanel />
          </div>
          
          {/* Middle Panel - Activity Log */}
          <div className="col-span-4 h-full">
            <ActivityLog />
          </div>
          
          {/* Right Panel - Output Console */}
          <div className="col-span-5 h-full">
            <OutputConsole />
          </div>
        </div>
      </div>
    </div>
  );
}