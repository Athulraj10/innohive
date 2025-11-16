import api from './api'

export interface Transaction {
  _id: string
  type: 'DEBIT' | 'CREDIT'
  amount: number
  balanceBefore?: number
  balanceAfter?: number
  competitionId?: string
  description?: string
  createdAt: string
}

export interface TransactionListResponse {
  data: Transaction[]
  meta: { page: number; limit: number; total: number }
}

export async function getMyTransactions(params?: { page?: number; limit?: number }): Promise<TransactionListResponse> {
  const response = await api.get<TransactionListResponse>('/auth/me/transactions', { params })
  return response.data
}

