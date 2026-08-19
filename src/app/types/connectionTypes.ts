export type ConnectionStatus = 'connected' | 'needs_attention' | 'pending' | 'denied' | string;
export type ConnectionRequestStatus = 'pending' | 'denied' | 'connected' | string;

export interface ProviderField {
  name: string;
  label: string;
  type: 'url' | 'email' | 'password' | 'boolean' | 'text' | string;
  required: boolean;
}

export interface ConnectionProvider {
  id: string;
  label: string;
  fields: ProviderField[];
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
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SapiensConnectionRequest {
  id: number;
  sapien_id: number;
  provider: string;
  reason: string;
  status: ConnectionRequestStatus;
  metadata: Record<string, unknown>;
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
export type CreateConnectionPayload = Record<string, ConnectionFormValue> & { provider: string };

