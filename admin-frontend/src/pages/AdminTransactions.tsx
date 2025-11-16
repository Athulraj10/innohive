import { useEffect, useState } from 'react'
import { AdminNavbar } from '../components/AdminNavbar'
import { getAdminTransactions, AdminTransaction } from '../api/transactions'
import { getAdminTimeSeries } from '../api/admin'
import { MuiLineChart } from '../components/MuiLineChart'
import { toast } from 'react-toastify'

export const AdminTransactions = () => {
  const [rows, setRows] = useState<AdminTransaction[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revenueSeries, setRevenueSeries] = useState<{ day: string; value: number }[] | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getAdminTransactions({ page, limit: 20 })
        setRows(res.transactions || [])
        if (res.meta && typeof res.meta.total === 'number' && typeof res.meta.limit === 'number') {
          setTotalPages(Math.ceil(res.meta.total / res.meta.limit))
        } else {
          setTotalPages(1)
        }
        const now = Date.now()
        const from = now - 30 * 24 * 3600 * 1000
        const m = await getAdminTimeSeries({ from, to: now })
        setRevenueSeries(m.revenue)
      } catch (e: any) {
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [page])

  return (
    <div className='min-h-screen bg-dark-bg'>
      <AdminNavbar />
      <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-3xl font-bold text-gray-100 mb-6'>Transactions</h1>
        <div className='card overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-dark-border bg-dark-surface'>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>Date</th>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>User</th>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>Type</th>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>Amount</th>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>Avail. Before</th>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>Avail. After</th>
                <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className='py-6 px-4 text-center text-gray-400'>Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className='py-6 px-4 text-center text-gray-400'>No transactions</td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t._id} className='border-b border-dark-border hover:bg-dark-hover'>
                    <td className='py-3 px-4 text-gray-300'>{new Date(t.createdAt).toLocaleString()}</td>
                    <td className='py-3 px-4 text-gray-200'>{t.userId?.name} <span className='text-gray-500 text-xs'>({t.userId?.email})</span></td>
                    <td className='py-3 px-4'>
                      <span className={`px-2 py-1 text-xs rounded ${t.type === 'DEBIT' ? 'bg-danger-DEFAULT/20 text-danger-light' : 'bg-success-DEFAULT/20 text-success-light'}`}>{t.type}</span>
                    </td>
                    <td className='py-3 px-4 text-gray-200'>${t.amount.toFixed(2)}</td>
                    <td className='py-3 px-4 text-gray-400'>${(t.balanceBefore ?? 0).toFixed(2)}</td>
                    <td className='py-3 px-4 text-gray-400'>${(t.balanceAfter ?? 0).toFixed(2)}</td>
                    <td className='py-3 px-4 text-gray-400'>{t.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className='mt-6 flex justify-center items-center space-x-4'>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className='btn-secondary disabled:opacity-30'>Previous</button>
            <span className='text-gray-400'>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className='btn-secondary disabled:opacity-30'>Next</button>
          </div>
        )}
        <div className='card mt-6 overflow-hidden'>
          <h3 className='text-lg font-bold text-gray-100 mb-2'>Revenue (Entry Fees) (30d)</h3>
          {revenueSeries && revenueSeries.length > 0 ? (
            <MuiLineChart data={revenueSeries} color='#f59e0b' />
          ) : (
            <div className='h-24 flex items-center justify-center text-gray-500 text-sm'>
              No data
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

