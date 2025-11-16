import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { getCompetitionById, joinCompetition, getCompetitionParticipants } from "../api/competitions"
import { Competition, ApiError } from "../types/api"
import { Chart } from "../components/Chart"
import { Header } from "../components/Header"
import { LoadingSkeleton } from "../components/LoadingSkeleton"
import { ParticipantsSidebar } from "../components/ParticipantsSidebar"
import { useAuth } from "../hooks/useAuth"
import { toast } from "react-toastify"
import { addJoinedCompetition, isCompetitionJoined } from "../utils/joinedCompetitions"
import { motion, AnimatePresence } from "framer-motion"

const formatCurrency = (amount: number): string => {
   return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
   }).format(amount)
}

const formatDate = (dateString?: string): string => {
   if (!dateString) return ""
   const date = new Date(dateString)
   return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   }).format(date)
}

export const CompetitionDetail = () => {
   const { id } = useParams<{ id: string }>()
   const navigate = useNavigate()
   const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuth()
   const [competition, setCompetition] = useState<Competition | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [isJoining, setIsJoining] = useState(false)
   const clickLockRef = useRef(false)
   const [shareOpen, setShareOpen] = useState(false)

   useEffect(() => {
      const fetchCompetition = async () => {
         if (!id) {
            toast.error("Invalid competition ID")
            navigate("/dashboard")
            return
         }

         if (authLoading) {
            return
         }

         const joinedFromStorage = isCompetitionJoined(id)

         setIsLoading(true)
         try {
            const data = await getCompetitionById(id)
     if (data.joined) {
               addJoinedCompetition(id)
            }

            const isJoined = joinedFromStorage || data.joined

            const competitionWithJoinedStatus = {
               ...data,
               joined: isJoined,
               participantCount: (data as any).participantCount ?? 0,
            }

            setCompetition(competitionWithJoinedStatus)
         } catch (error: any) {
            const apiError = error.response?.data as ApiError

            const joinedFromStorage = isCompetitionJoined(id)

            if (joinedFromStorage) {
               setCompetition((prev) =>
                  prev
                     ? {
                          ...prev,
                          joined: true,
                       }
                     : null
               )
               toast.error(apiError?.error || "Failed to load competition details")
            } else {
               toast.error(apiError?.error || "Failed to load competition")
               navigate("/dashboard")
            }
         } finally {
            setIsLoading(false)
         }
      }

      if (!authLoading) {
         fetchCompetition()
      }
   }, [id, navigate, authLoading])

   useEffect(() => {
      let isActive = true
      const verifyJoined = async (): Promise<void> => {
         if (!id || !user) return
         try {
            const resp = await getCompetitionParticipants(id, { limit: 1000 })
            const found = resp.data?.some((p) => p.userId?._id === user._id)
            if (isActive && found) {
               setCompetition((prev) =>
                  prev
                     ? {
                          ...prev,
                          joined: true,
                       }
                     : prev
               )
            }
         } catch {
          }
      }
      verifyJoined()
      return () => {
         isActive = false
      }
   }, [id, user?._id])

   const handleJoin = async () => {
      if (!id || !competition) return
      if (clickLockRef.current) return

      if (competition.joined || isCompetitionJoined(id)) {
         toast.info("You have already joined this competition")
         if (!competition.joined) {
            setCompetition({
               ...competition,
               joined: true,
            })
         }
         return
      }

      if (authLoading) {
         return 
     }

      if (!isAuthenticated) {
         toast.info("Please login to join competitions")
         navigate("/login", { state: { from: `/competitions/${id}` } })
         return
      }

      const entryFee = competition.entryFee ?? 0
      const exposure = user?.exposure ?? 0
      const wallet = user?.walletBalance ?? 100
      const balance = wallet - exposure
      if (entryFee > balance) {
         toast.error("Insufficient balance to join this competition")
         return
      }

        setIsJoining(true)
      clickLockRef.current = true
      try {
         await joinCompetition(id)

         addJoinedCompetition(id)

         toast.success("Successfully joined the competition! Good luck! 🚀")

        setCompetition({
           ...competition,
           joined: true,
           participantCount: (competition.participantCount ?? 0) + 1,
        })
         checkAuth()
      } catch (error: any) {
         const apiError = error.response?.data as ApiError
         if (
            apiError?.code === "INSUFFICIENT_BALANCE" ||
            apiError?.error?.toLowerCase()?.includes("insufficient")
         ) {
            toast.error("Insufficient balance to join this competition")
        } else if (
            apiError?.error?.includes("Already") ||
            apiError?.code === "ALREADY_JOINED"
         ) {
            addJoinedCompetition(id)
            if (competition) {
               setCompetition({
                  ...competition,
                  joined: true,
               })
            }
            toast.info("You are already joined to this competition")
         } else if (
            apiError?.error?.includes("full") ||
            apiError?.code === "COMPETITION_FULL"
         ) {
            toast.error("This competition is full")
         } else if (
            apiError?.error?.includes("ended") ||
            apiError?.code === "COMPETITION_ENDED"
         ) {
            toast.error("This competition has ended")
         } else {
            toast.error(apiError?.error || "Failed to join competition")
         }
      } finally {
         setIsJoining(false)
         clickLockRef.current = competition?.joined ? true : false
      }
   }

   if (isLoading) {
      return (
         <div className='min-h-screen bg-dark-bg'>
            <Header />
            <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
               <LoadingSkeleton />
            </main>
         </div>
      )
   }

   if (!competition) {
      return (
         <div className='min-h-screen bg-dark-bg'>
            <Header />
            <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
               <div className='text-center py-16'>
                  <p className='text-gray-400 text-lg mb-4'>Competition not found</p>
                  <Link to='/dashboard' className='btn-primary inline-block'>
                     Back to Dashboard
                  </Link>
               </div>
            </main>
         </div>
      )
   }

   const roi =
      competition.entryFee > 0
         ? (
              ((competition.prizePool - competition.entryFee) / competition.entryFee) *
              100
           ).toFixed(1)
         : "0"

   const isFull = competition.maxParticipants
      ? competition.participantCount >= competition.maxParticipants
      : false

   const isUpcoming = !!(
      competition.startsAt && new Date(competition.startsAt) > new Date()
   )
   const isEnded = !!(competition.endsAt && new Date(competition.endsAt) < new Date())

   return (
      <div className='min-h-screen bg-dark-bg'>
         <Header />
         <main className='max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <Link
               to='/dashboard'
               className='inline-flex items-center text-gray-400 hover:text-gray-200 mb-6 transition-colors'
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

            <div className='card mb-8 animate-fade-in'>
               <div className='flex flex-col md:flex-row md:items-start md:justify-between mb-6'>
                  <div className='flex-1'>
                     <h1 className='text-4xl font-bold text-gray-100 mb-2'>
                        {competition.name}
                     </h1>
                     {competition.description && (
                        <p className='text-gray-400 text-lg mb-4'>
                           {competition.description}
                        </p>
                     )}
                     {competition.joined && (
                        <span className='inline-block px-4 py-2 text-sm font-semibold bg-success-DEFAULT/20 text-success-light rounded-full border border-success-DEFAULT/30'>
                           ✓ You're Joined
                        </span>
                     )}
                  </div>
                  <div className='mt-4 md:mt-0 md:ml-6'>
                     <button
                        onClick={handleJoin}
                        disabled={competition.joined || isJoining || isFull || isEnded}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                           competition.joined
                              ? "bg-dark-surface text-gray-500 cursor-not-allowed border border-dark-border"
                              : isFull || isEnded
                              ? "bg-dark-surface text-gray-500 cursor-not-allowed border border-dark-border"
                              : isJoining
                              ? "bg-primary-600 text-white cursor-wait opacity-75"
                              : "btn-primary hover:shadow-glow"
                        }`}
                     >
                        {competition.joined
                           ? "✓ Joined"
                           : isFull
                           ? "Competition Full"
                           : isEnded
                           ? "Competition Ended"
                           : isJoining
                           ? "Joining..."
                           : "Join Competition"}
                     </button>
                     <button
                        onClick={() => setShareOpen(true)}
                        className="ml-3 px-4 py-3 rounded-lg font-semibold bg-dark-surface text-gray-200 border border-dark-border hover:bg-dark-hover transition"
                        aria-label="Share competition"
                     >
                        Share
                     </button>
                  </div>
               </div>

               <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                  <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                     <p className='text-xs text-gray-500 mb-1'>Entry Fee</p>
                     <p className='text-2xl font-bold text-gray-200 font-mono'>
                        {formatCurrency(competition.entryFee)}
                     </p>
                  </div>
                  <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                     <p className='text-xs text-gray-500 mb-1'>Prize Pool</p>
                     <p className='text-2xl font-bold text-success-light font-mono'>
                        {formatCurrency(competition.prizePool)}
                     </p>
                  </div>
                  <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                     <p className='text-xs text-gray-500 mb-1'>ROI</p>
                     <p className='text-2xl font-bold text-primary-400 font-mono'>
                        +{roi}%
                     </p>
                  </div>
                  <div className='bg-dark-surface rounded-lg p-4 border border-dark-border'>
                     <p className='text-xs text-gray-500 mb-1'>Participants</p>
                     <p className='text-2xl font-bold text-gray-200 font-mono'>
                        {competition.participantCount}
                        {competition?.maxParticipants &&
                           ` / ${competition.maxParticipants}`}
                     </p>
                  </div>
               </div>

               <div className='flex flex-wrap items-center gap-4'>
                  {isUpcoming && (
                     <span className='px-3 py-1 text-sm font-medium bg-warning-DEFAULT/20 text-warning-light rounded border border-warning-DEFAULT/30'>
                        Upcoming
                     </span>
                  )}
                  {isEnded && (
                     <span className='px-3 py-1 text-sm font-medium bg-gray-600/20 text-gray-400 rounded border border-gray-600/30'>
                        Ended
                     </span>
                  )}
                  {isFull && !competition.joined && (
                     <span className='px-3 py-1 text-sm font-medium bg-danger-DEFAULT/20 text-danger-light rounded border border-danger-DEFAULT/30'>
                        Full
                     </span>
                  )}
                  {(competition.startsAt || competition.endsAt) && (
                     <div className='text-sm text-gray-400'>
                        {competition.startsAt && (
                           <span>Starts: {formatDate(competition.startsAt)}</span>
                        )}
                        {competition.startsAt && competition.endsAt && (
                           <span className='mx-2'>•</span>
                        )}
                        {competition.endsAt && (
                           <span>Ends: {formatDate(competition.endsAt)}</span>
                        )}
                     </div>
                  )}
               </div>
            </div>

            <AnimatePresence>
              {shareOpen && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-black/60" onClick={() => setShareOpen(false)} />
                  <motion.div
                    className="relative z-10 w-full max-w-md rounded-xl border border-dark-border bg-dark-card p-6"
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-100">Share Competition</h3>
                      <button onClick={() => setShareOpen(false)} className="text-gray-400 hover:text-gray-200">
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Share this competition with your friends and compete together.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        readOnly
                        value={window.location.href}
                        className="input-field flex-1"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(window.location.href)
                            toast.success("Link copied to clipboard")
                          } catch {
                            toast.error("Failed to copy link")
                          }
                        }}
                        className="btn-secondary"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        const shareData = {
                          title: competition.name,
                          text: `Join me in ${competition.name}!`,
                          url: window.location.href,
                        }
                        if ((navigator as any).share) {
                          try {
                            await (navigator as any).share(shareData)
                            setShareOpen(false)
                          } catch {
                          }
                        } else {
                          try {
                            await navigator.clipboard.writeText(window.location.href)
                            toast.success("Link copied to clipboard")
                          } catch {
                            toast.error("Failed to share")
                          }
                        }
                      }}
                      className="btn-primary w-full"
                    >
                      Share
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
               <div className='lg:col-span-2'>
                  <div
                     className='card animate-fade-in'
                     style={{ animationDelay: "0.1s" }}
                  >
                     <h2 className='text-2xl font-bold text-gray-100 mb-6'>
                        Performance Chart
                     </h2>
                     <Chart competitionId={competition._id} height={500} />
                  </div>
               </div>

               <div className='lg:col-span-1'>
                  <div className='animate-fade-in' style={{ animationDelay: "0.2s" }}>
                     <ParticipantsSidebar competitionId={competition._id} />
                  </div>
               </div>
            </div>
         </main>
      </div>
   )
}
