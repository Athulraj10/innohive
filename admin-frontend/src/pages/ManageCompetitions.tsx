import { useState, useEffect } from "react"
import { Link, useParams, useNavigate, useLocation } from "react-router-dom"
import { AdminNavbar } from "../components/AdminNavbar"
import { CompetitionForm } from "../components/CompetitionForm"
import { getCompetitions, getCompetitionById } from "../api/competitions"
import { getAdminTimeSeries } from "../api/admin"
import { MuiLineChart } from "../components/MuiLineChart"
import { createCompetition, updateCompetition, deleteCompetition } from "../api/admin"
import { Competition, ApiError } from "../types/api"
import { toast } from "react-toastify"

export const ManageCompetitions = () => {
   const { id } = useParams<{ id?: string }>()
   const location = useLocation()
   const navigate = useNavigate()
   const [competitions, setCompetitions] = useState<Competition[]>([])
   const [isLoading, setIsLoading] = useState(true)
   const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
   const [deletingId, setDeletingId] = useState<string | null>(null)
   const [search, setSearch] = useState("")
   const [page, setPage] = useState(1)
   const [totalPages, setTotalPages] = useState(0)
   const [compSeries, setCompSeries] = useState<{ day: string; value: number }[] | null>(null)

   const isFormMode =
      location.pathname.includes("/new") || location.pathname.includes("/edit")
   const isCreateMode = location.pathname.includes("/new")
   const isEditMode = location.pathname.includes("/edit") && id

   useEffect(() => {
      if (isEditMode && id) {
         const fetchCompetition = async () => {
            try {
               const comp = await getCompetitionById(id)
               setEditingCompetition(comp)
            } catch (error: any) {
               toast.error("Failed to load competition")
               navigate("/admin/competitions")
            }
         }
         fetchCompetition()
      } else if (isCreateMode) {
         setEditingCompetition(null)
      }
   }, [isEditMode, isCreateMode, id, navigate])

   const fetchCompetitions = async () => {
      setIsLoading(true)
      try {
         const response = await getCompetitions({
            page,
            limit: 10,
            search: search || undefined,
         })
         setCompetitions(response.data)
         setTotalPages(Math.ceil(response.meta.total / response.meta.limit))
      } catch (error: any) {
         const apiError = error.response?.data as ApiError
         toast.error(apiError?.error || "Failed to load competitions")
      } finally {
         setIsLoading(false)
      }
   }

   useEffect(() => {
      if (!isFormMode) {
         fetchCompetitions()
         ;(async () => {
            try {
               const now = Date.now()
               const from = now - 30 * 24 * 3600 * 1000
               const m = await getAdminTimeSeries({ from, to: now })
               setCompSeries(m.competitions)
            } catch {}
         })()
      }
   }, [page, search, isFormMode])

   const handleCreate = () => {
      navigate("/admin/competitions/new")
   }

   const handleEdit = (competition: Competition) => {
      navigate(`/admin/competitions/${competition._id}/edit`)
   }

   const handleDelete = async (id: string) => {
      if (
         !window.confirm(
            "Are you sure you want to delete this competition? This action cannot be undone."
         )
      ) {
         return
      }

      setDeletingId(id)
      try {
         await deleteCompetition(id)
         toast.success("Competition deleted successfully")
         fetchCompetitions()
      } catch (error: any) {
         const apiError = error.response?.data as ApiError
         toast.error(apiError?.error || "Failed to delete competition")
      } finally {
         setDeletingId(null)
      }
   }

   const handleSubmit = async (data: any) => {
      try {
         if (editingCompetition) {
            await updateCompetition(editingCompetition._id, data)
            toast.success("Competition updated successfully")
         } else {
            await createCompetition(data)
            toast.success("Competition created successfully")
         }
         navigate("/admin/competitions")
         setEditingCompetition(null)
         fetchCompetitions()
      } catch (error: any) {
         const apiError = error.response?.data as ApiError
         toast.error(apiError?.error || "Failed to save competition")
         throw error
      }
   }

   const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: "USD",
         minimumFractionDigits: 0,
      }).format(amount)
   }

   if (isFormMode) {
      return (
         <div className='min-h-screen bg-dark-bg'>
            <AdminNavbar />
            <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
               <div className='card'>
                  <h2 className='text-2xl font-bold text-gray-100 mb-6'>
                     {isEditMode ? "Edit Competition" : "Create New Competition"}
                  </h2>
                  <CompetitionForm
                     competition={editingCompetition || undefined}
                     onSubmit={handleSubmit}
                     onCancel={() => {
                        navigate("/admin/competitions")
                     }}
                  />
               </div>
            </main>
         </div>
      )
   }

   return (
      <div className='min-h-screen bg-dark-bg'>
         <AdminNavbar />
         <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
               <div>
                  <h1 className='text-4xl font-bold text-gray-100 mb-2'>
                     Manage <span className='text-gradient'>Competitions</span>
                  </h1>
                  <p className='text-gray-400'>Create, edit, and delete competitions</p>
               </div>
               <button onClick={handleCreate} className='btn-primary mt-4 sm:mt-0'>
                  + Create Competition
               </button>
            </div>

            <div className='mb-6 flex flex-col sm:flex-row gap-4'>
               <div className='flex-1'>
                  <input
                     type='text'
                     placeholder='Search competitions by name or description...'
                     value={search}
                     onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                     }}
                     className='input-field w-full'
                  />
               </div>
               <div className='flex gap-2'>
                  <select value={search} className='input-field sm:w-48' disabled>
                     <option value=''>All Status</option>
                     <option value='active'>Active</option>
                     <option value='upcoming'>Upcoming</option>
                     <option value='ended'>Ended</option>
                  </select>
               </div>
            </div>

            {isLoading ? (
               <div className='card text-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
                  <p className='text-gray-400'>Loading competitions...</p>
               </div>
            ) : competitions.length === 0 ? (
               <div className='card text-center py-12'>
                  <p className='text-gray-400 text-lg mb-4'>No competitions found</p>
                  <button onClick={handleCreate} className='btn-primary'>
                     Create First Competition
                  </button>
               </div>
            ) : (
               <>
                  <div className='card overflow-x-auto'>
                     <table className='w-full'>
                        <thead>
                           <tr className='border-b border-dark-border bg-dark-surface'>
                              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Name
                              </th>
                              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Entry Fee
                              </th>
                              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Prize Pool
                              </th>
                              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Participants
                              </th>
                              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Status
                              </th>
                              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Created
                              </th>
                              <th className='text-right py-3 px-4 text-sm font-semibold text-gray-400'>
                                 Actions
                              </th>
                           </tr>
                        </thead>
                        <tbody>
                           {competitions.map((comp) => (
                              <tr
                                 key={comp._id}
                                 className='border-b border-dark-border hover:bg-dark-hover transition-colors'
                              >
                                 <td className='py-3 px-4'>
                                    <p className='font-medium text-gray-200'>
                                       {comp.name}
                                    </p>
                                    {comp.description && (
                                       <p className='text-sm text-gray-500 truncate max-w-xs'>
                                          {comp.description}
                                       </p>
                                    )}
                                 </td>
                                 <td className='py-3 px-4 text-gray-300'>
                                    {formatCurrency(comp.entryFee)}
                                 </td>
                                 <td className='py-3 px-4 text-success-light font-semibold'>
                                    {formatCurrency(comp.prizePool)}
                                 </td>
                                 <td className='py-3 px-4 text-gray-300'>
                                    {comp.participantCount}
                                    {comp.maxParticipants && ` / ${comp.maxParticipants}`}
                                 </td>
                                 <td className='py-3 px-4'>
                                    <div className='flex flex-col gap-1'>
                                       {comp.endsAt &&
                                       new Date(comp.endsAt) < new Date() ? (
                                          <span className='px-2 py-1 text-xs bg-gray-600/20 text-gray-400 rounded w-fit'>
                                             Ended
                                          </span>
                                       ) : comp.startsAt &&
                                         new Date(comp.startsAt) > new Date() ? (
                                          <span className='px-2 py-1 text-xs bg-warning-DEFAULT/20 text-warning-light rounded w-fit'>
                                             Upcoming
                                          </span>
                                       ) : (
                                          <span className='px-2 py-1 text-xs bg-success-DEFAULT/20 text-success-light rounded w-fit'>
                                             Active
                                          </span>
                                       )}
                                       {comp.maxParticipants &&
                                          comp.participantCount >=
                                             comp.maxParticipants && (
                                             <span className='px-2 py-1 text-xs bg-danger-DEFAULT/20 text-danger-light rounded w-fit'>
                                                Full
                                             </span>
                                          )}
                                    </div>
                                 </td>
                                 <td className='py-3 px-4 text-gray-400 text-sm'>
                                    {comp.createdAt
                                       ? new Date(comp.createdAt).toLocaleDateString()
                                       : "-"}
                                 </td>
                                 <td className='py-3 px-4'>
                                    <div className='flex justify-end space-x-2'>
                                       <Link
                                          to={`/admin/competitions/${comp._id}/participants`}
                                          className='px-3 py-1 text-sm btn-secondary'
                                          title='View Participants'
                                       >
                                          <span className='hidden sm:inline'>
                                             Participants
                                          </span>
                                          <span className='sm:hidden'>👥</span>
                                       </Link>
                                       <button
                                          onClick={() => handleEdit(comp)}
                                          className='px-3 py-1 text-sm btn-secondary'
                                          title='Edit Competition'
                                       >
                                          <span className='hidden sm:inline'>Edit</span>
                                          <span className='sm:hidden'>✏️</span>
                                       </button>
                                       <button
                                          onClick={() => handleDelete(comp._id)}
                                          disabled={deletingId === comp._id}
                                          className='px-3 py-1 text-sm btn-danger'
                                          title='Delete Competition'
                                       >
                                          {deletingId === comp._id ? (
                                             <span className='hidden sm:inline'>
                                                Deleting...
                                             </span>
                                          ) : (
                                             <>
                                                <span className='hidden sm:inline'>
                                                   Delete
                                                </span>
                                                <span className='sm:hidden'>🗑️</span>
                                             </>
                                          )}
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {totalPages > 1 && (
                     <div className='mt-6 flex justify-center items-center space-x-4'>
                        <button
                           onClick={() => setPage((p) => Math.max(1, p - 1))}
                           disabled={page === 1}
                           className='btn-secondary disabled:opacity-30'
                        >
                           Previous
                        </button>
                        <span className='text-gray-400'>
                           Page {page} of {totalPages}
                        </span>
                        <button
                           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                           disabled={page >= totalPages}
                           className='btn-secondary disabled:opacity-30'
                        >
                           Next
                        </button>
                     </div>
                  )}
               </>
            )}
         </main>
        {!isFormMode && (
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8'>
               <div className='card overflow-hidden'>
                  <h3 className='text-lg font-bold text-gray-100 mb-2'>New Competitions (30d)</h3>
                  {compSeries && compSeries.length > 0 ? (
                     <MuiLineChart data={compSeries} color="#a78bfa" />
                  ) : (
                     <div className='h-24 flex items-center justify-center text-gray-500 text-sm'>
                        No data
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   )
}
