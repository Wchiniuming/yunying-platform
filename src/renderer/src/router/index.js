import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue')
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/OrderCreate.vue')
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue')
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/Customers.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue')
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: () => import('@/views/CustomerDetail.vue')
      },
      {
        path: 'delivery',
        name: 'Delivery',
        component: () => import('@/views/Delivery.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue')
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('@/views/Tags.vue')
      },
      {
        path: 'cost/procurements',
        name: 'CostProcurements',
        component: () => import('@/views/CostProcurements.vue')
      },
      {
        path: 'cost/materials',
        name: 'CostMaterials',
        component: () => import('@/views/CostMaterials.vue')
      },
      {
        path: 'cost/suppliers',
        name: 'CostSuppliers',
        component: () => import('@/views/CostSuppliers.vue')
      },
      {
        path: 'cost/records',
        name: 'CostRecords',
        component: () => import('@/views/CostRecords.vue')
      },
      {
        path: 'cost/analysis',
        name: 'CostAnalysis',
        component: () => import('@/views/CostAnalysis.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router
