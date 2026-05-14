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

    <!-- 主视觉区 - 视差 -->
    <section id="hero" class="hero">
      <div class="parallax-bg" ref="parallaxBg"></div>
      <div class="parallax-stars" ref="parallaxStars"></div>
      <div class="parallax-mid" ref="parallaxMid"></div>
      <div class="hero-content">
        <h1 class="game-title">東方夢蝶譚</h1>
        <p class="game-subtitle">在異變的世界中，尋找真相</p>
      </div>
      <div class="scroll-indicator" @click="scrollToSection('story')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
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

    <!-- 角色介绍 - 卡片式切换 -->
    <section id="characters" class="characters-section">
      <h2 class="section-title-light">角色介绍</h2>
      <div class="char-tabs">
        <button 
          v-for="(char, index) in characters" 
          :key="char.id"
          class="char-tab"
          :class="{ active: currentCharIndex === index }"
          @click="currentCharIndex = index"
        >
          {{ char.name }}
        </button>
      </div>
      <transition name="char-fade" mode="out-in">
        <div class="char-detail" :key="currentCharacter.id">
          <div class="char-img">
            <img :src="currentCharacter.image" :alt="currentCharacter.name" />
          </div>
          <div class="char-info">
            <h3>{{ currentCharacter.name }}</h3>
            <p>{{ currentCharacter.description }}</p>
          </div>
        </div>
      </transition>
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
const parallaxBg = ref(null)
const parallaxStars = ref(null)
const parallaxMid = ref(null)
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
    image: '/img/yaomeng.png',
    description: '白玉楼的庭师兼剑术指导，半人半灵的存在。在异变中被卷入另一个世界，通过卷轴与另一个世界的自己灵魂互换。她必须在这个陌生而危险的世界中寻找真相。'
  },
  {
    id: 2,
    name: '博丽灵梦',
    image: '/img/bllm.jpg',
    description: '博丽神社的巫女，幻想乡的异变解决者。在这个世界中受到了异变的影响，短暂恢复清醒后为妖梦指出了异变走过的路线。'
  },
  {
    id: 3,
    name: '琪露诺',
    image: '/img/qln.jpg',
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
  
  // 视差滚动效果
  if (scrollY < heroHeight * 1.5) {
    if (parallaxBg.value) parallaxBg.value.style.transform = `translateY(${scrollY * 0.3}px)`
    if (parallaxStars.value) parallaxStars.value.style.transform = `translateY(${scrollY * 0.5}px)`
    if (parallaxMid.value) parallaxMid.value.style.transform = `translateY(${scrollY * 0.7}px)`
  }
}

// 初始化视差粒子效果
const initParallaxParticles = () => {
  // 生成星星
  if (parallaxStars.value) {
    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      star.style.left = Math.random() * 100 + '%'
      star.style.top = Math.random() * 100 + '%'
      star.style.animationDelay = Math.random() * 3 + 's'
      star.style.width = star.style.height = (Math.random() * 2 + 1) + 'px'
      parallaxStars.value.appendChild(star)
    }
  }
  // 生成花瓣
  if (parallaxMid.value) {
    for (let i = 0; i < 15; i++) {
      const petal = document.createElement('div')
      petal.className = 'floating-petal'
      petal.style.left = Math.random() * 100 + '%'
      petal.style.top = (Math.random() * 100 + 100) + '%'
      petal.style.animationDelay = Math.random() * 8 + 's'
      petal.style.animationDuration = (6 + Math.random() * 6) + 's'
      parallaxMid.value.appendChild(petal)
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  loadNews()
  loadUserInfo() // 加载用户信息（如果已登录）
  
  // 检查是否需要显示登录弹窗
  checkNeedLogin()
  
  // 初始化视差粒子
  initParallaxParticles()
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
  background: #000000;
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1.5rem 0;
  transition: all 0.5s ease;
  opacity: 0;
  pointer-events: none;
}

.navbar.scrolled {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(12px);
  padding: 1rem 0;
  box-shadow: 0 2px 20px rgba(124, 58, 237, 0.2);
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
  color: #ffffff;
  font-size: 1.6rem;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: rgba(226, 232, 240, 0.8);
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 0;
}

.nav-link:hover {
  color: #ffffff;
}

.admin-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(124, 58, 237, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(124, 58, 237, 0.4);
  transition: all 0.3s;
}

.admin-link:hover {
  background: rgba(124, 58, 237, 0.3);
  border-color: rgba(124, 58, 237, 0.7);
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
  background: rgba(167, 139, 250, 0.2);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(167, 139, 250, 0.6);
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.user-avatar:hover {
  border-color: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-icon svg {
  display: block;
}

/* 主视觉区 - 视差 */
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

.parallax-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  background: url('/img/fm.png') center/cover no-repeat;
  transform: translateY(0);
  will-change: transform;
}

.parallax-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(15,15,35,0.3) 0%, rgba(26,10,46,0.5) 50%, rgba(15,15,35,0.9) 100%);
}

