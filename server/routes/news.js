import express from 'express'
import pool from '../config/db.js'

const router = express.Router()

// 获取所有资讯
router.get('/', async (req, res) => {
  try {
    const [news] = await pool.query(
      'SELECT * FROM news ORDER BY publish_date DESC, created_at DESC'
    )

    res.json({ 
      success: true, 
      news 
    })
  } catch (error) {
    console.error('获取资讯错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取资讯失败' 
    })
  }
})

// 获取单条资讯
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [news] = await pool.query(
      'SELECT * FROM news WHERE id = ?',
      [id]
    )

    if (news.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '资讯不存在' 
      })
    }

    res.json({ 
      success: true, 
      news: news[0] 
    })
  } catch (error) {
    console.error('获取资讯错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取资讯失败' 
    })
  }
})

export default router
