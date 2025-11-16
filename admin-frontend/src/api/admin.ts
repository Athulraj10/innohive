import api from "./api"
import { Competition, ParticipantsResponse } from "../types/api"

export interface CreateCompetitionData {
   name: string
   description?: string
   entryFee: number
   prizePool: number
   maxParticipants?: number
   startsAt?: string
   endsAt?: string
}

export interface UpdateCompetitionData {
   name?: string
   description?: string
   entryFee?: number
   prizePool?: number
   maxParticipants?: number
   startsAt?: string
   endsAt?: string
}

export const createCompetition = async (
   data: CreateCompetitionData
): Promise<Competition> => {
   const response = await api.post<Competition>("/admin/competitions", data)
   return response.data
}

export const updateCompetition = async (
   id: string,
   data: UpdateCompetitionData
): Promise<Competition> => {
   const response = await api.put<Competition>(`/admin/competitions/${id}`, data)
   return response.data
}

export const deleteCompetition = async (id: string): Promise<void> => {
   await api.delete(`/admin/competitions/${id}`)
}

export const getParticipants = async (
   competitionId: string
): Promise<ParticipantsResponse> => {
   const response = await api.get<ParticipantsResponse>(
      `/admin/competitions/${competitionId}/participants`
   )
   return response.data
}

export const getAllUsers = async (params?: {
   page?: number
   limit?: number
   search?: string
   role?: "USER" | "ADMIN"
}): Promise<{ users: any[]; meta: { page: number; limit: number; total: number } }> => {
   const response = await api.get<{ data: { users: any[] }; meta: { page: number; limit: number; total: number } }>(
      "/admin/users",
      { params }
   )
   return { users: response.data.data.users, meta: response.data.meta }
}

export interface UserDetails {
   _id: string
   name: string
   email: string
   role: string
   createdAt: string
   participations: Array<{
      _id: string
      competitionId: string
      competitionName: string
      joinedAt: string
      entryFee: number
      prizePool: number
   }>
   totalParticipations: number
}

export const getUserDetails = async (userId: string): Promise<UserDetails> => {
   const response = await api.get<UserDetails>(`/admin/users/${userId}`)
   return response.data
}

export interface TimeSeriesPoint {
   day: string
   value: number
}

export interface AdminTimeSeriesMetrics {
   users: TimeSeriesPoint[]
   competitions: TimeSeriesPoint[]
   participations: TimeSeriesPoint[]
   revenue: TimeSeriesPoint[]
}

export const getAdminTimeSeries = async (params?: {
   from?: number
   to?: number
   granularity?: 'day' | 'month'
}): Promise<AdminTimeSeriesMetrics> => {
   const response = await api.get<AdminTimeSeriesMetrics>("/admin/metrics/timeseries", {
      params,
   })
   return response.data
}