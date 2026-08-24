import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import DepositsView from '../views/DepositsView.vue'
import WithdrawalsView from '../views/WithdrawalsView.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: DashboardView },
        { path: 'users', name: 'users', component: UsersView },
        { path: 'deposits', name: 'deposits', component: DepositsView },
        { path: 'withdrawals', name: 'withdrawals', component: WithdrawalsView },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const requiresAuth = to.meta.requiresAuth ?? to.matched.some((r) => r.meta.requiresAuth)
  if (requiresAuth && !isAuthenticated()) {
    return { name: 'login' }
  }
  if (to.name === 'login' && isAuthenticated()) {
    return { name: 'home' }
  }
})

export default router
