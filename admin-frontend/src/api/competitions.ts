import api from './api';
import { Competition, CompetitionListResponse } from '../types/api';

export interface CompetitionFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export const getCompetitions = async (
  filters: CompetitionFilters = {}
): Promise<CompetitionListResponse> => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.sort) params.append('sort', filters.sort);

  const response = await api.get<CompetitionListResponse>(`/competitions?${params.toString()}`);
  return response.data;
};

export const getCompetitionById = async (id: string): Promise<Competition> => {
  const response = await api.get<Competition>(`/competitions/${id}`);
  return response.data;
};

