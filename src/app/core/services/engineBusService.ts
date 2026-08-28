import { apiClient } from '../api/apiClient';
import type {
  EngineBusCorrelationResponse,
  EngineBusSignalDetailResponse,
  EngineBusSignalFilters,
  EngineBusSignalsResponse,
} from '../../types/engineBusTypes';

const base = (sapienId: string | number) => `/sapien/${sapienId}/engine-bus`;

function query(filters: EngineBusSignalFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

class EngineBusService {
  async list(sapienId: string | number, filters: EngineBusSignalFilters = {}) {
    return (await apiClient.get<EngineBusSignalsResponse>(`${base(sapienId)}/signals${query(filters)}`)).data;
  }

  async detail(sapienId: string | number, signalId: string) {
    return (await apiClient.get<EngineBusSignalDetailResponse>(`${base(sapienId)}/signals/${encodeURIComponent(signalId)}`)).data;
  }

  async correlation(sapienId: string | number, correlationId: string, limit = 200, before?: string) {
    return (await apiClient.get<EngineBusCorrelationResponse>(`${base(sapienId)}/correlations/${encodeURIComponent(correlationId)}${query({ limit, before })}`)).data;
  }
}

export const engineBusService = new EngineBusService();
