<template>
  <div class="profile-page">
    <!-- 返回首页按钮 -->
    <button class="back-home-btn" @click="$router.push('/')">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span>返回首页</span>
    </button>

    <div class="profile-container">
      <h1>个人中心</h1>
      
      <!-- 用户信息卡片 -->
      <div class="profile-card">
        <div class="card-header">
          <h2>个人信息</h2>
        </div>
        <div class="card-body">
          <div class="avatar-section">
            <div class="avatar-display">
              <img 
                v-if="userInfo.avatar" 
                :src="userInfo.avatar" 
                alt="头像"
                @error="handleImageError"
              />
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <button class="btn-secondary" @click="openAvatarModal">更换头像</button>
          </div>
          
          <div class="info-section">
            <div class="info-item">
              <label>用户名</label>
              <div class="info-value">{{ userInfo.username }}</div>
            </div>
            <div class="info-item">
              <label>注册时间</label>
              <div class="info-value">{{ formatDate(userInfo.created_at) }}</div>
            </div>
            <div class="info-item">
              <label>邮箱</label>
              <div class="info-value-editable">
                <span v-if="!editingEmail">{{ userInfo.email || '未设置' }}</span>
                <input v-else v-model="emailInput" type="email" class="inline-input" />
                <button v-if="!editingEmail" class="btn-edit" @click="startEditEmail">编辑</button>
                <div v-else class="edit-actions">
                  <button class="btn-save" @click="saveEmail">保存</button>
                  <button class="btn-cancel" @click="cancelEditEmail">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 游戏进度卡片 -->
      <div class="profile-card">
        <div class="card-header">
          <h2>游戏进度</h2>
        </div>
        <div class="card-body">
          <div v-if="progress.length > 0" class="progress-list">
            <div v-for="item in progress" :key="item.chapter_id" class="progress-item">
              <div class="progress-info">
                <div class="progress-title">{{ item.chapter_title }}</div>
                <div class="progress-time">最后游玩：{{ formatDate(item.last_played) }}</div>
              </div>
              <button class="btn-primary" @click="continueStory">继续游戏</button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>还没有游戏进度，快去体验剧情吧！</p>
            <button class="btn-primary" @click="$router.push('/story')">开始游戏</button>
          </div>
        </div>
      </div>

      <!-- 修改密码卡片 -->
      <div class="profile-card">
        <div class="card-header">
          <h2>修改密码</h2>
        </div>
        <div class="card-body">
          <form @submit.prevent="changePassword" class="password-form">
            <div class="form-group">
              <label>当前密码</label>
              <input v-model="passwordForm.oldPassword" type="password" required />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="passwordForm.newPassword" type="password" required />
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="passwordForm.confirmPassword" type="password" required />
            </div>
            <button type="submit" class="btn-primary">修改密码</button>
          </form>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="profile-card">
        <div class="card-header">
          <h2>退出登录</h2>
        </div>
        <div class="card-body">
          <div class="logout-section">
            <p>退出后需要重新登录才能访问个人中心和体验剧情</p>
            <button class="btn-logout" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 头像选择弹窗 -->
    <div class="modal-overlay" v-if="showAvatarModal" @click="showAvatarModal = false">
      <div class="modal-content avatar-modal" @click.stop>
        <button class="modal-close" @click="showAvatarModal = false">×</button>
        <h2>选择头像</h2>
        
        <!-- 上传自定义头像 -->
        <div class="upload-section">
          <label class="upload-label">
            <input type="file" accept="image/*" @change="handleFileUpload" style="display: none" />
            <div class="upload-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>点击上传自定义头像</p>
              <p class="upload-hint">支持 JPG、PNG、GIF，最大 5MB</p>
            </div>
          </label>
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p>上传中... {{ uploadProgress }}%</p>
          </div>
        </div>
        
        <div class="divider">或选择预设头像</div>
        
        <div class="avatar-grid">
          <div 
            v-for="(avatar, index) in avatarList" 
            :key="index"
            class="avatar-option"
            :class="{ selected: selectedAvatar === avatar }"
            @click="selectAvatar(avatar)"
          >
            <img :src="avatar" :alt="`头像${index + 1}`" />
          </div>
        </div>
        <button class="btn-primary" @click="saveAvatar" :disabled="!selectedAvatar">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { userApi } from '../api/user'
import { storyApi } from '../api/story'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref({
  username: '',
  email: '',
  created_at: '',
  avatar: ''
})

const progress = ref([])
const showAvatarModal = ref(false)
const selectedAvatar = ref('')
const editingEmail = ref(false)
const emailInput = ref('')
const uploadProgress = ref(0)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 预设头像列表（这里用占位符，实际应该是真实的头像图片）
const avatarList = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6'
]

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await userApi.getUserInfo()
    if (response.success) {
      userInfo.value = response.user
      // 如果头像是相对路径，转换为完整URL
      if (userInfo.value.avatar && !userInfo.value.avatar.startsWith('http')) {
        userInfo.value.avatar = `http://localhost:3000${userInfo.value.avatar}`
      }
      selectedAvatar.value = userInfo.value.avatar || avatarList[0]
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 加载游戏进度
const loadProgress = async () => {
  try {
    const response = await storyApi.getProgress()
    if (response.success) {
      progress.value = response.progress
    }
  } catch (error) {
    console.error('加载进度失败:', error)
  }
}

// 选择头像
const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
}

