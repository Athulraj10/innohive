import { useEffect, useState } from "react"
import { getUserDetails, UserDetails } from "../api/admin"
import { ApiError } from "../types/api"
import { toast } from "react-toastify"

interface UserDetailsModalProps {
   userId: string | null
   userName: string
   onClose: () => void
}

export const UserDetailsModal = ({
   userId,
   userName,
   onClose,
}: UserDetailsModalProps) => {
   const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
   const [isLoading, setIsLoading] = useState(false)

   useEffect(() => {
      if (userId) {
         fetchUserDetails()
      }
   }, [userId])

   const fetchUserDetails = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
         const details = await getUserDetails(userId)
         setUserDetails(details)
      } catch (error: any) {
         const apiError = error.response?.data as ApiError
         toast.error(apiError?.error || "Failed to load user details")
         onClose()
      } finally {
         setIsLoading(false)
      }
   }

   const formatDate = (dateString: string | Date): string => {
      if (!dateString) return "-"
      const date = typeof dateString === "string" ? new Date(dateString) : dateString
      return new Intl.DateTimeFormat("en-US", {
         month: "short",
         day: "numeric",
         year: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      }).format(date)
   }

   const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: "USD",
         minimumFractionDigits: 0,
         maximumFractionDigits: 0,
      }).format(amount)
   }

   if (!userId) return null

   return (
      <div
         className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'
         onClick={onClose}
      >
         <div
            className='card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
         >
            {/* Header */}
            <div className='flex justify-between items-center mb-6 pb-4 border-b border-dark-border'>
               <div>
                  <h2 className='text-2xl font-bold text-gray-100 mb-1'>
                     User Details
                  </h2>
                  <p className='text-gray-400'>{userName}</p>
               </div>
               <button
                  onClick={onClose}
                  className='text-gray-400 hover:text-gray-200 transition-colors'
               >
                  <svg
                     className='w-6 h-6'
                     fill='none'
                     stroke='currentColor'
                     viewBox='0 0 24 24'
                  >
                     <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                     />
                  </svg>
               </button>
            </div>

            {isLoading ? (
               <div className='text-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
                  <p className='text-gray-400'>Loading user details...</p>
               </div>
            ) : userDetails ? (
               <div className='space-y-6'>
                  <div className='bg-dark-surface rounded-lg p-6 border border-dark-border'>
                     <h3 className='text-lg font-semibold text-gray-100 mb-4'>
                        User Information
                     </h3>
                     <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Name</p>
                           <p className='text-gray-200 font-medium'>{userDetails.name}</p>
                        </div>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Email</p>
                           <p className='text-gray-200 font-medium'>{userDetails.email}</p>
                        </div>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Role</p>
                           <span
                              className={`inline-block px-3 py-1 text-xs rounded font-medium ${
                                 userDetails.role === "ADMIN"
                                    ? "bg-danger-DEFAULT/20 text-danger-light border border-danger-DEFAULT/30"
                                    : "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                              }`}
                           >
                              {userDetails.role || "USER"}
                           </span>
                        </div>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Joined</p>
                           <p className='text-gray-200 font-medium'>
                              {formatDate(userDetails.createdAt)}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className='bg-dark-surface rounded-lg p-6 border border-dark-border'>
                     <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-100'>
                           Competition Participations
                        </h3>
                        <span className='px-3 py-1 text-sm bg-primary-500/20 text-primary-400 rounded border border-primary-500/30'>
                           {userDetails.totalParticipations} Total
                        </span>
                     </div>

                     {userDetails.participations.length === 0 ? (
                        <div className='text-center py-8'>
                           <svg
                              className='w-12 h-12 text-gray-600 mx-auto mb-3'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                           >
                              <path
                                 strokeLinecap='round'
                                 strokeLinejoin='round'
                                 strokeWidth={2}
                                 d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                           </svg>
                           <p className='text-gray-400'>
                              This user hasn't joined any competitions yet.
                           </p>
                        </div>
                     ) : (
                        <div className='overflow-x-auto'>
                           <table className='w-full'>
                              <thead>
                                 <tr className='border-b border-dark-border'>
                                    <th className='text-left py-2 px-3 text-sm font-semibold text-gray-400'>
                                       Competition
                                    </th>
                                    <th className='text-left py-2 px-3 text-sm font-semibold text-gray-400'>
                                       Entry Fee
                                    </th>
                                    <th className='text-left py-2 px-3 text-sm font-semibold text-gray-400'>
                                       Prize Pool
                                    </th>
                                    <th className='text-left py-2 px-3 text-sm font-semibold text-gray-400'>
                                       Joined At
                                    </th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {userDetails.participations.map((participation) => (
                                    <tr
                                       key={participation._id}
                                       className='border-b border-dark-border hover:bg-dark-hover transition-colors'
                                    >
                                       <td className='py-3 px-3 text-gray-200 font-medium'>
                                          {participation.competitionName}
                                       </td>
                                       <td className='py-3 px-3 text-gray-300'>
                                          {formatCurrency(participation.entryFee)}
                                       </td>
                                       <td className='py-3 px-3 text-success-light font-semibold'>
                                          {formatCurrency(participation.prizePool)}
                                       </td>
                                       <td className='py-3 px-3 text-gray-400 text-sm'>
                                          {formatDate(participation.joinedAt)}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>
               </div>
            ) : null}

            <div className='mt-6 pt-4 border-t border-dark-border flex justify-end'>
               <button onClick={onClose} className='btn-secondary'>
                  Close
               </button>
            </div>
         </div>
      </div>
   )
}

