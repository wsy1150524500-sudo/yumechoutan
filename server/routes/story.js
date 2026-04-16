import express from 'express'
import pool from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取所有章节
router.get('/chapters', async (req, res) => {
  try {
    const [chapters] = await pool.query(
      'SELECT * FROM chapters ORDER BY chapter_order ASC'
    )

    res.json({ 
      success: true, 
      chapters 
    })
  } catch (error) {
    console.error('获取章节错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取章节失败' 
    })
  }
})

// 获取指定章节的故事节点
router.get('/chapter/:chapterId/nodes', async (req, res) => {
  try {
    const { chapterId } = req.params

    const [nodes] = await pool.query(
      'SELECT * FROM story_nodes WHERE chapter_id = ? ORDER BY node_order ASC',
      [chapterId]
    )

    // 获取每个节点的选项
    for (let node of nodes) {
      const [choices] = await pool.query(
        'SELECT * FROM choices WHERE node_id = ? ORDER BY choice_order ASC',
        [node.id]
      )
      node.choices = choices
    }

    res.json({ 
      success: true, 
      nodes 
    })
  } catch (error) {
    console.error('获取故事节点错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取故事节点失败' 
    })
  }
})

// 获取单个故事节点
router.get('/node/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params

    const [nodes] = await pool.query(
      'SELECT * FROM story_nodes WHERE id = ?',
      [nodeId]
    )

    if (nodes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '节点不存在' 
      })
    }

    const node = nodes[0]

    // 获取节点的选项
    const [choices] = await pool.query(
      'SELECT * FROM choices WHERE node_id = ? ORDER BY choice_order ASC',
      [nodeId]
    )

    node.choices = choices

    res.json({ 
      success: true, 
      node 
    })
  } catch (error) {
    console.error('获取节点错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取节点失败' 
    })
  }
})

// 保存用户选择（需要认证）
router.post('/choice', authenticateToken, async (req, res) => {
  try {
    const { nodeId, choiceId } = req.body
    const userId = req.user.id

    await pool.query(
      'INSERT INTO user_choices (user_id, node_id, choice_id) VALUES (?, ?, ?)',
      [userId, nodeId, choiceId]
    )

    res.json({ 
      success: true, 
      message: '选择已保存' 
    })
  } catch (error) {
    console.error('保存选择错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '保存选择失败' 
    })
  }
})

// 获取用户进度（需要认证）
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const [progress] = await pool.query(
      `SELECT up.*, c.title as chapter_title 
       FROM user_progress up 
       JOIN chapters c ON up.chapter_id = c.id 
       WHERE up.user_id = ?`,
      [userId]
    )

    res.json({ 
      success: true, 
      progress 
    })
  } catch (error) {
    console.error('获取进度错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取进度失败' 
    })
  }
})

// 保存用户进度（需要认证）
router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { chapterId, currentNodeId } = req.body
    const userId = req.user.id

    await pool.query(
      `INSERT INTO user_progress (user_id, chapter_id, current_node_id) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE current_node_id = ?, last_played = CURRENT_TIMESTAMP`,
      [userId, chapterId, currentNodeId, currentNodeId]
    )

    res.json({ 
      success: true, 
      message: '进度已保存' 
    })
  } catch (error) {
    console.error('保存进度错误:', error)
    res.status(500).json({ 
      success: false, 
      message: '保存进度失败' 
    })
  }
})

export default router
