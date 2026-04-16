<template>
  <div class="home">
    <!-- 导航栏 -->
    <nav class="navbar" :class="{ 'scrolled': isScrolled }">
      <div class="nav-container">
        <div class="nav-logo">東方夢蝶譚</div>
        <div class="nav-menu">
          <a @click="scrollToSection('hero')" class="nav-link">首页</a>
          <a @click="scrollToSection('story')" class="nav-link">故事</a>
          <a @click="scrollToSection('characters')" class="nav-link">角色</a>
          <a @click="scrollToSection('experience')" class="nav-link">体验</a>
          <a @click="scrollToSection('news')" class="nav-link">资讯</a>
          <!-- 管理员专属：后台管理 -->
          <a v-if="userStore.isAdmin" @click="$router.push('/admin')" class="nav-link admin-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            后台管理
          </a>
          <a @click="handleUserIconClick" class="nav-link user-icon">
            <!-- 已登录显示头像，未登录显示默认图标 -->
            <div v-if="userStore.token && userAvatar" class="user-avatar">
              <img :src="userAvatar" alt="用户头像" @error="handleAvatarError" />
            </div>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </a>
        </div>
      </div>
    </nav>

    <!-- 登录弹窗 -->
    <div class="modal-overlay" v-if="showLoginModal" @click="showLoginModal = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showLoginModal = false">×</button>
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="form.username" type="text" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" required />
          </div>
          <div class="form-group" v-if="!isLogin">
            <label>确认密码</label>
            <input v-model="form.confirmPassword" type="password" required />
          </div>
          <button type="submit" class="btn btn-primary">
            {{ isLogin ? '登录' : '注册' }}
          </button>
        </form>
        <p class="toggle-mode">
          {{ isLogin ? '还没有账号？' : '已有账号？' }}
          <a @click="isLogin = !isLogin">{{ isLogin ? '注册' : '登录' }}</a>
        </p>
      </div>
    </div>

    <!-- 主视觉区 -->
    <section id="hero" class="hero">
      <div class="hero-background"></div>
      <div class="hero-content">
        <h1 class="game-title">東方夢蝶譚</h1>
        <p class="game-subtitle">在異變的世界中，尋找真相</p>
      </div>
      <div class="scroll-indicator" @click="scrollToSection('story')">
        <span>▼</span>
      </div>
    </section>

    <!-- 游戏简介 -->
    <section id="story" class="game-info">
      <h2>游戏简介</h2>
      <div class="info-content">
        <div class="info-block">
          <h3>前言</h3>
          <p>在本次游戏的创作中，由于故事发生在相似但不相同的幻想乡世界，因此角色的能力也会有所不同，但与原作依然会有联系。</p>
        </div>
        <div class="info-block">
          <h3>序章</h3>
          <p>妖梦在梦中所看到的场景，是其中一种结局的展现，那是通过一个BE的世界的妖梦与本世界妖梦的共鸣所产生的。序章的游玩方面安排了妖梦在白玉楼中的日常活动，比如练习剑术，给幽幽子做早饭，打扫卫生修剪庭院...</p>
        </div>
      </div>
    </section>

    <!-- 章节预览 -->
    <section class="chapters">
      <h2>章节预览</h2>
      <div class="chapter-grid">
        <div class="chapter-card" v-for="chapter in chapters" :key="chapter.id">
          <div class="chapter-number">{{ chapter.title }}</div>
          <p class="chapter-desc">{{ chapter.description }}</p>
        </div>
      </div>
    </section>

    <!-- 角色介绍 - 轮播式 -->
    <section id="characters" class="characters-section">
      <h2>角色介绍</h2>
      <div class="character-carousel">
        <button class="carousel-btn prev" @click="prevCharacter" :disabled="currentCharIndex === 0">
          ‹
        </button>
        
        <div class="character-display">
          <transition name="slide" mode="out-in">
            <div class="character-content" :key="currentCharacter.id">
              <div class="character-image">
                <div class="image-placeholder">
                  {{ currentCharacter.name }}
                </div>
              </div>
              <div class="character-info">
                <h3>{{ currentCharacter.name }}</h3>
                <p>{{ currentCharacter.description }}</p>
              </div>
            </div>
          </transition>
        </div>
        
        <button class="carousel-btn next" @click="nextCharacter" :disabled="currentCharIndex === characters.length - 1">
          ›
        </button>
      </div>
      
      <div class="carousel-dots">
        <span 
          v-for="(char, index) in characters" 
          :key="char.id"
          class="dot"
          :class="{ active: index === currentCharIndex }"
          @click="currentCharIndex = index"
        ></span>
      </div>
    </section>

    <!-- 体验剧情 -->
    <section id="experience" class="experience-section">
      <div class="experience-content">
        <h2>体验剧情</h2>
        <p class="experience-desc">立即体验游戏中的文字互动系统，感受妖梦的冒险旅程</p>
        <button class="btn-experience" @click="handleStartStory">
          <span>开始体验</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </section>

    <!-- 游戏资讯 -->
    <section id="news" class="news-section">
      <h2>游戏资讯</h2>
      <div class="news-list">
        <div class="news-item" v-for="news in newsList.slice(0, 2)" :key="news.id">
          <div class="news-date">{{ news.date }}</div>
          <h3>{{ news.title }}</h3>
          <p>{{ news.content }}</p>
        </div>
      </div>
      <div class="more-news-btn-container">
        <button class="more-news-btn" @click="$router.push('/community')">
          更多资讯
          <span class="arrow">→</span>
        </button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer">
      <p>© 2024 东方梦蝶谭 - 东方Project同人游戏</p>
      <p>本作品为非商业性质的同人创作</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { userApi } from '../api/user'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isScrolled = ref(false)
