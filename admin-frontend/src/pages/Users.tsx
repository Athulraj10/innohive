import { useState, useEffect } from "react"
import { AdminNavbar } from "../components/AdminNavbar"
import { UserDetailsModal } from "../components/UserDetailsModal"
import { getAllUsers, getAdminTimeSeries } from "../api/admin"
import { User, ApiError } from "../types/api"
import { toast } from "react-toastify"
import { MuiLineChart } from "../components/MuiLineChart"

export const Users = () => {
   const [users, setUsers] = useState<User[]>([])
   const [isLoading, setIsLoading] = useState(true)
   const [search, setSearch] = useState("")
   const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL")
   const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
   const [selectedUserName, setSelectedUserName] = useState<string>("")
   const [page, setPage] = useState(1)
   const [totalPages, setTotalPages] = useState(0)
   const [signupSeries, setSignupSeries] = useState<{ day: string; value: number }[] | null>(null)
   const [total, setTotal] = useState(0)

   useEffect(() => {
      const fetchUsers = async () => {
         setIsLoading(true)
         try {
            const response = await getAllUsers({
               page,
               limit: 10,
               search: search || undefined,
               role: roleFilter !== "ALL" ? (roleFilter as "USER" | "ADMIN") : undefined,
            })
            if (response && response.users) {
               setUsers(response.users)
               setTotalPages(Math.ceil(response.meta.total / response.meta.limit))
               setTotal(response.meta.total)
            } else {
               toast.info("User management endpoint needs to be implemented in backend")
               setUsers([])
            }
         } catch (error: any) {
            if (error.response?.status === 404) {
               toast.info(
                  "User management endpoint needs to be implemented in backend. See README for details."
               )
            } else {
               const apiError = error.response?.data as ApiError
               toast.error(apiError?.error || "Failed to load users")
            }
            setUsers([])
         } finally {
            setIsLoading(false)
         }
      }

      fetchUsers()
      ;(async () => {
         try {
            const now = Date.now()
            const from = now - 365 * 24 * 3600 * 1000
            const m = await getAdminTimeSeries({ from, to: now, granularity: 'month' })
            setSignupSeries(m.users)
         } catch {}
      })()
   }, [page, search, roleFilter])

   const filteredUsers = users

   const formatDate = (dateString: string | Date): string => {
      if (!dateString) return "-"
      const date = typeof dateString === "string" ? new Date(dateString) : dateString
      return new Intl.DateTimeFormat("en-US", {
         month: "short",
         day: "numeric",
         year: "numeric",
      }).format(date)
   }

   const userStats = {
      total,
      admins: filteredUsers.filter((u) => u.role === "ADMIN").length,
      regularUsers: filteredUsers.filter((u) => u.role === "USER" || !u.role).length,
   }

   return (
      <div className='min-h-screen bg-dark-bg'>
         <AdminNavbar />
         <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='mb-6'>
               <h1 className='text-4xl font-bold text-gray-100 mb-2'>
                  User <span className='text-gradient'>Management</span>
               </h1>
               <p className='text-gray-400'>View and manage platform users</p>
            </div>

            {users.length > 0 && (
               <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                  <div className='card'>
                     <div className='flex items-center justify-between'>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Total Users</p>
                           <p className='text-3xl font-bold text-gray-100'>
                              {userStats.total}
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
                                 d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                              />
                           </svg>
                        </div>
                     </div>
                  </div>
                  <div className='card'>
                     <div className='flex items-center justify-between'>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Admins</p>
                           <p className='text-3xl font-bold text-danger-light'>
                              {userStats.admins}
                           </p>
                        </div>
                        <div className='w-12 h-12 bg-danger-DEFAULT/20 rounded-lg flex items-center justify-center'>
                           <svg
                              className='w-6 h-6 text-danger-light'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                           >
                              <path
                                 strokeLinecap='round'
                                 strokeLinejoin='round'
                                 strokeWidth={2}
                                 d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                              />
                           </svg>
                        </div>
                     </div>
                  </div>
                  <div className='card'>
                     <div className='flex items-center justify-between'>
                        <div>
                           <p className='text-sm text-gray-500 mb-1'>Regular Users</p>
                           <p className='text-3xl font-bold text-primary-400'>
                              {userStats.regularUsers}
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
                                 d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                              />
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            <div className='mb-6 flex flex-col sm:flex-row gap-4'>
               <input
                  type='text'
                  placeholder='Search users by name or email...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='input-field flex-1'
               />
               <select
                  value={roleFilter}
                  onChange={(e) =>
                     setRoleFilter(e.target.value as "ALL" | "USER" | "ADMIN")
                  }
                  className='input-field sm:w-48'
               >
                  <option value='ALL'>All Roles</option>
                  <option value='USER'>Users</option>
                  <option value='ADMIN'>Admins</option>
               </select>
            </div>

            {isLoading ? (
               <div className='card text-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
                  <p className='text-gray-400'>Loading users...</p>
               </div>
            ) : filteredUsers.length === 0 ? (
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
                  <p className='text-gray-400 text-lg mb-2'>No users found</p>
                  <p className='text-gray-500 text-sm'>
                     {search || roleFilter !== "ALL"
                        ? "Try adjusting your filters"
                        : "User management endpoint needs to be implemented in backend. See README for implementation details."}
                  </p>
               </div>
            ) : (
               <div className='card overflow-x-auto'>
                  <table className='w-full'>
                     <thead>
                        <tr className='border-b border-dark-border bg-dark-surface'>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Name
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Email
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Role
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Joined
                           </th>
                           <th className='text-left py-3 px-4 text-sm font-semibold text-gray-400'>
                              Actions
                           </th>
                        </tr>
                     </thead>
                     <tbody>
                        {filteredUsers.map((user) => (
                           <tr
                              key={user._id}
                              className='border-b border-dark-border hover:bg-dark-hover transition-colors'
                           >
                              <td className='py-3 px-4'>
                                 <div className='flex items-center space-x-2'>
                                    <div
                                       className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          user.role === "ADMIN"
                                             ? "bg-danger-DEFAULT/20"
                                             : "bg-primary-500/20"
                                       }`}
                                    >
                                       <span
                                          className={`font-semibold text-sm ${
                                             user.role === "ADMIN"
                                                ? "text-danger-light"
                                                : "text-primary-400"
                                          }`}
                                       >
                                          {user.name.charAt(0).toUpperCase()}
                                       </span>
                                    </div>
                                    <p className='font-medium text-gray-200'>
                                       {user.name}
                                    </p>
                                 </div>
                              </td>
                              <td className='py-3 px-4 text-gray-300'>{user.email}</td>
                              <td className='py-3 px-4'>
                                 <span
                                    className={`px-2 py-1 text-xs rounded font-medium ${
                                       user.role === "ADMIN"
                                          ? "bg-danger-DEFAULT/20 text-danger-light border border-danger-DEFAULT/30"
                                          : "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                                    }`}
                                 >
                                    {user.role || "USER"}
                                 </span>
                              </td>
                              <td className='py-3 px-4 text-gray-400 text-sm'>
                                 {user.createdAt ? formatDate(user.createdAt) : "-"}
                              </td>
                              <td className='py-3 px-4'>
                                 <button
                                    onClick={() => {
                                       setSelectedUserId(user._id)
                                       setSelectedUserName(user.name)
                                    }}
                                    className='text-sm text-primary-400 hover:text-primary-300 transition-colors'
                                 >
                                    View Details
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}

            <div className='card mt-6 overflow-hidden'>
               <h3 className='text-lg font-bold text-gray-100 mb-2'>User Signups per Month (12m)</h3>
               {signupSeries && signupSeries.length > 0 ? (
                  <MuiLineChart data={signupSeries} color='#3b82f6' />
               ) : (
                  <div className='h-24 flex items-center justify-center text-gray-500 text-sm'>
                     No data
                  </div>
               )}
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

            {selectedUserId && (
               <UserDetailsModal
                  userId={selectedUserId}
                  userName={selectedUserName}
                  onClose={() => {
                     setSelectedUserId(null)
                     setSelectedUserName("")
                  }}
               />
            )}
         </main>
      </div>
   )
}
