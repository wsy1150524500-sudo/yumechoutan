import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 从localStorage恢复状态
  const storedToken = localStorage.getItem('token') || ''
  const storedIsAdmin = localStorage.getItem('isAdmin') === 'true'
  const storedUserId = localStorage.getItem('userId') || null
  const storedUsername = localStorage.getItem('username') || ''
  
  const user = ref(null)
  const token = ref(storedToken)
  const isAdmin = ref(storedIsAdmin)
  const userId = ref(storedUserId)
  const username = ref(storedUsername)
  const avatar = ref('')
  
  // 计算属性：是否已登录
  const isLoggedIn = computed(() => !!token.value)
  
  function setUser(userData) {
    user.value = userData
    if (userData) {
      userId.value = userData.id
      username.value = userData.username
      localStorage.setItem('userId', userData.id)
      localStorage.setItem('username', userData.username)
      
      if (userData.isAdmin !== undefined) {
        isAdmin.value = userData.isAdmin
        // 确保存储为字符串 'true' 或 'false'
        localStorage.setItem('isAdmin', String(!!userData.isAdmin))
      }
    }
  }
  
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  
  function setAvatar(avatarUrl) {
    avatar.value = avatarUrl
  }
  
  function logout() {
    user.value = null
    token.value = ''
    isAdmin.value = false
    userId.value = null
    username.value = ''
    avatar.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
  }
  
  return { 
    user, 
    token, 
    isAdmin, 
    userId, 
    username, 
    avatar, 
    isLoggedIn,
    setUser, 
    setToken, 
    setAvatar,
    logout 
  }
})
