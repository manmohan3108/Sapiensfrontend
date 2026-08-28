export interface EngineBusSignal {
  id: string;
  name: string;
  sapien_id: number;
  producer: string;
  target: string | null;
  status: 'pending' | 'completed' | 'expired' | string;
  causation_id: string | null;
  correlation_id: string | null;
  occurred_at: string;
  published_at: string | null;
  expires_at: string | null;
  updated_at: string | null;
  payload_scrubbed_at: string | null;
}

export interface EngineBusDelivery {
  id: string;
  signal_id: string;
  subscription_id: string;
  subscriber: string;
  mode: 'notification' | 'sync_request' | 'async_request' | string;
  status: 'pending' | 'delivering' | 'delivered' | 'failed' | 'expired' | 'timed_out' | string;
  attempts: number;
  has_error: boolean;
  created_at: string | null;
  updated_at: string | null;
  claim_until: string | null;
}

export interface EngineBusSignalsResponse {
  sapien_id: number;
  signals: EngineBusSignal[];
  limit: number;
  next_before: string | null;
}

export interface EngineBusSignalDetailResponse {
  signal: EngineBusSignal;
  deliveries: EngineBusDelivery[];
}

export interface EngineBusCorrelationResponse extends EngineBusSignalsResponse {
  correlation_id: string;
}

export interface EngineBusSignalFilters {
  name?: string;
  producer?: string;
  target?: string;
  status?: string;
  correlation_id?: string;
  limit?: number;
  before?: string;
}
