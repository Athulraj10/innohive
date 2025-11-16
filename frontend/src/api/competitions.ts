import api from './api';
import { Competition, CompetitionListResponse, JoinResponse, Participant } from '../types/api';

export interface CompetitionFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  joined?: boolean;
}

export const getCompetitions = async (
  filters: CompetitionFilters = {}
): Promise<CompetitionListResponse> => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.joined !== undefined) params.append('joined', filters.joined.toString());

  const response = await api.get<CompetitionListResponse>(`/competitions?${params.toString()}`);
  return response.data;
};

export const getCompetitionById = async (id: string): Promise<Competition> => {
  const response = await api.get<Competition>(`/competitions/${id}`);
  return response.data;
};

export const joinCompetition = async (id: string): Promise<JoinResponse> => {
  const response = await api.post<JoinResponse>(`/competitions/${id}/join`);
  return response.data;
};

export interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataResponse {
  candles: ChartDataPoint[];
}

export interface ChartDataParams {
  from?: number; 
  to?: number; 
  res?: string; 
}

export const getChartData = async (
  competitionId: string,
  params?: ChartDataParams
): Promise<ChartDataResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.from) queryParams.append('from', params.from.toString());
  if (params?.to) queryParams.append('to', params.to.toString());
  if (params?.res) queryParams.append('res', params.res);

  const queryString = queryParams.toString();
  const url = `/competitions/${competitionId}/chart${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get<ChartDataResponse>(url);
  return response.data;
};

export interface ParticipantsResponse {
  data: Participant[];
  meta?: {
    total: number;
    page?: number;
    limit?: number;
  };
}

export const getCompetitionParticipants = async (
  competitionId: string,
  params?: { page?: number; limit?: number }
): Promise<ParticipantsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `/competitions/${competitionId}/participants${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get<any>(url);
  if (Array.isArray(response.data)) {
    return {
      data: response.data,
    };
  }
  return response.data as ParticipantsResponse;
};

