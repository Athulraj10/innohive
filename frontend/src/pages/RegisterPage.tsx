import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { register } from "../api/auth"
import { RegisterRequest, ApiError } from "../types/api"
import { toast } from "react-toastify"

export const RegisterPage = () => {
   const navigate = useNavigate()
   const [formData, setFormData] = useState<RegisterRequest>({
      name: "",
      email: "",
      password: "",
   })
   const [errors, setErrors] = useState<Record<string, string>>({})
   const [isLoading, setIsLoading] = useState(false)

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, [name]: "" }))
   }

   const validate = (): boolean => {
      const newErrors: Record<string, string> = {}

      if (!formData.name.trim()) {
         newErrors.name = "Name is required"
      } else if (formData.name.trim().length < 2) {
         newErrors.name = "Name must be at least 2 characters"
      }

      if (!formData.email) {
         newErrors.email = "Email is required"
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
         newErrors.email = "Please provide a valid email"
      }

      if (!formData.password) {
         newErrors.password = "Password is required"
      } else if (formData.password.length < 8) {
         newErrors.password = "Password must be at least 8 characters"
      } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
         newErrors.password = "Password must contain at least one letter and one number"
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) {
         return
      }

      setIsLoading(true)
      try {
         await register(formData)
         toast.success("Account created successfully! Please login.")
         navigate("/login")
      } catch (error: any) {
         const apiError = error.response?.data as ApiError

         if (apiError?.fields) {
            const fieldErrors: Record<string, string> = {}
            Object.keys(apiError.fields).forEach((field) => {
               fieldErrors[field] = apiError.fields![field][0]
            })
            setErrors(fieldErrors)
            toast.error("Please fix the errors in the form")
         } else if (
            apiError?.error?.includes("Email") ||
            apiError?.error?.includes("email")
         ) {
            setErrors({ email: apiError.error })
            toast.error(apiError.error)
         } else {
            toast.error(apiError?.error || "Registration failed. Please try again.")
         }
      } finally {
         setIsLoading(false)
      }
   }

   return (
      <div className='min-h-screen flex items-center justify-center bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
         <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow' />
            <div
               className='absolute bottom-0 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow'
               style={{ animationDelay: "1s" }}
            />
         </div>

         <div className='max-w-md w-full space-y-8 relative z-10 animate-fade-in'>
            <div className='text-center'>
               <div className='flex justify-center mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow'>
                     <span className='text-white font-bold text-2xl'>T</span>
                  </div>
               </div>
               <h2 className='text-3xl font-extrabold text-gray-100 mb-2'>
                  Create Account
               </h2>
               <p className='text-gray-400'>Join the trading competition platform</p>
            </div>

            <div className='card'>
               <form className='space-y-6' onSubmit={handleSubmit}>
                  <div className='space-y-4'>
                     <div>
                        <label
                           htmlFor='name'
                           className='block text-sm font-medium text-gray-300 mb-2'
                        >
                           Full Name
                        </label>
                        <input
                           id='name'
                           name='name'
                           type='text'
                           autoComplete='name'
                           required
                           value={formData.name}
                           onChange={handleChange}
                           className={`input-field ${
                              errors.name
                                 ? "border-danger-light focus:ring-danger-light"
                                 : ""
                           }`}
                           placeholder='username'
                        />
                        {errors.name && (
                           <p className='mt-1 text-sm text-danger-light animate-slide-down'>
                              {errors.name}
                           </p>
                        )}
                     </div>
                     <div>
                        <label
                           htmlFor='email'
                           className='block text-sm font-medium text-gray-300 mb-2'
                        >
                           Email address
                        </label>
                        <input
                           id='email'
                           name='email'
                           type='email'
                           autoComplete='email'
                           required
                           value={formData.email}
                           onChange={handleChange}
                           className={`input-field ${
                              errors.email
                                 ? "border-danger-light focus:ring-danger-light"
                                 : ""
                           }`}
                           placeholder='you@gmail.com'
                        />
                        {errors.email && (
                           <p className='mt-1 text-sm text-danger-light animate-slide-down'>
                              {errors.email}
                           </p>
                        )}
                     </div>
                     <div>
                        <label
                           htmlFor='password'
                           className='block text-sm font-medium text-gray-300 mb-2'
                        >
                           Password
                        </label>
                        <input
                           id='password'
                           name='password'
                           type='password'
                           autoComplete='new-password'
                           required
                           value={formData.password}
                           onChange={handleChange}
                           className={`input-field ${
                              errors.password
                                 ? "border-danger-light focus:ring-danger-light"
                                 : ""
                           }`}
                           placeholder='Min 8 chars, 1 letter, 1 number'
                        />
                        {errors.password && (
                           <p className='mt-1 text-sm text-danger-light animate-slide-down'>
                              {errors.password}
                           </p>
                        )}
                        <p className='mt-1 text-xs text-gray-500'>
                           Must be at least 8 characters with one letter and one number
                        </p>
                     </div>
                  </div>

                  <div>
                     <button
                        type='submit'
                        disabled={isLoading}
                        className='btn-primary w-full text-base py-3'
                     >
                        {isLoading ? (
                           <span className='flex items-center justify-center'>
                              <svg
                                 className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                                 xmlns='http://www.w3.org/2000/svg'
                                 fill='none'
                                 viewBox='0 0 24 24'
                              >
                                 <circle
                                    className='opacity-25'
                                    cx='12'
                                    cy='12'
                                    r='10'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                 ></circle>
                                 <path
                                    className='opacity-75'
                                    fill='currentColor'
                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                 ></path>
                              </svg>
                              Creating account...
                           </span>
                        ) : (
                           "Create Account"
                        )}
                     </button>
                  </div>

                  <div className='text-center'>
                     <p className='text-sm text-gray-400'>
                        Already have an account?{" "}
                        <Link
                           to='/login'
                           className='font-semibold text-primary-400 hover:text-primary-300 transition-colors'
                        >
                           Sign in
                        </Link>
                     </p>
                  </div>
               </form>
            </div>
         </div>
      </div>
   )
}
