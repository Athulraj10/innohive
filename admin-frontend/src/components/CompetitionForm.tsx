import { useState, useEffect } from "react"
import { Competition } from "../types/api"
import { CreateCompetitionData, UpdateCompetitionData } from "../api/admin"

interface CompetitionFormProps {
   competition?: Competition
   onSubmit: (data: CreateCompetitionData | UpdateCompetitionData) => Promise<void>
   onCancel: () => void
   isLoading?: boolean
}

export const CompetitionForm = ({
   competition,
   onSubmit,
   onCancel,
   isLoading = false,
}: CompetitionFormProps) => {
   const [formData, setFormData] = useState({
      name: competition?.name || "",
      description: competition?.description || "",
      entryFee: competition?.entryFee?.toString() || "",
      prizePool: competition?.prizePool?.toString() || "",
      maxParticipants: competition?.maxParticipants?.toString() || "",
      startsAt: competition?.startsAt
         ? new Date(competition.startsAt).toISOString().slice(0, 16)
         : "",
      endsAt: competition?.endsAt
         ? new Date(competition.endsAt).toISOString().slice(0, 16)
         : "",
   })

   const [errors, setErrors] = useState<Record<string, string>>({})

   useEffect(() => {
      if (competition) {
         setFormData({
            name: competition.name || "",
            description: competition.description || "",
            entryFee: competition.entryFee?.toString() || "",
            prizePool: competition.prizePool?.toString() || "",
            maxParticipants: competition.maxParticipants?.toString() || "",
            startsAt: competition.startsAt
               ? new Date(competition.startsAt).toISOString().slice(0, 16)
               : "",
            endsAt: competition.endsAt
               ? new Date(competition.endsAt).toISOString().slice(0, 16)
               : "",
         })
      } else {
         setFormData({
            name: "",
            description: "",
            entryFee: "",
            prizePool: "",
            maxParticipants: "",
            startsAt: "",
            endsAt: "",
         })
      }
   }, [competition])

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
   ) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, [name]: "" }))
   }

   const validate = (): boolean => {
      const newErrors: Record<string, string> = {}

      if (!formData.name.trim()) {
         newErrors.name = "Name is required"
      } else if (formData.name.trim().length < 3) {
         newErrors.name = "Name must be at least 3 characters"
      }

      if (!formData.entryFee) {
         newErrors.entryFee = "Entry fee is required"
      } else if (parseFloat(formData.entryFee) < 0) {
         newErrors.entryFee = "Entry fee must be non-negative"
      }

      if (!formData.prizePool) {
         newErrors.prizePool = "Prize pool is required"
      } else if (parseFloat(formData.prizePool) < 0) {
         newErrors.prizePool = "Prize pool must be non-negative"
      }

      if (formData.maxParticipants && parseInt(formData.maxParticipants) < 1) {
         newErrors.maxParticipants = "Max participants must be at least 1"
      }

      if (formData.startsAt && formData.endsAt) {
         if (new Date(formData.endsAt) <= new Date(formData.startsAt)) {
            newErrors.endsAt = "End date must be after start date"
         }
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) {
         return
      }

      const submitData: CreateCompetitionData | UpdateCompetitionData = {
         name: formData.name.trim(),
         description: formData.description.trim() || undefined,
         entryFee: parseFloat(formData.entryFee),
         prizePool: parseFloat(formData.prizePool),
         maxParticipants: formData.maxParticipants
            ? parseInt(formData.maxParticipants)
            : undefined,
         startsAt: formData.startsAt
            ? new Date(formData.startsAt).toISOString()
            : undefined,
         endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : undefined,
      }

      await onSubmit(submitData)
   }

   return (
      <form onSubmit={handleSubmit} className='space-y-6'>
         <div>
            <label
               htmlFor='name'
               className='block text-sm font-medium text-gray-300 mb-2'
            >
               Competition Name *
            </label>
            <input
               id='name'
               name='name'
               type='text'
               required
               value={formData.name}
               onChange={handleChange}
               className={`input-field ${
                  errors.name ? "border-danger-light focus:ring-danger-light" : ""
               }`}
               placeholder='e.g., Crypto Sprint'
            />
            {errors.name && (
               <p className='mt-1 text-sm text-danger-light'>{errors.name}</p>
            )}
         </div>

         <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
               <label
                  htmlFor='entryFee'
                  className='block text-sm font-medium text-gray-300 mb-2'
               >
                  Entry Fee ($) *
               </label>
               <input
                  id='entryFee'
                  name='entryFee'
                  type='number'
                  step='0.01'
                  min='0'
                  required
                  value={formData.entryFee}
                  onChange={handleChange}
                  className={`input-field ${
                     errors.entryFee ? "border-danger-light focus:ring-danger-light" : ""
                  }`}
                  placeholder='10'
               />
               {errors.entryFee && (
                  <p className='mt-1 text-sm text-danger-light'>{errors.entryFee}</p>
               )}
            </div>

            <div>
               <label
                  htmlFor='prizePool'
                  className='block text-sm font-medium text-gray-300 mb-2'
               >
                  Prize Pool ($) *
               </label>
               <input
                  id='prizePool'
                  name='prizePool'
                  type='number'
                  step='0.01'
                  min='0'
                  required
                  value={formData.prizePool}
                  onChange={handleChange}
                  className={`input-field ${
                     errors.prizePool ? "border-danger-light focus:ring-danger-light" : ""
                  }`}
                  placeholder='1000'
               />
               {errors.prizePool && (
                  <p className='mt-1 text-sm text-danger-light'>{errors.prizePool}</p>
               )}
            </div>
         </div>

         <div>
            <label
               htmlFor='maxParticipants'
               className='block text-sm font-medium text-gray-300 mb-2'
            >
               Max Participants (optional)
            </label>
            <input
               id='maxParticipants'
               name='maxParticipants'
               type='number'
               min='1'
               value={formData.maxParticipants}
               onChange={handleChange}
               className={`input-field ${
                  errors.maxParticipants
                     ? "border-danger-light focus:ring-danger-light"
                     : ""
               }`}
               placeholder='100'
            />
            {errors.maxParticipants && (
               <p className='mt-1 text-sm text-danger-light'>{errors.maxParticipants}</p>
            )}
         </div>

         <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
               <label
                  htmlFor='startsAt'
                  className='block text-sm font-medium text-gray-300 mb-2'
               >
                  Start Date (optional)
               </label>
               <input
                  id='startsAt'
                  name='startsAt'
                  type='datetime-local'
                  value={formData.startsAt}
                  onChange={handleChange}
                  className='input-field'
               />
            </div>

            <div>
               <label
                  htmlFor='endsAt'
                  className='block text-sm font-medium text-gray-300 mb-2'
               >
                  End Date (optional)
               </label>
               <input
                  id='endsAt'
                  name='endsAt'
                  type='datetime-local'
                  value={formData.endsAt}
                  onChange={handleChange}
                  className={`input-field ${
                     errors.endsAt ? "border-danger-light focus:ring-danger-light" : ""
                  }`}
               />
               {errors.endsAt && (
                  <p className='mt-1 text-sm text-danger-light'>{errors.endsAt}</p>
               )}
            </div>
         </div>

         <div className='flex justify-end space-x-4 pt-4'>
            <button
               type='button'
               onClick={onCancel}
               className='btn-secondary'
               disabled={isLoading}
            >
               Cancel
            </button>
            <button type='submit' className='btn-primary' disabled={isLoading}>
               {isLoading
                  ? "Saving..."
                  : competition
                  ? "Update Competition"
                  : "Create Competition"}
            </button>
         </div>
      </form>
   )
}