.parallax-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  will-change: transform;
}

.parallax-mid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  will-change: transform;
}

:deep(.star) {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s infinite alternate;
}

@keyframes twinkle {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

:deep(.floating-petal) {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(167, 139, 250, 0.4);
  border-radius: 50% 0 50% 0;
  animation: petalFloat 8s infinite linear;
}

@keyframes petalFloat {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

.hero-content {
  max-width: 800px;
  padding: 2rem;
  position: relative;
  z-index: 10;
}

.game-title {
  font-size: 5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #A78BFA, #7C3AED, #F43F5E);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  animation: titleReveal 1.5s ease forwards;
  letter-spacing: 0.05em;
}

@keyframes titleReveal {
  from { opacity: 0; transform: translateY(40px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.game-subtitle {
  font-size: 1.4rem;
  color: rgba(226, 232, 240, 0.7);
  animation: subtitleReveal 1.5s ease 0.3s forwards;
  opacity: 0;
  letter-spacing: 0.1em;
}

@keyframes subtitleReveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 0.8; transform: translateY(0); }
}

.scroll-indicator {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(167, 139, 250, 0.7);
  animation: bounce 2s infinite;
  cursor: pointer;
  z-index: 10;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-12px); }
}

/* 游戏简介 */
.game-info {
  padding: 8rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.game-info h2 {
  font-size: 2.5rem;
  margin-bottom: 4rem;
  text-align: center;
  color: #ffffff;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.info-block {
  background: rgba(167, 139, 250, 0.05);
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 16px;
  padding: 2.5rem;
  backdrop-filter: blur(5px);
  transition: all 0.4s;
}

.info-block:hover {
  border-color: rgba(167, 139, 250, 0.4);
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.1);
}

.info-block h3 {
  font-size: 1.4rem;
  color: #ffffff;
  margin-bottom: 1rem;
}

.info-block p {
  line-height: 1.9;
  font-size: 1.05rem;
  color: rgba(226, 232, 240, 0.8);
}

/* 章节预览 */
.chapters {
  padding: 8rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.chapters h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #ffffff;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.chapter-card {
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.4s;
  position: relative;
  overflow: hidden;
}

.chapter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #7C3AED, #F43F5E);
  transform: scaleX(0);
  transition: transform 0.4s;
  transform-origin: left;
}

.chapter-card:hover::before {
  transform: scaleX(1);
}

.chapter-card:hover {
  transform: translateY(-5px);
  border-color: rgba(167, 139, 250, 0.5);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.15);
}

.chapter-number {
  font-size: 1.4rem;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 0.8rem;
}

.chapter-desc {
  color: rgba(226, 232, 240, 0.7);
  line-height: 1.7;
}

/* 角色介绍 - 卡片式切换 */
.characters-section {
  padding: 8rem 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.characters-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(244, 63, 94, 0.05) 100%);
}

.section-title-light {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #ffffff;
  position: relative;
  z-index: 1;
}

.char-tabs {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.char-tab {
  background: rgba(167, 139, 250, 0.08);
  border: 1px solid rgba(167, 139, 250, 0.25);
  color: rgba(226, 232, 240, 0.7);
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 700;
  position: relative;
  overflow: hidden;
}

.char-tab::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #7C3AED, #F43F5E);
  transform: scaleX(0);
  transition: transform 0.3s;
  transform-origin: center;
}

