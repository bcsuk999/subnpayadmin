import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../auth'
import LoginView from '../views/LoginView.vue'
import HomePlaceholderView from '../views/HomePlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePlaceholderView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'login' && isAuthenticated()) {
    return { name: 'home' }
  }
})

export default router