// 处理文件上传
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 验证文件大小
  if (file.size > 5 * 1024 * 1024) {
    alert('文件大小不能超过 5MB')
    return
  }
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('只能上传图片文件')
    return
  }
  
  try {
    uploadProgress.value = 10
    
    const response = await userApi.uploadAvatar(file)
    
    uploadProgress.value = 100
    
    if (response.success) {
      // 更新头像显示
      const avatarUrl = `http://localhost:3000${response.avatar}`
      userInfo.value.avatar = avatarUrl
      selectedAvatar.value = avatarUrl
      
      setTimeout(() => {
        uploadProgress.value = 0
        showAvatarModal.value = false
        alert('头像上传成功')
      }, 500)
    }
  } catch (error) {
    uploadProgress.value = 0
    alert(error.response?.data?.message || '上传失败')
  }
}

// 保存头像
const saveAvatar = async () => {
  if (!selectedAvatar.value) {
    alert('请选择一个头像')
    return
  }
  
  try {
    // 如果是完整URL，只保存路径部分到数据库
    let avatarToSave = selectedAvatar.value
    if (avatarToSave.startsWith('http://localhost:3000')) {
      avatarToSave = avatarToSave.replace('http://localhost:3000', '')
    }
    
    await userApi.updateAvatar(avatarToSave)
    userInfo.value.avatar = selectedAvatar.value
    showAvatarModal.value = false
    alert('头像已更新')
  } catch (error) {
    alert(error.response?.data?.message || '更新头像失败')
  }
}

// 开始编辑邮箱
const startEditEmail = () => {
  emailInput.value = userInfo.value.email || ''
  editingEmail.value = true
}

// 取消编辑邮箱
const cancelEditEmail = () => {
  editingEmail.value = false
  emailInput.value = ''
}

// 保存邮箱
const saveEmail = async () => {
  try {
    await userApi.updateEmail(emailInput.value)
    userInfo.value.email = emailInput.value
    editingEmail.value = false
    alert('邮箱已更新')
  } catch (error) {
    alert(error.response?.data?.message || '更新邮箱失败')
  }
}

// 修改密码
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('两次输入的新密码不一致')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    alert('新密码长度不能少于6位')
    return
  }
  
  try {
    await userApi.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    // 清空表单
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    alert('密码修改成功')
  } catch (error) {
    alert(error.response?.data?.message || '修改密码失败')
  }
}

// 继续游戏
const continueStory = () => {
  router.push('/story')
}

// 打开头像选择弹窗
const openAvatarModal = () => {
  // 设置当前头像为选中状态
  if (userInfo.value.avatar) {
    selectedAvatar.value = userInfo.value.avatar
  }
  showAvatarModal.value = true
}

// 处理图片加载错误
const handleImageError = (e) => {
  console.error('头像加载失败:', userInfo.value.avatar)
  // 加载失败时显示默认头像
  e.target.style.display = 'none'
}

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    alert('已退出登录')
    router.push('/')
  }
}

onMounted(() => {
  // 检查登录状态
  if (!userStore.token) {
    alert('请先登录')
    router.push('/')
    return
  }
  
  loadUserInfo()
  loadProgress()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.back-home-btn {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s;
}

.back-home-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateX(-5px);
}

.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding-top: 4rem;
}

.profile-container h1 {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.profile-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.card-body {
  padding: 2rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.avatar-display {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-display img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-display svg {
  color: #667eea;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item label {
  font-weight: bold;
  color: #666;
}

.info-value {
  color: #333;
}

.info-value-editable {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.inline-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-edit, .btn-save, .btn-cancel {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.btn-edit {
  background: #667eea;
  color: white;
}

.btn-save {
  background: #28a745;
  color: white;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-edit:hover, .btn-save:hover, .btn-cancel:hover {
  opacity: 0.8;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.progress-time {
  color: #666;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 1rem;
}

.password-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary:hover, .btn-secondary:hover {
  opacity: 0.9;
}

/* 头像选择弹窗 */
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
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  position: relative;
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
}

.avatar-modal h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.avatar-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.avatar-option:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.avatar-option.selected {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-section {
  margin-bottom: 1.5rem;
}

.upload-label {
  cursor: pointer;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s;
}

.upload-box:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.upload-box svg {
  color: #667eea;
  margin-bottom: 1rem;
}

.upload-box p {
  margin: 0.5rem 0;
  color: #333;
}

.upload-hint {
  font-size: 0.85rem;
  color: #999;
}

.upload-progress {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.upload-progress p {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.divider {
  text-align: center;
  color: #999;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}
</style>


/* 退出登录卡片 */
.logout-section {
  text-align: left;
}

.logout-section p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.95rem;
}

.btn-logout {
  padding: 0.75rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #dc3545;
  opacity: 0.9;
}
