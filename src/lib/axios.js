import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds (AI generation takes time)
  withCredentials: true, // send refreshToken cookie on every request
})

// Request interceptor — attach JWT
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('study_buddy_token') || sessionStorage.getItem('study_buddy_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Track whether a token refresh is in-flight to avoid loops
let isRefreshing = false
let pendingRequests = []

const processQueue = (error, token = null) => {
  pendingRequests.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  pendingRequests = []
}

// Response interceptor — auto-refresh on 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh for 401 errors, and not for the refresh or login endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh — uses the httpOnly refreshToken cookie automatically
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const { accessToken } = res.data?.data || res.data

        // Persist the new access token
        if (localStorage.getItem('study_buddy_token')) {
          localStorage.setItem('study_buddy_token', accessToken)
        } else {
          sessionStorage.setItem('study_buddy_token', accessToken)
        }

        axiosClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)
        return axiosClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('study_buddy_token')
        sessionStorage.removeItem('study_buddy_token')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    console.error('API Error Response:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default axiosClient
