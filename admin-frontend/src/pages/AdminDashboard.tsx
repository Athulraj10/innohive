import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { AdminNavbar } from "../components/AdminNavbar"
import { Competition } from "../types/api"
import { getCompetitions } from "../api/competitions"
import { toast } from "react-toastify"
import { getAdminTimeSeries, AdminTimeSeriesMetrics } from "../api/admin"
import { MuiLineChart } from "../components/MuiLineChart"

export const AdminDashboard = () => {
   const [stats, setStats] = useState({
      totalCompetitions: 0,
      totalParticipants: 0,
      totalPrizePool: 0,
      activeCompetitions: 0,
   })
   const [isLoading, setIsLoading] = useState(true)
   const [recentCompetitions, setRecentCompetitions] = useState<Competition[]>([])
   const [metrics, setMetrics] = useState<AdminTimeSeriesMetrics | null>(null)

   useEffect(() => {
      const fetchStats = async () => {
         setIsLoading(true)
         try {
            const response = await getCompetitions({ page: 1, limit: 1000 })
            const competitions = response.data

            const totalCompetitions = response.meta.total
            const totalParticipants = competitions.reduce(
               (sum, comp) => sum + (comp.participantCount || 0),
               0
            )
            const totalPrizePool = competitions.reduce(
               (sum, comp) => sum + (comp.prizePool || 0),
               0
            )
            const activeCompetitions = competitions.filter((comp) => {
               const now = new Date()
               const startsAt = comp.startsAt ? new Date(comp.startsAt) : null
               const endsAt = comp.endsAt ? new Date(comp.endsAt) : null
               return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now)
            }).length

            setStats({
               totalCompetitions,
               totalParticipants,
               totalPrizePool,
               activeCompetitions,
            })

            const recent = competitions
               .slice()
               .sort(
                  (a, b) =>
                     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
               )
               .slice(0, 5)
            setRecentCompetitions(recent)
            
            const now = Date.now()
            const from = now - 30 * 24 * 3600 * 1000
            const m = await getAdminTimeSeries({ from, to: now })
            setMetrics(m)

            const from12 = now - 365 * 24 * 3600 * 1000
            const monthly = await getAdminTimeSeries({ from: from12, to: now, granularity: 'month' })
            setMetrics((prev) => prev ? { ...prev, competitions: monthly.competitions } : monthly)
         } catch (error: any) {
            toast.error("Failed to load dashboard statistics")
            console.error(error)
         } finally {
            setIsLoading(false)
         }
      }

      fetchStats()
   }, [])

   const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: "USD",
         minimumFractionDigits: 0,
         maximumFractionDigits: 0,
      }).format(amount)
   }

   if (isLoading) {
      return (
         <div className='min-h-screen bg-dark-bg'>
            <AdminNavbar />
            <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
               <div className='text-center py-16'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
                  <p className='text-gray-400'>Loading dashboard...</p>
               </div>
            </main>
         </div>
      )
   }

   return (
      <div className='min-h-screen bg-dark-bg'>
         <AdminNavbar />
         <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='mb-8 animate-fade-in'>
               <h1 className='text-4xl font-bold text-gray-100 mb-2'>
                  Admin <span className='text-gradient'>Dashboard</span>
               </h1>
               <p className='text-gray-400 text-lg'>
                  Manage competitions, users, and view platform statistics
               </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
               <div className='card animate-fade-in'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>Total Competitions</p>
                        <p className='text-3xl font-bold text-gray-100'>
                           {stats.totalCompetitions}
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-primary-400'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>

               <div className='card animate-fade-in' style={{ animationDelay: "0.1s" }}>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>Total Participants</p>
                        <p className='text-3xl font-bold text-gray-100'>
                           {stats.totalParticipants}
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-success-DEFAULT/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-success-light'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>

               <div className='card animate-fade-in' style={{ animationDelay: "0.2s" }}>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>Total Prize Pool</p>
                        <p className='text-3xl font-bold text-success-light'>
                           {formatCurrency(stats.totalPrizePool)}
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-warning-DEFAULT/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-warning-light'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>

               <div className='card animate-fade-in' style={{ animationDelay: "0.3s" }}>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>Active Competitions</p>
                        <p className='text-3xl font-bold text-primary-400'>
                           {stats.activeCompetitions}
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-primary-400'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M13 10V3L4 14h7v7l9-11h-7z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='card animate-fade-in'>
                <h3 className='text-lg font-bold text-gray-100 mb-3'>User Signups (30d)</h3>
                {metrics ? (
                  <MuiLineChart data={metrics.users} color="#34d399" />
                ) : (
                  <div className='h-40 flex items-center justify-center text-gray-500 text-sm'>No data</div>
                )}
              </div>
              <div className='card animate-fade-in' style={{ animationDelay: "0.05s" }}>
                <h3 className='text-lg font-bold text-gray-100 mb-3'>Participations (30d)</h3>
                {metrics ? (
                  <MuiLineChart data={metrics.participations} color="#60a5fa" />
                ) : (
                  <div className='h-40 flex items-center justify-center text-gray-500 text-sm'>No data</div>
                )}
              </div>
              <div className='card animate-fade-in' style={{ animationDelay: "0.1s" }}>
                <h3 className='text-lg font-bold text-gray-100 mb-3'>Revenue (entry fees) (30d)</h3>
                {metrics ? (
                  <MuiLineChart data={metrics.revenue} color="#f59e0b" />
                ) : (
                  <div className='h-40 flex items-center justify-center text-gray-500 text-sm'>No data</div>
                )}
              </div>
              <div className='card animate-fade-in' style={{ animationDelay: "0.15s" }}>
                <h3 className='text-lg font-bold text-gray-100 mb-3'>Competitions per Month (12m)</h3>
                {metrics ? (
                  <MuiLineChart data={metrics.competitions} color="#a78bfa" />
                ) : (
                  <div className='h-40 flex items-center justify-center text-gray-500 text-sm'>No data</div>
                )}
              </div>
            </div>

           <div className='grid grid-cols-1 md:grid-cols-3 gap-6 m-8'>
               <div className='card animate-fade-in'>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>
                           Upcoming Competitions
                        </p>
                        <p className='text-2xl font-bold text-warning-light'>
                           {
                              recentCompetitions.filter(
                                 (c) => c.startsAt && new Date(c.startsAt) > new Date()
                              ).length
                           }
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-warning-DEFAULT/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-warning-light'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>

               <div className='card animate-fade-in' style={{ animationDelay: "0.1s" }}>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>Ended Competitions</p>
                        <p className='text-2xl font-bold text-gray-400'>
                           {
                              recentCompetitions.filter(
                                 (c) => c.endsAt && new Date(c.endsAt) < new Date()
                              ).length
                           }
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-gray-600/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-gray-400'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>

               <div className='card animate-fade-in' style={{ animationDelay: "0.2s" }}>
                  <div className='flex items-center justify-between'>
                     <div>
                        <p className='text-sm text-gray-500 mb-1'>Avg. Participants</p>
                        <p className='text-2xl font-bold text-primary-400'>
                           {stats.totalCompetitions > 0
                              ? Math.round(
                                   stats.totalParticipants / stats.totalCompetitions
                                )
                              : 0}
                        </p>
                     </div>
                     <div className='w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center'>
                        <svg
                           className='w-6 h-6 text-primary-400'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                           />
                        </svg>
                     </div>
                  </div>
               </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
               <div className='card animate-fade-in'>
                  <h2 className='text-xl font-bold text-gray-100 mb-4'>Quick Actions</h2>
                  <div className='space-y-3'>
                     <Link
                        to='/admin/competitions/new'
                        className='block w-full btn-primary text-center'
                     >
                        + Create New Competition
                     </Link>
                     <Link
                        to='/admin/competitions'
                        className='block w-full btn-secondary text-center'
                     >
                        Manage Competitions
                     </Link>
                     <Link
                        to='/admin/users'
                        className='block w-full btn-secondary text-center'
                     >
                        View Users
                     </Link>
                  </div>
               </div>

              <div className='card animate-fade-in' style={{ animationDelay: "0.1s" }}>
                  <h2 className='text-xl font-bold text-gray-100 mb-4'>
                     Recent Competitions
                  </h2>
                  {recentCompetitions.length === 0 ? (
                     <div className='text-center py-8'>
                        <p className='text-gray-500 text-sm mb-4'>No competitions yet</p>
                        <Link
                           to='/admin/competitions/new'
                           className='btn-primary inline-block'
                        >
                           Create First Competition
                        </Link>
                     </div>
                  ) : (
                     <div className='space-y-3 max-h-64 overflow-y-auto scrollbar-hide'>
                        {recentCompetitions.map((comp) => {
                           const isUpcoming =
                              comp.startsAt && new Date(comp.startsAt) > new Date()
                           const isEnded =
                              comp.endsAt && new Date(comp.endsAt) < new Date()
                           const isFull =
                              comp.maxParticipants &&
                              comp.participantCount >= comp.maxParticipants

                           return (
                              <Link
                                 key={comp._id}
                                 to={`/admin/competitions/${comp._id}/edit`}
                                 className='block p-3 bg-dark-surface rounded-lg border border-dark-border hover:border-primary-500 transition-colors'
                              >
                                 <div className='flex items-start justify-between'>
                                    <div className='flex-1'>
                                       <p className='font-medium text-gray-200 mb-1'>
                                          {comp.name}
                                       </p>
                                       <p className='text-sm text-gray-500'>
                                          {comp.participantCount} participants •{" "}
                                          {formatCurrency(comp.prizePool)} prize pool
                                       </p>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                       {isUpcoming && (
                                          <span className='px-2 py-0.5 text-xs bg-warning-DEFAULT/20 text-warning-light rounded'>
                                             Upcoming
                                          </span>
                                       )}
                                       {isEnded && (
                                          <span className='px-2 py-0.5 text-xs bg-gray-600/20 text-gray-400 rounded'>
                                             Ended
                                          </span>
                                       )}
                                       {isFull && !isEnded && (
                                          <span className='px-2 py-0.5 text-xs bg-danger-DEFAULT/20 text-danger-light rounded'>
                                             Full
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </Link>
                           )
                        })}
                     </div>
                  )}
               </div>
            </div>
         </main>
      </div>
   )
}
