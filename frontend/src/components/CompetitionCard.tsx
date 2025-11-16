import { Competition } from "../types/api"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getCompetitionParticipants } from "../api/competitions"
import { isCompetitionJoined } from "../utils/joinedCompetitions"

interface CompetitionCardProps {
   competition: Competition
   onJoin: (id: string) => Promise<void>
   isJoining?: boolean
   verifyJoinedOnMount?: boolean
}

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
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   }).format(date)
}

export const CompetitionCard = ({
   competition,
   verifyJoinedOnMount = false,
}: CompetitionCardProps) => {
   const [isHovered, setIsHovered] = useState(false)
   const { user } = useAuth()
   const [hasJoined, setHasJoined] = useState<boolean>(competition.joined || isCompetitionJoined(competition._id))
   

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

    useEffect(() => {
      let isActive = true
      const fromStorage = isCompetitionJoined(competition._id)
      if (fromStorage && !hasJoined) {
         setHasJoined(true)
      }
      const verifyJoined = async (): Promise<void> => {
         if (!verifyJoinedOnMount || !user) return
         try {
            const resp = await getCompetitionParticipants(competition._id, { limit: 1000 })
            const found = resp.data?.some(
               (p) => p.userId?._id === user._id
            )
            if (isActive) {
               setHasJoined(!!found || competition.joined)
            }
         } catch {
            if (isActive) {
               setHasJoined(competition.joined || fromStorage)
            }
         }
      }
      verifyJoined()
      return () => {
         isActive = false
      }
   }, [competition._id, user?._id, verifyJoinedOnMount])

   return (
      <div
         className={`card-hover group relative overflow-hidden transition-all duration-300 ${
            isHovered ? "scale-[1.02]" : ""
         }`}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
      >
        <div className='absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none' />

         <div className='relative z-10'>
            <div className='flex justify-between items-start mb-4'>
               <div className='flex-1'>
                  <Link to={`/competitions/${competition._id}`} className='block'>
                     <h3 className='text-xl font-bold text-gray-100 mb-1 group-hover:text-primary-400 transition-colors cursor-pointer hover:underline'>
                        {competition.name}
                     </h3>
                  </Link>
                  {competition.description && (
                     <p className='text-sm text-gray-400 line-clamp-2'>
                        {competition.description}
                     </p>
                  )}
               </div>
               {hasJoined && (
                  <span className='ml-3 px-3 py-1 text-xs font-semibold bg-success-DEFAULT/20 text-success-light rounded-full border border-success-DEFAULT/30 flex-shrink-0'>
                     ✓ Joined
                  </span>
               )}
            </div>

            <div className='grid grid-cols-2 gap-4 mb-6'>
               <div className='bg-dark-surface rounded-lg p-3 border border-dark-border'>
                  <p className='text-xs text-gray-500 mb-1'>Entry Fee</p>
                  <p className='text-lg font-bold text-gray-200 font-mono'>
                     {formatCurrency(competition.entryFee)}
                  </p>
               </div>
               <div className='bg-dark-surface rounded-lg p-3 border border-dark-border'>
                  <p className='text-xs text-gray-500 mb-1'>Prize Pool</p>
                  <p className='text-lg font-bold text-success-light font-mono'>
                     {formatCurrency(competition.prizePool)}
                  </p>
               </div>
               <div className='bg-dark-surface rounded-lg p-3 border border-dark-border'>
                  <p className='text-xs text-gray-500 mb-1'>ROI</p>
                  <p className='text-lg font-bold text-primary-400 font-mono'>+{roi}%</p>
               </div>
               <div className='bg-dark-surface rounded-lg p-3 border border-dark-border'>
                  <p className='text-xs text-gray-500 mb-1'>Participants</p>
                  <p className='text-lg font-bold text-gray-200 font-mono'>
                     {competition.participantCount}
                     {competition.maxParticipants && ` / ${competition.maxParticipants}`}
                  </p>
               </div>
            </div>

            <div className='flex flex-wrap gap-2 mb-4'>
               {isUpcoming && (
                  <span className='px-2 py-1 text-xs font-medium bg-warning-DEFAULT/20 text-warning-light rounded border border-warning-DEFAULT/30'>
                     Upcoming
                  </span>
               )}
               {isEnded && (
                  <span className='px-2 py-1 text-xs font-medium bg-gray-600/20 text-gray-400 rounded border border-gray-600/30'>
                     Ended
                  </span>
               )}
               {isFull && !competition.joined && (
                  <span className='px-2 py-1 text-xs font-medium bg-danger-DEFAULT/20 text-danger-light rounded border border-danger-DEFAULT/30'>
                     Full
                  </span>
               )}
            </div>

            {(competition.startsAt || competition.endsAt) && (
               <div className='mb-4 space-y-1 text-xs text-gray-500'>
                  {competition.startsAt && (
                     <p>Starts: {formatDate(competition.startsAt)}</p>
                  )}
                  {competition.endsAt && <p>Ends: {formatDate(competition.endsAt)}</p>}
               </div>
            )}
         </div>
      </div>
   )
}
