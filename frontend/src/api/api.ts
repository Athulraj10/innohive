import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios"
import { TOKEN_STORAGE_KEY } from "../constants/storage"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

const api: AxiosInstance = axios.create({
   baseURL: API_BASE_URL,
   headers: {
      "Content-Type": "application/json",
   },
   timeout: 30000,
})

api.interceptors.request.use(
   (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (token && config.headers) {
         config.headers.Authorization = `Bearer ${token}`
      }
      return config
   },
   (error) => {
      return Promise.reject(error)
   }
)

api.interceptors.response.use(
   (response: AxiosResponse) => {
      if (
         response.data &&
         typeof response.data === "object" &&
         "success" in response.data
      ) {
         if (response.data.success) {
            if (response.data.data !== undefined && response.data.meta !== undefined) {
               return {
                  ...response,
                  data: { data: response.data.data, meta: response.data.meta },
               }
            }
            if (response.data.data !== undefined) {
               return { ...response, data: response.data.data }
            }
         }
         if (!response.data.success && response.data.error) {
            const error: any = new Error(response.data.error.message || "Request failed")
            error.response = {
               ...response,
               data: response.data.error,
            }
            return Promise.reject(error)
         }
      }
      return response
   },
   (error) => {
      if (error.response?.status === 401) {
         const requestUrl = error.config?.url || ''
        if (!requestUrl.includes('/auth/me')) {
            // localStorage.removeItem(TOKEN_STORAGE_KEY)
         }
      }

      if (error.response?.data?.error) {
         const errorData = error.response.data.error
         error.response.data = {
            error: errorData.message || errorData,
            code: errorData.code,
            fields: errorData.fields,
         }
      }

      return Promise.reject(error)
   }
)

export default api