.char-tab:hover {
  background: rgba(167, 139, 250, 0.15);
  border-color: rgba(167, 139, 250, 0.5);
  color: #ffffff;
  transform: translateY(-2px);
}

.char-tab.active {
  background: rgba(124, 58, 237, 0.2);
  border-color: #7C3AED;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
  transform: translateY(-2px);
}

.char-tab.active::before {
  transform: scaleX(1);
}

.char-detail {
  max-width: 800px;
  width: 100%;
  display: flex;
  gap: 2.5rem;
  align-items: center;
  background: rgba(167, 139, 250, 0.06);
  border: 1px solid rgba(167, 139, 250, 0.2);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 20px;
  position: relative;
  z-index: 1;
}

.char-img {
  width: 200px;
  height: 280px;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(244, 63, 94, 0.1));
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(167, 139, 250, 0.3);
}

.char-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}

.char-info {
  flex: 1;
}

.char-info h3 {
  font-size: 1.8rem;
  color: #ffffff;
  margin-bottom: 1rem;
}

.char-info p {
  line-height: 1.9;
  color: rgba(226, 232, 240, 0.8);
  font-size: 1rem;
}

.char-fade-enter-active,
.char-fade-leave-active {
  transition: all 0.4s ease;
}

.char-fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.char-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* 体验剧情 */
.experience-section {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: radial-gradient(ellipse at center, rgba(124, 58, 237, 0.1) 0%, transparent 60%);
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
  color: white;
}

.experience-desc {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  color: rgba(226, 232, 240, 0.7);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.btn-experience {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(244, 63, 94, 0.2));
  border: 2px solid #7C3AED;
  color: white;
  padding: 1.2rem 3rem;
  font-size: 1.3rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}

.btn-experience:hover {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(244, 63, 94, 0.3));
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
}

.btn-experience svg {
  transition: transform 0.3s;
}

.btn-experience:hover svg {
  transform: translateX(5px);
}

/* 游戏资讯 */
.news-section {
  padding: 8rem 2rem;
  background: rgba(15, 15, 35, 0.5);
}

.news-section h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #ffffff;
}

.news-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.news-item {
  background: rgba(167, 139, 250, 0.05);
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s;
}

.news-item:hover {
  border-color: rgba(167, 139, 250, 0.4);
  transform: translateX(5px);
}

.news-date {
  color: rgba(226, 232, 240, 0.5);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.news-item h3 {
  color: #E2E8F0;
  font-size: 1.2rem;
  margin-bottom: 0.8rem;
}

.news-item p {
  color: rgba(226, 232, 240, 0.7);
  line-height: 1.7;
}

.more-news-btn-container {
  max-width: 800px;
  margin: 2rem auto 0;
  display: flex;
  justify-content: flex-end;
}

.more-news-btn {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.more-news-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 205, 196, 0.3);
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
  background: #080812;
  color: white;
  text-align: center;
  padding: 3rem 2rem;
  border-top: 1px solid rgba(167, 139, 250, 0.1);
}

.footer p {
  margin: 0.3rem 0;
  opacity: 0.5;
  font-size: 0.9rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .game-title {
    font-size: 3rem;
  }
  
  .char-detail {
    flex-direction: column;
    text-align: center;
  }
  
  .char-img {
    width: 140px;
    height: 200px;
  }
  
  .char-tabs {
    gap: 0.8rem;
  }
  
  .char-tab {
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }
  
  .nav-menu {
    gap: 1rem;
    font-size: 0.85rem;
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: #1a1a2e;
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(124, 58, 237, 0.2);
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
  color: rgba(226, 232, 240, 0.5);
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
  color: #ffffff;
}

.modal-content h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #ffffff;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(226, 232, 240, 0.7);
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(15, 15, 35, 0.8);
  color: #E2E8F0;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #7C3AED;
}

.btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #7C3AED, #A78BFA);
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
}

.toggle-mode {
  text-align: center;
  margin-top: 1.5rem;
  color: rgba(226, 232, 240, 0.6);
}

.toggle-mode a {
  color: #ffffff;
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
