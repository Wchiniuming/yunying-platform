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
    updatePassword: (newPassword) => {
      const userId = localStorage.getItem('userId')
      return api.post('/auth/update-password', { userId, newPassword })
    }
  },

  customer: {
    list: (params) => api.get('/customers', { params }),
    get: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (data) => api.put(`/customers/${data.id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
    search: (keyword) => api.get('/customers/search', { params: { keyword } }),
    stats: () => api.get('/customers/stats'),
    getTags: (id) => api.get(`/customers/${id}/tags`),
    updateTags: (id, tag_ids) => {
      let clean = tag_ids
      if (tag_ids && typeof tag_ids === 'object' && !Array.isArray(tag_ids) && 'tag_ids' in tag_ids) {
        clean = tag_ids.tag_ids
      }
      return api.put(`/customers/${id}/tags`, { tag_ids: clean })
    }
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
    delete: (id) => api.delete(`/orders/${id}`),
    stats: () => api.get('/orders/stats'),
    getTags: (id) => api.get(`/orders/${id}/tags`),
    updateTags: (id, tag_ids) => {
      let clean = tag_ids
      if (tag_ids && typeof tag_ids === 'object' && !Array.isArray(tag_ids) && 'tag_ids' in tag_ids) {
        clean = tag_ids.tag_ids
      }
      return api.put(`/orders/${id}/tags`, { tag_ids: clean })
    }
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

  tags: {
    list: (params) => api.get('/tags', { params }),
    create: (data) => api.post('/tags', data),
    update: (id, data) => api.put(`/tags/${id}`, data),
    delete: (id) => api.delete(`/tags/${id}`)
  },

  supplier: {
    list: (params) => api.get('/suppliers', { params }),
    get: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`)
  },

  material: {
    list: (params) => api.get('/materials', { params }),
    get: (id) => api.get(`/materials/${id}`),
    create: (data) => api.post('/materials', data),
    update: (id, data) => api.put(`/materials/${id}`, data),
    delete: (id) => api.delete(`/materials/${id}`),
    adjustStock: (id, data) => api.post(`/materials/${id}/adjust-stock`, data)
  },

  procurement: {
    list: (params) => api.get('/procurements', { params }),
    create: (data) => api.post('/procurements', data),
    update: (id, data) => api.put(`/procurements/${id}`, data),
    delete: (id) => api.delete(`/procurements/${id}`),
    import: (rows) => api.post('/procurements/import', { rows })
  },

  costRecord: {
    list: (params) => api.get('/cost-records', { params }),
    create: (data) => api.post('/cost-records', data),
    update: (id, data) => api.put(`/cost-records/${id}`, data),
    delete: (id) => api.delete(`/cost-records/${id}`)
  },

  costStats: {
    summary: (range) => api.get('/stats/cost', { params: { range } })
  },

  app: {
    info: () => api.get('/app/info')
  },

  data: {
    export: () => api.post('/data/export'),
    backup: () => api.post('/data/backup'),
    clearCache: () => api.delete('/data/clear-cache')
  }
}
