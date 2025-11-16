import { useState, useEffect, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { AdminNavbar } from "../components/AdminNavbar"
import { getParticipants } from "../api/admin"
import { getCompetitionById } from "../api/competitions"
import { Participant, Competition, ApiError } from "../types/api"
import { toast } from "react-toastify"
import { MuiLineChart } from "../components/MuiLineChart"

export const Participants = () => {
   const { id } = useParams<{ id: string }>()
   const [competition, setCompetition] = useState<Competition | null>(null)
   const [participants, setParticipants] = useState<Participant[]>([])
   const [isLoading, setIsLoading] = useState(true)

   useEffect(() => {
      const fetchData = async () => {
         if (!id) {
            toast.error("Invalid competition ID")
            return
         }

         setIsLoading(true)
         try {
            const [compData, participantsData] = await Promise.all([
               getCompetitionById(id),
               getParticipants(id),
            ])
            setCompetition(compData)
            setParticipants(participantsData.participants)
         } catch (error: any) {
            const apiError = error.response?.data as ApiError
            toast.error(apiError?.error || "Failed to load participants")
         } finally {
            setIsLoading(false)
         }
      }

      fetchData()
   }, [id])

   const signupsSeries = useMemo(() => {
      if (!participants || participants.length === 0) return []
      const map = new Map<string, number>()
      participants.forEach((p) => {
         const d = new Date(p.joinedAt)
         const day = new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
         }).format(d) 
         map.set(day, (map.get(day) || 0) + 1)
      })
 
      const sortedDays = Array.from(map.keys()).sort()
      return sortedDays.map((day) => ({ day, value: map.get(day) || 0 }))
   }, [participants])

   const formatDate = (dateString: string): string => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
         month: "short",
         day: "numeric",
         year: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      }).format(date)
   }

   if (isLoading) {
      return (
         <div className='min-h-screen bg-dark-bg'>
            <AdminNavbar />
            <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
               <div className='text-center py-16'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
                  <p className='text-gray-400'>Loading participants...</p>
               </div>
            </main>
         </div>
      )
   }

   return (
      <div className='min-h-screen bg-dark-bg'>
         <AdminNavbar />
         <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
         
            <div className='mb-6'>
               <Link
                  to='/admin/competitions'
                  className='inline-flex items-center text-gray-400 hover:text-gray-200 mb-4 transition-colors'
               >
                  <svg
                     className='w-5 h-5 mr-2'
                     fill='none'
                     stroke='currentColor'
                     viewBox='0 0 24 24'
                  >
                     <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                     />
                  </svg>
                  Back to Competitions
               </Link>
               <h1 className='text-4xl font-bold text-gray-100 mb-2'>Participants</h1>
               {competition && (
                  <p className='text-gray-400 text-lg'>
                     {competition.name} • {participants.length} participant
                     {participants.length !== 1 ? "s" : ""}
                  </p>
               )}
            </div>

          
            {signupsSeries.length > 0 && (
               <div className='card mb-6'>
                  <h3 className='text-lg font-semibold text-gray-200 mb-3'>
                     Daily Signups
                  </h3>
                  <MuiLineChart data={signupsSeries} color='#60a5fa' />
               </div>
            )}

        
            {participants.length > 0 && (
               <div className='card mb-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                     <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                        <p className='text-xs text-gray-500 mb-1'>Total Participants</p>
                        <p className='text-2xl font-bold text-gray-200'>
                           {participants.length}
                        </p>
                     </div>
                     <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                        <p className='text-xs text-gray-500 mb-1'>Competition Capacity</p>
                        <p className='text-2xl font-bold text-gray-200'>
                           {competition?.maxParticipants
                              ? `${participants.length} / ${competition.maxParticipants}`
                              : "Unlimited"}
                        </p>
                     </div>
                     <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                        <p className='text-xs text-gray-500 mb-1'>Fill Rate</p>
                        <p className='text-2xl font-bold text-primary-400'>
                           {competition?.maxParticipants
                              ? `${Math.round(
                                   (participants.length / competition.maxParticipants) *
                                      100
                                )}%`
                              : "N/A"}
                        </p>
                     </div>
                  </div>
               </div>
            )}

        
            {participants.length === 0 ? (
               <div className='card text-center py-12'>
                  <div className='mb-4'>
                     <svg
                        className='w-16 h-16 text-gray-600 mx-auto'
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
                  <p className='text-gray-400 text-lg mb-2'>No participants yet</p>
                  <p className='text-gray-500 text-sm'>
                     Users will appear here once they join the competition.
                  </p>
               </div>
            ) : (
               <div className='card overflow-x-auto'>
                  <div className='flex justify-between items-center mb-4'>
                     <h3 className='text-lg font-semibold text-gray-200'>
                        Participant List
                     </h3>
                     <button
                        onClick={() => {
                           const csv = [
                              ["#", "Name", "Email", "Joined At"],
                              ...participants.map((p, i) => [
                                 i + 1,
                                 p.userId.name,
                                 p.userId.email,
                                 formatDate(p.joinedAt),
                              ]),
                           ]
                              .map((row) => row.join(","))
                              .join("\n")
                           const blob = new Blob([csv], { type: "text/csv" })
                           const url = window.URL.createObjectURL(blob)
                           const a = document.createElement("a")
                           a.href = url
                           a.download = `participants-${
                              competition?.name || "competition"
                           }-${new Date().toISOString().split("T")[0]}.csv`
                           a.click()
                           window.URL.revokeObjectURL(url)
                        }}
                        className='btn-secondary text-sm px-4 py-2'
                     >
                        Export CSV
                     </button>
                  </div>
                  <table className='w-full'>
                     <thead>
                        <tr className='border-b border-dark-border bg-dark-surface'>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              #
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Name
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Email
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Joined At
                           </th>
                        </tr>
                     </thead>
                     <tbody>
                        {participants.map((participant, index) => (
                           <tr
                              key={participant._id}
                              className='border-b border-dark-border hover:bg-dark-hover transition-colors'
                           >
                              <td className='py-3 px-4 text-gray-400 font-mono'>
                                 {index + 1}
                              </td>
                              <td className='py-3 px-4'>
                                 <div className='flex items-center space-x-2'>
                                    <div className='w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center'>
                                       <span className='text-primary-400 font-semibold text-sm'>
                                          {participant.userId.name
                                             .charAt(0)
                                             .toUpperCase()}
                                       </span>
                                    </div>
                                    <p className='font-medium text-gray-200'>
                                       {participant.userId.name}
                                    </p>
                                 </div>
                              </td>
                              <td className='py-3 px-4 text-gray-300'>
                                 {participant.userId.email}
                              </td>
                              <td className='py-3 px-4 text-gray-400 text-sm'>
                                 {formatDate(participant.joinedAt)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </main>
      </div>
   )
}
