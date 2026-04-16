<template>
  <div class="community">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo" @click="$router.push('/')">東方夢蝶譚</div>
        <div class="nav-links">
          <a @click="$router.push('/')">返回首页</a>
          <div class="user-section">
            <img 
              v-if="userStore.isLoggedIn && userStore.avatar" 
              :src="userStore.avatar" 
              alt="用户头像" 
              class="user-avatar"
              @click="$router.push('/profile')"
            />
            <svg v-else class="user-icon" @click="handleUserClick" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>
    </nav>

    <!-- 社区内容 -->
    <div class="community-container">
      <!-- 社区头部 -->
      <div class="community-header">
        <h1>游戏社区</h1>
        <p>分享你的游戏体验，与其他玩家交流</p>
        <button class="create-post-btn" @click="showCreatePost" v-if="userStore.isLoggedIn">
          <span>+</span> 发布帖子
        </button>
      </div>

      <!-- 排序和筛选 -->
      <div class="filter-bar">
        <div class="sort-tabs">
          <button 
            :class="['sort-tab', { active: sortType === 'latest' }]"
            @click="changeSortType('latest')"
          >
            最新
          </button>
          <button 
            :class="['sort-tab', { active: sortType === 'hot' }]"
            @click="changeSortType('hot')"
          >
            热门
          </button>
        </div>
      </div>

      <!-- 帖子列表 -->
      <div class="posts-list">
        <div 
          v-for="post in posts" 
          :key="post.id"
          :class="['post-card', { pinned: post.is_pinned, official: post.is_official }]"
          @click="viewPost(post.id)"
        >
          <!-- 置顶/官方标签 -->
          <div class="post-tags">
            <span v-if="post.is_pinned" class="tag pinned-tag">置顶</span>
            <span v-if="post.is_official" class="tag official-tag">官方</span>
          </div>

          <!-- 帖子内容 -->
          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ post.content.substring(0, 150) }}{{ post.content.length > 150 ? '...' : '' }}</p>
            
            <!-- 帖子信息 -->
            <div class="post-meta">
              <div class="author-info">
                <img :src="getAvatarUrl(post.avatar)" alt="头像" class="author-avatar" />
                <span class="author-name">{{ post.username }}</span>
                <span v-if="post.is_admin" class="admin-badge">管理员</span>
              </div>
              <div class="post-stats">
                <span class="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {{ post.view_count }}
                </span>
                <span class="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {{ post.like_count }}
                </span>
                <span class="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {{ post.comment_count }}
                </span>
                <span class="post-time">{{ formatTime(post.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div class="loading-indicator" v-if="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 滚动触发器（用于无限滚动） -->
        <div ref="scrollTrigger" class="scroll-trigger" v-if="hasMore && !loading"></div>

        <!-- 已经到底了 -->
        <div class="no-more" v-if="!hasMore && posts.length > 0">
          <p>已经到底了</p>
        </div>

        <!-- 没有帖子 -->
        <div class="no-posts" v-if="posts.length === 0 && !loading">
          <p>还没有帖子，快来发布第一个吧！</p>
        </div>
      </div>
    </div>
    <!-- 发布帖子弹窗 -->
    <div class="modal" v-if="showCreateModal" @click="closeCreateModal">
      <div class="modal-content create-post-modal" @click.stop>
        <div class="modal-header">
          <h2>发布帖子</h2>
          <button class="close-btn" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <input 
            v-model="newPost.title" 
            type="text" 
            placeholder="输入标题（必填）" 
            class="post-title-input"
            maxlength="200"
          />
          <textarea 
            v-model="newPost.content" 
            placeholder="分享你的想法...（必填）" 
            class="post-content-input"
            rows="10"
          ></textarea>
          <div class="char-count">{{ newPost.content.length }} 字</div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeCreateModal">取消</button>
          <button class="submit-btn" @click="submitPost" :disabled="!canSubmit">发布</button>
        </div>
      </div>
    </div>

    <!-- 帖子详情弹窗 -->
    <div class="modal" v-if="showDetailModal" @click="closeDetailModal">
      <div class="modal-content post-detail-modal" @click.stop>
        <div class="modal-header">
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        
        <div class="modal-body" v-if="currentPost">
          <!-- 帖子详情 -->
          <div class="post-detail">
            <div class="post-tags">
              <span v-if="currentPost.is_pinned" class="tag pinned-tag">置顶</span>
              <span v-if="currentPost.is_official" class="tag official-tag">官方</span>
            </div>
            
            <h2 class="detail-title">{{ currentPost.title }}</h2>
            
            <div class="detail-meta">
              <div class="author-info">
                <img :src="getAvatarUrl(currentPost.avatar)" alt="头像" class="author-avatar" />
                <div>
                  <div class="author-name">
                    {{ currentPost.username }}
                    <span v-if="currentPost.is_admin" class="admin-badge">管理员</span>
                  </div>
                  <div class="post-time">{{ formatTime(currentPost.created_at) }}</div>
                </div>
              </div>
              <button 
                v-if="canDeletePost(currentPost)"
                class="delete-post-btn"
                @click="deletePost(currentPost.id)"
              >
                删除
              </button>
            </div>

            <div class="detail-content">{{ currentPost.content }}</div>

            <div class="detail-actions">
              <button 
                :class="['action-btn', 'like-btn', { liked: isPostLiked }]"
                @click="toggleLikePost"
              >
                <svg viewBox="0 0 24 24" :fill="isPostLiked ? 'currentColor' : 'none'" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{{ currentPost.like_count }}</span>
              </button>
              <span class="view-count">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {{ currentPost.view_count }} 浏览
              </span>
            </div>
          </div>

          <!-- 评论区 -->
          <div class="comments-section">
            <h3>评论 ({{ comments.length }})</h3>

            <!-- 发表评论 -->
            <div class="comment-input-box" v-if="userStore.isLoggedIn">
              <img :src="userStore.avatar || '/default-avatar.png'" alt="头像" class="comment-avatar" />
              <div class="comment-input-wrapper">
                <textarea 
                  v-model="newComment" 
                  placeholder="发表你的看法..." 
                  rows="3"
                  class="comment-input"
                ></textarea>
                <button class="submit-comment-btn" @click="submitComment" :disabled="!newComment.trim()">
                  发表评论
                </button>
              </div>
            </div>

            <div class="login-tip" v-else>
              <p>登录后才能发表评论 <a @click="$router.push('/')">去登录</a></p>
            </div>

            <!-- 评论列表 -->
            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <img :src="getAvatarUrl(comment.avatar)" alt="头像" class="comment-avatar" />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">
                      {{ comment.username }}
                      <span v-if="comment.is_admin" class="admin-badge">管理员</span>
                    </span>
                    <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                  </div>
                  <div class="comment-text">{{ comment.content }}</div>
                  <div class="comment-actions">
                    <button class="comment-like-btn" @click="toggleLikeComment(comment)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                      {{ comment.like_count || 0 }}
                    </button>
                    <button 
                      v-if="canDeleteComment(comment)"
                      class="comment-delete-btn"
                      @click="deleteComment(comment.id)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>

              <div class="no-comments" v-if="comments.length === 0">
                <p>还没有评论，快来抢沙发吧！</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { communityApi } from '../api/community'
import { userApi } from '../api/user'

const router = useRouter()
const userStore = useUserStore()

// 加载用户信息
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
          userStore.setAvatar(response.user.avatar)
        } else {
          const fullAvatarUrl = `http://localhost:3000${response.user.avatar}`
          userStore.setAvatar(fullAvatarUrl)
        }
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 数据
const posts = ref([])
const currentPost = ref(null)
const comments = ref([])
const sortType = ref('latest')
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)

// 滚动触发器引用
const scrollTrigger = ref(null)
let observer = null

// 弹窗控制
const showCreateModal = ref(false)
const showDetailModal = ref(false)

// 新帖子
const newPost = ref({
  title: '',
  content: ''
})

// 新评论
const newComment = ref('')

// 点赞状态
const isPostLiked = ref(false)

// 计算属性
const canSubmit = computed(() => {
  return newPost.value.title.trim() && newPost.value.content.trim()
})

// 加载帖子列表
const loadPosts = async (reset = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    if (reset) {
      page.value = 1
      posts.value = []
    }

    const response = await communityApi.getPosts({
      page: page.value,
      limit: 20,
      sort: sortType.value
    })

    if (response.success) {
      if (reset) {
        posts.value = response.posts
      } else {
        posts.value.push(...response.posts)
      }
      hasMore.value = posts.value.length < response.total
    }
  } catch (error) {
    console.error('加载帖子失败:', error)
    alert('加载帖子失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  page.value++
  loadPosts()
}

// 切换排序
const changeSortType = (type) => {
  sortType.value = type
  loadPosts(true)
}

// 显示发布帖子弹窗
const showCreatePost = () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    router.push('/')
    return
  }
  showCreateModal.value = true
}

