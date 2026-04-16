import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'
import upload from '../config/upload.js'

const router = express.Router()

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      })
    }

    // 检查用户名是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 插入新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email || null]
    )

    res.status(201).json({ 
      success: true, 
      message: '注册成功',
      userId: result.insertId
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '注册失败，请稍后重试' 
    })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      })
    }

    // 查询用户
    const [users] = await pool.query(
      'SELECT id, username, password, is_admin, banned_until, ban_reason FROM users WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      })
    }

    const user = users[0]

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      })
    }

    // 检查用户是否被封禁
    if (user.banned_until) {
      const bannedUntil = new Date(user.banned_until)
      const now = new Date()
      
      if (bannedUntil > now) {
        // 检查是否为永久封禁（9999年）
        if (bannedUntil.getFullYear() >= 9999) {
          return res.status(403).json({ 
            success: false, 
            message: '您的账户已被永久封禁',
            banned: true,
            permanent: true,
            banReason: user.ban_reason
          })
        }
        
        // 格式化封禁结束时间
        const year = bannedUntil.getFullYear()
        const month = bannedUntil.getMonth() + 1
        const day = bannedUntil.getDate()
        const hour = bannedUntil.getHours()
        const minute = bannedUntil.getMinutes()
        
        return res.status(403).json({ 
          success: false, 
          message: `您的账户已被封禁至${year}年${month}月${day}日${hour}时${minute}分`,
          banned: true,
          permanent: false,
          bannedUntil: user.banned_until,
          banReason: user.ban_reason
        })
      }
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.is_admin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ 
      success: true, 
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin || false
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    })
  }
})

// 获取用户信息（需要认证）
router.get('/info', authenticateToken, async (req, res) => {
  try {
    // 先确保avatar字段存在
    try {
      await pool.query('SELECT avatar FROM users LIMIT 1')
    } catch (error) {
      // 如果字段不存在，添加字段
      await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL')
    }
    
    const [users] = await pool.query(
      'SELECT id, username, email, created_at, avatar FROM users WHERE id = ?',
      [req.user.id]
    )

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      })
    }

    res.json({ 
      success: true, 
      user: users[0] 
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    })
  }
})

// 更新邮箱（需要认证）
router.put('/email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱不能为空' 
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱格式不正确' 
      })
    }

    await pool.query(
      'UPDATE users SET email = ? WHERE id = ?',
      [email, req.user.id]
    )

    res.json({ 
      success: true, 
      message: '邮箱更新成功' 
    })
  } catch (error) {
    console.error('更新邮箱错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新邮箱失败' 
    })
  }
})

// 修改密码（需要认证）
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '旧密码和新密码不能为空' 
      })
    }

    // 查询用户当前密码
    const [users] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    )

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      })
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '当前密码错误' 
      })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    )

    res.json({ 
      success: true, 
      message: '密码修改成功' 
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '修改密码失败' 
    })
  }
})

// 更新头像（需要认证）
router.put('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body

    if (!avatar) {
      return res.status(400).json({ 
        success: false, 
        message: '头像URL不能为空' 
      })
    }

    // 先检查users表是否有avatar字段，如果没有则添加
    try {
      await pool.query('SELECT avatar FROM users LIMIT 1')
    } catch (error) {
      // 如果字段不存在，添加字段
      await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL')
    }

    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, req.user.id]
    )

    res.json({ 
      success: true, 
      message: '头像更新成功' 
    })
  } catch (error) {
    console.error('更新头像错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新头像失败' 
    })
  }
})

// 上传头像文件（需要认证）
router.post('/avatar/upload', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: '请选择要上传的图片' 
      })
    }

    // 生成头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    // 先检查users表是否有avatar字段
    try {
      await pool.query('SELECT avatar FROM users LIMIT 1')
    } catch (error) {
      // 如果字段不存在，添加字段
      await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL')
    }

    // 更新数据库
    await pool.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, req.user.id]
    )
    
    res.json({ 
      success: true, 
      message: '头像上传成功',
      avatar: avatarUrl
    })
  } catch (error) {
    console.error('❌ 上传头像错误:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || '上传头像失败' 
    })
  }
})

export default router
