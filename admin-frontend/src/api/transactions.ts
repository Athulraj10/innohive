import api from './api'

export interface AdminTransaction {
  _id: string
  userId: { _id: string; name: string; email: string }
  type: 'DEBIT' | 'CREDIT'
  amount: number
  balanceBefore?: number
  balanceAfter?: number
  competitionId?: string
  description?: string
  createdAt: string
}

export async function getAdminTransactions(params?: { page?: number; limit?: number; userId?: string; type?: 'DEBIT'|'CREDIT' }): Promise<{ transactions: AdminTransaction[]; meta: { page: number; limit: number; total: number } }> {
 const res = await api.get<{ data: { transactions: AdminTransaction[] }; meta: { page: number; limit: number; total: number } }>('/admin/transactions', { params })
  return { transactions: res.data.data.transactions, meta: res.data.meta }
}

