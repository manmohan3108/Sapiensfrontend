export type ConnectionStatus = 'connected' | 'needs_attention' | 'pending' | 'denied' | string;
export type ConnectionRequestStatus = 'pending' | 'denied' | 'connected' | string;

export interface ProviderField {
  name: string;
  label: string;
  type: 'url' | 'email' | 'password' | 'boolean' | 'text' | string;
  required: boolean;
  default?: string | number | boolean;
  choices?: string[];
  choice_details?: Record<string, { label: string; description: string }>;
  help_text?: string;
  placeholder?: string;
  advanced?: boolean;
  source?: 'workspace' | 'account_identifier' | 'metadata' | 'credential';
}

export interface ConnectionProvider {
  id: string;
  label: string;
  description?: string;
  setup?: ConnectionGuidance | null;
  disconnect_notice?: string;
  fields: ProviderField[];
  capabilities?: { tools: boolean; notifications: boolean; subscriptions: boolean; messaging: boolean; key_generation?: boolean; browser_authorization?: boolean };
}

export interface ConnectionGuidance {
  title: string;
  description: string;
  steps: string[];
  next_action: string;
  action_label: string;
  public_values?: { label: string; help_text: string; value: string }[];
  disconnect_notice?: string;
}

export interface SapiensConnection {
  id: number;
  sapien_id: number;
  provider: string;
  account_label: string;
  account_identifier: string;
  workspace: string;
  status: ConnectionStatus;
  is_default: boolean;
  metadata: Record<string, unknown>;
  guidance?: ConnectionGuidance;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessNeed {
  target: string;
  account: string;
  operations: string[];
  connection_id: number | null;
}

export interface SapiensConnectionRequest {
  id: number;
  sapien_id: number;
  provider: string;
  reason: string;
  status: ConnectionRequestStatus;
  guidance?: ConnectionGuidance;
  metadata: {
    access?: AccessNeed;
    work_refs?: string[];
    additional_reasons?: string[];
    owner_response?: { status: 'connected' | 'denied'; hint?: string; reason?: string; recorded_at: string };
    connection_id?: number;
  };
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ConnectionsResponse {
  sapien_id: number;
  connections: SapiensConnection[];
  requests: SapiensConnectionRequest[];
  providers: ConnectionProvider[];
}

export type ConnectionFormValue = string | boolean;
export type CreateConnectionPayload = Record<string, ConnectionFormValue | number> & { provider: string };
export type UpdateConnectionPayload = Record<string, ConnectionFormValue | number>;
