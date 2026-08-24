import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../auth'
import LoginView from '../views/LoginView.vue'
import HomePlaceholderView from '../views/HomePlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePlaceholderView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
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