const currentCharIndex = ref(0)
const showLoginModal = ref(false)
const isLogin = ref(true)
const userAvatar = ref('')
const form = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const chapters = [
  { id: 0, title: '序章', description: '妖梦在白玉楼的日常，以及命运的转折...' },
  { id: 1, title: '第一章', description: '异变降临，破败的白玉楼中的探索' },
  { id: 2, title: '第二章', description: '前往博丽神社，寻求帮助的旅程' },
  { id: 3, title: '第三章', description: '魔法之森的秘密与净化之力' }
]

const characters = [
  {
    id: 1,
    name: '魂魄妖梦',
    description: '白玉楼的庭师兼剑术指导，半人半灵的存在。在异变中被卷入另一个世界，通过卷轴与另一个世界的自己灵魂互换。她必须在这个陌生而危险的世界中寻找真相。'
  },
  {
    id: 2,
    name: '博丽灵梦',
    description: '博丽神社的巫女，幻想乡的异变解决者。在这个世界中受到了异变的影响，短暂恢复清醒后为妖梦指出了异变走过的路线。'
  },
  {
    id: 3,
    name: '琪露诺',
    description: '冰之妖精，在这个世界中成为了贤者，拥有着不同寻常的力量。她的分身救下了妖梦，并带领她前往人间之里，为妖梦讲述异变的情况。'
  }
]

const newsList = ref([])

// 从后端加载资讯
const loadNews = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/news')
    if (response.data.success) {
      newsList.value = response.data.news.map(news => ({
        id: news.id,
        date: news.publish_date,
        title: news.title,
        content: news.content
      }))
    }
  } catch (error) {
    console.error('加载资讯失败:', error)
    // 使用默认数据
    newsList.value = [
      {
        id: 1,
        date: '2024-03-01',
        title: 'Demo版本开发中',
        content: '游戏目前处于Demo开发阶段，序章和第一章的内容正在制作中。我们正在努力打磨游戏体验，为玩家呈现一个精彩的故事。'
      }
    ]
  }
}