// 关闭发布帖子弹窗
const closeCreateModal = () => {
  showCreateModal.value = false
  newPost.value = { title: '', content: '' }
}

// 提交帖子
const submitPost = async () => {
  if (!canSubmit.value) return

  try {
    const response = await communityApi.createPost(newPost.value)
    if (response.success) {
      alert('发布成功！')
      closeCreateModal()
      loadPosts(true)
    }
  } catch (error) {
    console.error('发布失败:', error)
    alert('发布失败，请重试')
  }
}

// 查看帖子详情
const viewPost = async (postId) => {
  try {
    const response = await communityApi.getPostDetail(postId)
    if (response.success) {
      currentPost.value = response.post
      showDetailModal.value = true
      loadComments(postId)
      
      // 检查点赞状态
      if (userStore.isLoggedIn) {
        checkPostLiked(postId)
      }
    }
  } catch (error) {
    console.error('加载帖子详情失败:', error)
  }
}

// 关闭帖子详情
const closeDetailModal = () => {
  showDetailModal.value = false
  currentPost.value = null
  comments.value = []
  newComment.value = ''
  isPostLiked.value = false
}

// 加载评论
const loadComments = async (postId) => {
  try {
    const response = await communityApi.getComments(postId)
    if (response.success) {
      comments.value = response.comments
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    const response = await communityApi.createComment(currentPost.value.id, {
      content: newComment.value
    })
    if (response.success) {
      newComment.value = ''
      loadComments(currentPost.value.id)
      // 更新帖子评论数
      currentPost.value.comment_count++
      // 更新列表中的帖子
      const post = posts.value.find(p => p.id === currentPost.value.id)
      if (post) post.comment_count++
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    alert('发表评论失败，请重试')
  }
}

// 检查帖子点赞状态
const checkPostLiked = async (postId) => {
  try {
    const response = await communityApi.checkLiked(postId)
    if (response.success) {
      isPostLiked.value = response.liked
    }
  } catch (error) {
    console.error('检查点赞状态失败:', error)
  }
}

// 切换帖子点赞
const toggleLikePost = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }

  try {
    const response = await communityApi.likePost(currentPost.value.id)
    if (response.success) {
      isPostLiked.value = response.liked
      currentPost.value.like_count += response.liked ? 1 : -1
      // 更新列表中的帖子
      const post = posts.value.find(p => p.id === currentPost.value.id)
      if (post) post.like_count = currentPost.value.like_count
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 切换评论点赞
const toggleLikeComment = async (comment) => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }

  try {
    const response = await communityApi.likeComment(comment.id)
    if (response.success) {
      comment.like_count = (comment.like_count || 0) + (response.liked ? 1 : -1)
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
  }
}

// 删除帖子
const deletePost = async (postId) => {
  if (!confirm('确定要删除这个帖子吗？')) return

  try {
    const response = await communityApi.deletePost(postId)
    if (response.success) {
      alert('删除成功')
      closeDetailModal()
      loadPosts(true)
    }
  } catch (error) {
    console.error('删除帖子失败:', error)
    alert('删除失败，请重试')
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return

  try {
    const response = await communityApi.deleteComment(commentId)
    if (response.success) {
      loadComments(currentPost.value.id)
      currentPost.value.comment_count--
      // 更新列表中的帖子
      const post = posts.value.find(p => p.id === currentPost.value.id)
      if (post) post.comment_count--
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    alert('删除失败，请重试')
  }
}

// 权限检查
const canDeletePost = (post) => {
  return userStore.isLoggedIn && (userStore.userId === post.user_id || userStore.isAdmin)
}

const canDeleteComment = (comment) => {
  return userStore.isLoggedIn && (userStore.userId === comment.user_id || userStore.isAdmin)
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理头像URL
const getAvatarUrl = (avatar) => {
  if (!avatar) {
    return '/default-avatar.png'
  }
  
  // 如果已经是完整URL，直接返回
  if (avatar.startsWith('http')) {
    return avatar
  }
  
  // 如果是相对路径，转换为完整URL
  return `http://localhost:3000${avatar}`
}

// 处理用户图标点击
const handleUserClick = () => {
  if (userStore.isLoggedIn) {
    router.push('/profile')
  } else {
    // 未登录，跳转到首页并打开登录弹窗
    router.push({ name: 'home', query: { needLogin: 'true', redirect: '/community' } })
  }
}

// 设置无限滚动
const setupInfiniteScroll = () => {
  if (!scrollTrigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      // 当触发器进入视口且还有更多内容时，加载下一页
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadMore()
      }
    },
    {
      root: null, // 使用视口作为根
      rootMargin: '100px', // 提前100px触发
      threshold: 0.1
    }
  )

  observer.observe(scrollTrigger.value)
}

onMounted(() => {
  loadUserInfo() // 加载用户信息
  loadPosts(true)
  
  // 等待DOM更新后设置无限滚动
  setTimeout(() => {
    setupInfiniteScroll()
  }, 100)
})

onUnmounted(() => {
  // 清理 observer
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.community {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
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
  font-size: 1.8rem;
  font-weight: bold;
  color: #4ecdc4;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-logo:hover {
  color: #45b7aa;
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.3s;
  cursor: pointer;
}

.nav-links a:hover {
  color: #4ecdc4;
}

.user-icon {
  width: 36px;
  height: 36px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.user-icon:hover {
  color: #4ecdc4;
  transform: scale(1.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.user-avatar:hover {
  border-color: #4ecdc4;
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.5);
}

/* 社区容器 */
.community-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 100px 2rem 4rem;
}

.community-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.community-header h1 {
  font-size: 2.5rem;
  color: white;
  margin-bottom: 0.5rem;
}

.community-header p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.create-post-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.create-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(78, 205, 196, 0.4);
}

.create-post-btn span {
  font-size: 1.5rem;
  font-weight: bold;
}

/* 筛选栏 */
.filter-bar {
  margin-bottom: 2rem;
}

.sort-tabs {
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 10px;
  width: fit-content;
}

.sort-tab {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.sort-tab.active {
  background: #4ecdc4;
  color: white;
}

.sort-tab:hover:not(.active) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* 帖子列表 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(78, 205, 196, 0.3);
  border-color: rgba(78, 205, 196, 0.5);
}

.post-card.pinned {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.05);
}

.post-card.official {
  border-color: #ffd93d;
  background: rgba(255, 217, 61, 0.05);
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: bold;
}

.pinned-tag {
  background: #ff6b6b;
  color: white;
}

.official-tag {
  background: #ffd93d;
  color: #333;
}

.post-title {
  color: white;
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
}

.post-excerpt {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  color: #4ecdc4;
  font-weight: 500;
}

.admin-badge {
  background: #ff6b6b;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.post-stats {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.stat svg {
  width: 16px;
  height: 16px;
}

.post-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

/* 加载状态 */
.loading-indicator {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid rgba(78, 205, 196, 0.2);
  border-top-color: #4ecdc4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 滚动触发器（不可见） */
.scroll-trigger {
  height: 1px;
  width: 100%;
}

/* 已经到底了 */
.no-more {
  text-align: center;
  padding: 3rem 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  border-top: 1px solid rgba(78, 205, 196, 0.2);
  margin-top: 2rem;
}

.no-more p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.no-more p::before,
.no-more p::after {
  content: '';
  width: 50px;
  height: 1px;
  background: rgba(78, 205, 196, 0.3);
}

.no-posts {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
}

/* 弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 2rem;
  overflow-y: auto;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(78, 205, 196, 0.3);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(78, 205, 196, 0.2);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.modal-header h2 {
  color: white;
  font-size: 1.8rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #4ecdc4;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(78, 205, 196, 0.2);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* 发布帖子表单 */
.post-title-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.3);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.post-content-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.3);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

.post-title-input:focus, .post-content-input:focus {
  outline: none;
  border-color: #4ecdc4;
}

.char-count {
  text-align: right;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.cancel-btn, .submit-btn {
  padding: 0.8rem 2rem;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border: none;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 帖子详情 */
.post-detail {
  border-bottom: 1px solid rgba(78, 205, 196, 0.2);
  padding-bottom: 2rem;
  margin-bottom: 2rem;
}

.detail-title {
  color: white;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.delete-post-btn {
  background: #ff6b6b;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-post-btn:hover {
  background: #ff5252;
}

.detail-content {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  font-size: 1.1rem;
  white-space: pre-wrap;
  margin-bottom: 2rem;
}

.detail-actions {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.action-btn {
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid #4ecdc4;
  color: #4ecdc4;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.action-btn:hover {
  background: #4ecdc4;
  color: white;
}

.like-btn.liked {
  background: #ff6b6b;
  border-color: #ff6b6b;
  color: white;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
}

.view-count svg {
  width: 18px;
  height: 18px;
}

/* 评论区 */
.comments-section h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.comment-input-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input-wrapper {
  flex: 1;
}

.comment-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(78, 205, 196, 0.3);
  color: white;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 0.8rem;
}

.comment-input:focus {
  outline: none;
  border-color: #4ecdc4;
}

.submit-comment-btn {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border: none;
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-comment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
}

.submit-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-tip {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 2rem;
}

.login-tip a {
  color: #4ecdc4;
  cursor: pointer;
  text-decoration: underline;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-author {
  color: #4ecdc4;
  font-weight: 500;
}

.comment-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.comment-text {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 0.8rem;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.comment-like-btn, .comment-delete-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.comment-like-btn svg {
  width: 16px;
  height: 16px;
}

.comment-like-btn:hover {
  color: #4ecdc4;
}

.comment-delete-btn:hover {
  color: #ff6b6b;
}

.no-comments {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
}

/* 响应式 */
@media (max-width: 768px) {
  .community-container {
    padding: 90px 1rem 2rem;
  }

  .community-header h1 {
    font-size: 2rem;
  }

  .post-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-body {
    padding: 1rem;
  }

  .comment-input-box {
    flex-direction: column;
  }
}
</style>
