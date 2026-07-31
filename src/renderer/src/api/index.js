import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default {
  auth: {
    login: (username, password) => api.post('/auth/login', { username, password }),
    updatePassword: (newPassword) => api.post('/auth/update-password', { newPassword })
  },

  customer: {
    list: (params) => api.get('/customers', { params }),
    get: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (data) => api.put(`/customers/${data.id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
    search: (keyword) => api.get('/customers/search', { params: { keyword } }),
    stats: () => api.get('/customers/stats')
  },

  product: {
    list: (params) => api.get('/products', { params }),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
  },

  order: {
    list: (params) => api.get('/orders', { params }),
    get: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    updateStatus: (id, status, operator) => api.put(`/orders/${id}`, { status, operator }),
    stats: () => api.get('/orders/stats')
  },

  stats: {
    dashboard: () => api.get('/stats/dashboard'),
    trends: (days = 7) => api.get('/stats/trends', { params: { days } }),
    distributions: (days = 0) => api.get('/stats/distributions', { params: { days } }),
    productsRanking: (limit = 10, days = 0) => api.get('/stats/products/ranking', { params: { limit, days } }),
    hourly: (days = 0) => api.get('/stats/hourly', { params: { days } }),
    priceDistribution: (days = 0) => api.get('/stats/price-distribution', { params: { days } })
  },

  delivery: {
    stats: () => api.get('/delivery/stats')
  },

  settings: {
    get: () => api.get('/settings'),
    save: (settings) => {
      const promises = Object.entries(settings).map(([key, value]) =>
        api.post('/settings', { key, value })
      )
      return Promise.all(promises)
    }
  },

  app: {
    info: () => api.get('/app/info')
  }
}
