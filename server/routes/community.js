import express from 'express'
import pool from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取帖子列表（支持分页和排序）
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'latest' } = req.query
    const offset = (page - 1) * limit

    // 排序逻辑
    let orderBy = 'p.created_at DESC'
    if (sort === 'hot') {
      orderBy = 'p.like_count DESC, p.comment_count DESC, p.view_count DESC'
    }

    // 获取帖子列表（置顶帖子始终在前）
    const [posts] = await pool.query(
      `SELECT 
        p.*,
        u.username,
        u.avatar,
        u.is_admin
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.is_pinned DESC, ${orderBy}
      LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    )

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM community_posts'
    )

    res.json({
      success: true,
      posts,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    console.error('获取帖子列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取帖子列表失败'
    })
  }
})

// 获取单个帖子详情
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 增加浏览量
    await pool.query(
      'UPDATE community_posts SET view_count = view_count + 1 WHERE id = ?',
      [id]
    )

    // 获取帖子详情
    const [posts] = await pool.query(
      `SELECT 
        p.*,
        u.username,
        u.avatar,
        u.is_admin
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [id]
    )

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      })
    }

    res.json({
      success: true,
      post: posts[0]
    })
  } catch (error) {
    console.error('获取帖子详情错误:', error)
    res.status(500).json({
      success: false,
      message: '获取帖子详情失败'
    })
  }
})

// 发布帖子（需要登录）
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, images } = req.body
    const userId = req.user.id

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      })
    }

    const [result] = await pool.query(
      `INSERT INTO community_posts (user_id, title, content, images) 
       VALUES (?, ?, ?, ?)`,
      [userId, title, content, images ? JSON.stringify(images) : null]
    )

    res.json({
      success: true,
      message: '发布成功',
      postId: result.insertId
    })
  } catch (error) {
    console.error('发布帖子错误:', error)
    res.status(500).json({
      success: false,
      message: '发布帖子失败'
    })
  }
})

// 删除帖子（需要登录，只能删除自己的帖子或管理员可删除任何帖子）
router.delete('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const isAdmin = req.user.isAdmin

    // 检查帖子是否存在以及权限
    const [posts] = await pool.query(
      'SELECT user_id FROM community_posts WHERE id = ?',
      [id]
    )

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      })
    }

    if (posts[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权删除此帖子'
      })
    }

    await pool.query('DELETE FROM community_posts WHERE id = ?', [id])

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除帖子错误:', error)
    res.status(500).json({
      success: false,
      message: '删除帖子失败'
    })
  }
})

// 点赞/取消点赞帖子（需要登录）
router.post('/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // 检查是否已点赞
    const [likes] = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    )

    if (likes.length > 0) {
      // 取消点赞
      await pool.query(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [id, userId]
      )
      await pool.query(
        'UPDATE community_posts SET like_count = like_count - 1 WHERE id = ?',
        [id]
      )
      res.json({
        success: true,
        message: '取消点赞',
        liked: false
      })
    } else {
      // 点赞
      await pool.query(
        'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [id, userId]
      )
      await pool.query(
        'UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?',
        [id]
      )
      res.json({
        success: true,
        message: '点赞成功',
        liked: true
      })
    }
  } catch (error) {
    console.error('点赞帖子错误:', error)
    res.status(500).json({
      success: false,
      message: '操作失败'
    })
  }
})

// 检查用户是否点赞了帖子（需要登录）
router.get('/posts/:id/liked', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const [likes] = await pool.query(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    )

    res.json({
      success: true,
      liked: likes.length > 0
    })
  } catch (error) {
    console.error('检查点赞状态错误:', error)
    res.status(500).json({
      success: false,
      message: '检查失败'
    })
  }
})

// 获取帖子的评论列表
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params

    const [comments] = await pool.query(
      `SELECT 
        c.*,
        u.username,
        u.avatar,
        u.is_admin
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC`,
      [id]
    )

    res.json({
      success: true,
      comments
    })
  } catch (error) {
    console.error('获取评论列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    })
  }
})

// 发表评论（需要登录）
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { content, parentId } = req.body
    const userId = req.user.id

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      })
    }

    const [result] = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, content, parent_id) 
       VALUES (?, ?, ?, ?)`,
      [id, userId, content, parentId || null]
    )

    // 更新帖子评论数
    await pool.query(
      'UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?',
      [id]
    )

    res.json({
      success: true,
      message: '评论成功',
      commentId: result.insertId
    })
  } catch (error) {
    console.error('发表评论错误:', error)
    res.status(500).json({
      success: false,
      message: '发表评论失败'
    })
  }
})

// 删除评论（需要登录）
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const isAdmin = req.user.isAdmin

    // 检查评论是否存在以及权限
    const [comments] = await pool.query(
      'SELECT user_id, post_id FROM post_comments WHERE id = ?',
      [id]
    )

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      })
    }

    if (comments[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      })
    }

    const postId = comments[0].post_id

    await pool.query('DELETE FROM post_comments WHERE id = ?', [id])

    // 更新帖子评论数
    await pool.query(
      'UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = ?',
      [postId]
    )

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除评论错误:', error)
    res.status(500).json({
      success: false,
      message: '删除评论失败'
    })
  }
})

// 点赞/取消点赞评论（需要登录）
router.post('/comments/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // 检查是否已点赞
    const [likes] = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [id, userId]
    )

    if (likes.length > 0) {
      // 取消点赞
      await pool.query(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [id, userId]
      )
      await pool.query(
        'UPDATE post_comments SET like_count = like_count - 1 WHERE id = ?',
        [id]
      )
      res.json({
        success: true,
        message: '取消点赞',
        liked: false
      })
    } else {
      // 点赞
      await pool.query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [id, userId]
      )
      await pool.query(
        'UPDATE post_comments SET like_count = like_count + 1 WHERE id = ?',
        [id]
      )
      res.json({
        success: true,
        message: '点赞成功',
        liked: true
      })
    }
  } catch (error) {
    console.error('点赞评论错误:', error)
    res.status(500).json({
      success: false,
      message: '操作失败'
    })
  }
})

export default router
