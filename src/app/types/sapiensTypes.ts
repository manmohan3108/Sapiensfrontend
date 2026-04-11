export interface Sapiens {
  id: string;
  name: string;
  role?: string;
  createdAt: string;
  lastModified: string;
}

export interface SapiensState {
  sapiens: Sapiens | null;
  activityLogs: ActivityLog[];
  outputs: Output[];
  status: 'idle' | 'loading' | 'processing' | 'error';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Output {
  id: string;
  timestamp: string;
  content: string;
  type: 'response' | 'result' | 'error';
}

export interface CreateSapiensRequest {
  name: string;
  role?: string;
}

export interface CreateSapiensResponse {
  sapiensId: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface LoadSapiensRequest {
  sapiensId: string;
}

export interface SaveSapiensRequest {
  sapiensId: string;
}

export interface LearnFolderRequest {
  sapiensId: string;
  files: File[];
}

export interface TextInputRequest {
  sapiensId: string;
  text: string;
}

export interface SapiensStateResponse {
  sapiens: Sapiens;
  activityLogs: ActivityLog[];
  outputs: Output[];
}