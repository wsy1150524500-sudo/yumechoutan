import api from './index'

export const userApi = {
  // 用户登录
  login(credentials) {
    return api.post('/user/login', credentials)
  },
  
  // 用户注册
  register(userData) {
    return api.post('/user/register', userData)
  },
  
  // 获取用户信息
  getUserInfo() {
    return api.get('/user/info')
  },
  
  // 更新邮箱
  updateEmail(email) {
    return api.put('/user/email', { email })
  },
  
  // 修改密码
  changePassword(data) {
    return api.put('/user/password', data)
  },
  
  // 更新头像
  updateAvatar(avatar) {
    return api.put('/user/avatar', { avatar })
  },
  
  // 上传头像文件
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/user/avatar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
