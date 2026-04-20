import axios from 'axios'

const API_BASE =
    import.meta.env.VITE_API_URL || 'https://infinistock-backend.onrender.com/api'

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api
