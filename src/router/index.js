import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/story',
      name: 'story',
      component: () => import('../views/StoryMode.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/Admin.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('../views/Community.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（浏览器前进/后退），使用保存的位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到页面顶部
    return { top: 0, behavior: 'smooth' }
  }
})

// 路由守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore()
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 未登录，跳转到首页
    // 使用 query 参数传递需要登录的信息
    return { 
      name: 'home',
      query: { needLogin: 'true', redirect: to.fullPath }
    }
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin) {
    // 从localStorage直接读取，确保刷新后也能正确判断
    const isAdminValue = localStorage.getItem('isAdmin')
    const hasToken = localStorage.getItem('token')
    
    // 兼容多种格式：'true', '1', 1, true
    const isAdmin = isAdminValue === 'true' || isAdminValue === '1' || isAdminValue === 1 || isAdminValue === true
    
    if (!hasToken || !isAdmin) {
      alert('需要管理员权限')
      return { name: 'home' }
    }
  }
  
  // 允许导航
  return true
})

export default router
