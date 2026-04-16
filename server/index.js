import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import userRoutes from './routes/user.js'
import storyRoutes from './routes/story.js'
import newsRoutes from './routes/news.js'
import adminRoutes from './routes/admin.js'
import communityRoutes from './routes/community.js'
import adminStoryRoutes from './routes/admin-story.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务 - 提供上传的头像访问
const uploadsPath = path.join(__dirname, 'uploads')
console.log('📁 静态文件目录:', uploadsPath)
app.use('/uploads', express.static(uploadsPath))

// 路由
app.use('/api/user', userRoutes)
app.use('/api/story', storyRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/admin/story', adminStoryRoutes)

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '东方梦蝶谭 API 服务运行中' })
})

// 测试静态文件访问
app.get('/test-uploads', async (req, res) => {
  try {
    const fs = await import('fs')
    const uploadsPath = path.join(__dirname, 'uploads/avatars')
    
    const files = fs.readdirSync(uploadsPath)
    res.json({
      success: true,
      uploadsPath,
      files: files.map(f => ({
        filename: f,
        url: `http://localhost:${PORT}/uploads/avatars/${f}`
      }))
    })
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    })
  }
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
})
