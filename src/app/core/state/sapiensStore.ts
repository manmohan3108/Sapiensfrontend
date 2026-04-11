import { create } from 'zustand';
import { Sapiens, ActivityLog, Output } from '../../types/sapiensTypes';

interface SapiensStore {
  // State
  currentSapiens: Sapiens | null;
  activityLogs: ActivityLog[];
  outputs: Output[];
  status: 'idle' | 'loading' | 'processing' | 'error';
  
  // Actions
  setCurrentSapiens: (sapiens: Sapiens | null) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setOutputs: (outputs: Output[]) => void;
  addOutput: (output: Omit<Output, 'id' | 'timestamp'>) => void;
  setStatus: (status: 'idle' | 'loading' | 'processing' | 'error') => void;
  clearLogs: () => void;
  clearOutputs: () => void;
  reset: () => void;
}

export const useSapiensStore = create<SapiensStore>((set) => ({
  // Initial state
  currentSapiens: null,
  activityLogs: [],
  outputs: [],
  status: 'idle',

  // Actions
  setCurrentSapiens: (sapiens) => {
    set({ currentSapiens: sapiens });
  },

  setActivityLogs: (logs) => {
    set({ activityLogs: logs });
  },

  setOutputs: (outputs) => {
    set({ outputs: outputs });
  },

  addOutput: (output) => {
    const newOutput: Output = {
      id: `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...output,
    };
    set((state) => ({
      outputs: [...state.outputs, newOutput],
    }));
  },

  setStatus: (status) => {
    set({ status });
  },

  clearLogs: () => {
    set({ activityLogs: [] });
  },

  clearOutputs: () => {
    set({ outputs: [] });
  },

  reset: () => {
    set({
      currentSapiens: null,
      activityLogs: [],
      outputs: [],
      status: 'idle',
    });
  },
}));