// 加载用户信息（包括头像）
const loadUserInfo = async () => {
  if (!userStore.token) {
    return
  }
  
  try {
    const response = await userApi.getUserInfo()
    if (response.success && response.user) {
      // 更新 store 中的用户信息
      userStore.setUser(response.user)
      
      // 如果有头像，设置头像
      if (response.user.avatar) {
        // 如果头像是相对路径，转换为完整URL
        if (response.user.avatar.startsWith('http')) {
          userAvatar.value = response.user.avatar
          userStore.setAvatar(response.user.avatar)
        } else {
          const fullAvatarUrl = `http://localhost:3000${response.user.avatar}`
          userAvatar.value = fullAvatarUrl
          userStore.setAvatar(fullAvatarUrl)
        }
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 处理头像加载错误
const handleAvatarError = () => {
  console.error('头像加载失败')
  userAvatar.value = '' // 清空头像，显示默认图标
}

const currentCharacter = computed(() => characters[currentCharIndex.value])

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const prevCharacter = () => {
  if (currentCharIndex.value > 0) {
    currentCharIndex.value--
  }
}

const nextCharacter = () => {
  if (currentCharIndex.value < characters.length - 1) {
    currentCharIndex.value++
  }
}

const handleSubmit = async () => {
  try {
    if (isLogin.value) {
      const res = await userApi.login({
        username: form.value.username,
        password: form.value.password
      })
      
      // 先设置token
      userStore.setToken(res.token)
      
      // 再设置用户信息（包括isAdmin）
      userStore.setUser(res.user)
      
      // 关闭登录弹窗
      showLoginModal.value = false
      
      // 登录成功后加载用户信息（包括头像）
      await loadUserInfo()
      
      // 检查是否有重定向路径
      const route = router.currentRoute.value
      const redirectPath = route.query.redirect
      
      // 使用nextTick确保状态更新完成后再跳转
      await nextTick()
      
      // 如果是管理员，跳转到管理后台
      if (res.user.isAdmin) {
        alert('管理员登录成功')
        // 使用setTimeout确保localStorage已经写入
        setTimeout(() => {
          router.push('/admin')
        }, 100)
      } else if (redirectPath) {
        // 如果有重定向路径，跳转到该路径
        alert('登录成功')
        router.push(redirectPath)
      } else {
        alert('登录成功')
      }
    } else {
      if (form.value.password !== form.value.confirmPassword) {
        alert('两次密码不一致')
        return
      }
      await userApi.register({
        username: form.value.username,
        password: form.value.password
      })
      alert('注册成功，请登录')
      isLogin.value = true
      form.value.confirmPassword = ''
    }
  } catch (error) {
    alert(error.response?.data?.message || '操作失败')
  }
}

// 处理开始体验剧情
const handleStartStory = () => {
  // 检查是否已登录
  if (!userStore.token) {
    alert('请先登录账号才能体验剧情')
    showLoginModal.value = true
    return
  }
  // 已登录，跳转到剧情页面
  router.push('/story')
}

// 跳转到个人中心
const goToProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}

// 退出登录
const handleLogout = () => {
  showUserMenu.value = false
  userStore.logout()
  userAvatar.value = '' // 清空头像
  alert('已退出登录')
}

// 处理用户图标点击
const handleUserIconClick = () => {
  if (userStore.token) {
    // 已登录，跳转到个人中心
    router.push('/profile')
  } else {
    // 未登录，显示登录弹窗
    showLoginModal.value = true
  }
}

const handleScroll = () => {
  const heroHeight = window.innerHeight
  const scrollY = window.scrollY
  
  // 当滚动超过第一屏的80%时开始显示导航栏背景
  if (scrollY > heroHeight * 0.8) {
    isScrolled.value = true
  } else {
    isScrolled.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  loadNews()
  loadUserInfo() // 加载用户信息（如果已登录）
  
  // 检查是否需要显示登录弹窗
  checkNeedLogin()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 检查是否需要显示登录弹窗
const checkNeedLogin = () => {
  if (route.query.needLogin === 'true' && !userStore.isLoggedIn) {
    alert('请先登录')
    showLoginModal.value = true
    // 清除URL参数，避免刷新时重复弹出
    router.replace({ name: 'home' })
  }
}

// 监听路由查询参数变化
watch(() => route.query.needLogin, (newVal) => {
  if (newVal === 'true' && !userStore.isLoggedIn) {
    checkNeedLogin()
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: transparent;
  z-index: 1000;
  padding: 1.5rem 0;
  transition: all 0.5s ease;
  opacity: 0;
  pointer-events: none;
}

.navbar.scrolled {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  opacity: 1;
  pointer-events: auto;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  transition: color 0.3s;
  cursor: pointer;
  font-size: 1rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-link:hover {
  color: #4ecdc4;
}

.admin-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(102, 126, 234, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.5);
  transition: all 0.3s;
}

.admin-link:hover {
  background: rgba(102, 126, 234, 0.4);
  border-color: rgba(102, 126, 234, 0.8);
  color: #fff;
  transform: translateY(-2px);
}

.admin-link svg {
  flex-shrink: 0;
}

.user-icon {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s;
}

.user-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.user-avatar:hover {
  border-color: #4ecdc4;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-icon:hover {
  background: rgba(78, 205, 196, 0.2);
}

.user-icon svg {
  display: block;
}

/* 主视觉区 */
.hero {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/img/fm.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.hero-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
}

.hero-content {
  max-width: 800px;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.game-title {
  font-size: 4rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  animation: fadeInUp 1s ease;
}

.game-subtitle {
  font-size: 1.5rem;
  margin-bottom: 0;
  opacity: 0.9;
  animation: fadeInUp 1s ease 0.2s backwards;
}

.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 2rem;
  animation: bounce 2s infinite;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 游戏简介 */
.game-info {
  padding: 6rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: #f9f9f9;
}

.game-info h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #333;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-block h3 {
  font-size: 1.5rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.info-block p {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #666;
}

/* 章节预览 */
.chapters {
  padding: 6rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.chapters h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #333;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.chapter-card {
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.chapter-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0,0,0,0.15);
}

.chapter-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 1rem;
}

.chapter-desc {
  color: #666;
  line-height: 1.6;
}

/* 角色介绍轮播 */
.characters-section {
  min-height: 100vh;
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.characters-section h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: white;
}

.character-carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.carousel-btn {
  background: rgba(255,255,255,0.2);
  border: 2px solid white;
  color: white;
  font-size: 3rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.4);
  transform: scale(1.1);
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.character-display {
  flex: 1;
  max-width: 800px;
}

.character-content {
  display: flex;
  gap: 3rem;
  align-items: center;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 20px;
}

.character-image {
  flex-shrink: 0;
}

.image-placeholder {
  width: 300px;
  height: 400px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  border: 2px solid rgba(255,255,255,0.3);
}

.character-info {
  flex: 1;
  color: white;
}

.character-info h3 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.character-info p {
  font-size: 1.1rem;
  line-height: 1.8;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  cursor: pointer;
  transition: all 0.3s;
}

.dot.active {
  background: white;
  transform: scale(1.3);
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 体验剧情 */
.experience-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.experience-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('/img/fm.png') center/cover;
  opacity: 0.1;
  z-index: 0;
}

.experience-content {
  text-align: center;
  color: white;
  z-index: 1;
  position: relative;
  padding: 2rem;
}

.experience-content h2 {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.experience-desc {
  font-size: 1.3rem;
  margin-bottom: 3rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.btn-experience {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid white;
  color: white;
  padding: 1.2rem 3rem;
  font-size: 1.3rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn-experience:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.btn-experience svg {
  transition: transform 0.3s;
}

.btn-experience:hover svg {
  transform: translateX(5px);
}

/* 游戏资讯 */
.news-section {
  padding: 6rem 2rem;
  background: #f9f9f9;
}

.news-section h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #333;
}

.news-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.news-item {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.news-date {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.news-item h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
}

.news-item p {
  color: #666;
  line-height: 1.6;
}

.more-news-btn-container {
  max-width: 800px;
  margin: 3rem auto 0;
  display: flex;
  justify-content: flex-end;
}

.more-news-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
}

.more-news-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.5);
}

.more-news-btn .arrow {
  font-size: 1.3rem;
  transition: transform 0.3s;
}

.more-news-btn:hover .arrow {
  transform: translateX(5px);
}

/* 页脚 */
.footer {
  background: #1a1a2e;
  color: white;
  text-align: center;
  padding: 3rem 2rem;
}

.footer p {
  margin: 0.5rem 0;
  opacity: 0.8;
}

/* 响应式 */
@media (max-width: 768px) {
  .game-title {
    font-size: 2.5rem;
  }
  
  .character-content {
    flex-direction: column;
    text-align: center;
  }
  
  .nav-menu {
    gap: 1rem;
    font-size: 0.9rem;
  }
  
  .chapter-grid {
    grid-template-columns: 1fr;
  }
}

/* 登录弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: slideUp 0.3s ease;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-content h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.toggle-mode {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.toggle-mode a {
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
