import express from 'express'
import pool from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 管理员权限验证中间件
const requireAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [req.user.id]
    )
    
    if (users.length === 0 || !users[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      })
    }
    
    next()
  } catch (error) {
    console.error('验证管理员权限错误:', error)
    res.status(500).json({
      success: false,
      message: '权限验证失败'
    })
  }
}

// 获取统计概览
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 总用户数
    const [totalUsersResult] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = FALSE OR is_admin IS NULL'
    )
    const totalUsers = totalUsersResult[0].count
    
    // 活跃用户数（有游戏进度的用户）
    const [activeUsersResult] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM user_progress'
    )
    const activeUsers = activeUsersResult[0].count
    
    // 总选择次数
    const [totalChoicesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM user_choices'
    )
    const totalChoices = totalChoicesResult[0].count
    
    // 平均进度（基于章节数）
    const [avgProgressResult] = await pool.query(`
      SELECT AVG(progress_count) as avg_progress
      FROM (
        SELECT user_id, COUNT(*) as progress_count
        FROM user_progress
        GROUP BY user_id
      ) as user_progress_counts
    `)
    const totalChapters = 4 // 总章节数
    const avgProgress = avgProgressResult[0].avg_progress 
      ? Math.round((avgProgressResult[0].avg_progress / totalChapters) * 100)
      : 0
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalChoices,
        avgProgress
      }
    })
  } catch (error) {
    console.error('获取统计数据错误:', error)
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    })
  }
})

// 获取用户列表
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        COUNT(DISTINCT up.chapter_id) as progress_count,
        COUNT(DISTINCT uc.id) as choice_count
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN user_choices uc ON u.id = uc.user_id
      WHERE u.is_admin = FALSE OR u.is_admin IS NULL
      GROUP BY u.id, u.username, u.email, u.created_at
      ORDER BY u.created_at DESC
    `)
    
    res.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    })
  }
})

// 获取选择统计
router.get('/choice-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        c.id as choice_id,
        c.choice_text,
        sn.node_key,
        COUNT(uc.id) as count,
        ROUND(COUNT(uc.id) * 100.0 / (
          SELECT COUNT(*) 
          FROM user_choices uc2 
          JOIN choices c2 ON uc2.choice_id = c2.id 
          WHERE c2.node_id = c.node_id
        ), 1) as percentage
      FROM choices c
      LEFT JOIN user_choices uc ON c.id = uc.choice_id
      LEFT JOIN story_nodes sn ON c.node_id = sn.id
      WHERE EXISTS (
        SELECT 1 FROM user_choices uc3 
        JOIN choices c3 ON uc3.choice_id = c3.id 
        WHERE c3.node_id = c.node_id
      )
      GROUP BY c.id, c.choice_text, sn.node_key, c.node_id
      HAVING count > 0
      ORDER BY count DESC
      LIMIT 20
    `)
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('获取选择统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取选择统计失败'
    })
  }
})

// 获取章节进度分布
router.get('/chapter-progress', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [progress] = await pool.query(`
      SELECT 
        ch.id as chapter_id,
        ch.title as chapter_title,
        COUNT(DISTINCT up.user_id) as user_count,
        LEAST(ROUND(COUNT(DISTINCT up.user_id) * 100.0 / GREATEST((
          SELECT COUNT(*) FROM users
        ), 1), 1), 100) as percentage
      FROM chapters ch
      LEFT JOIN user_progress up ON ch.id = up.chapter_id
      GROUP BY ch.id, ch.title, ch.chapter_order
      ORDER BY ch.chapter_order
    `)
    
    res.json({
      success: true,
      progress
    })
  } catch (error) {
    console.error('获取章节进度错误:', error)
    res.status(500).json({
      success: false,
      message: '获取章节进度失败'
    })
  }
})

// 获取单个用户详细信息
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    
    // 获取用户基本信息
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.avatar,
        u.created_at,
        u.banned_until,
        u.ban_reason,
        COUNT(DISTINCT up.chapter_id) as progress_count,
        COUNT(DISTINCT uc.id) as choice_count
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      LEFT JOIN user_choices uc ON u.id = uc.user_id
      WHERE u.id = ?
      GROUP BY u.id, u.username, u.email, u.avatar, u.created_at, u.banned_until, u.ban_reason
    `, [userId])
    
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
    console.error('获取用户详情错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户详情失败'
    })
  }
})

// 封禁用户
router.post('/users/:userId/ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { duration, reason } = req.body // duration in hours, -1 for permanent
    
    if (duration === undefined || duration === null) {
      return res.status(400).json({
        success: false,
        message: '请选择封禁时长'
      })
    }
    
    let bannedUntil
    
    // -1 表示永久封禁，使用9999年12月31日
    if (duration === -1) {
      bannedUntil = new Date('9999-12-31 23:59:59')
    } else if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: '封禁时长必须大于0或选择永久封禁'
      })
    } else {
      // 计算封禁结束时间
      bannedUntil = new Date()
      bannedUntil.setHours(bannedUntil.getHours() + duration)
    }
    
    await pool.query(
      'UPDATE users SET banned_until = ?, ban_reason = ? WHERE id = ?',
      [bannedUntil, reason || '违反社区规定', userId]
    )
    
    res.json({
      success: true,
      message: duration === -1 ? '用户已被永久封禁' : '用户已被封禁',
      bannedUntil
    })
  } catch (error) {
    console.error('封禁用户错误:', error)
    res.status(500).json({
      success: false,
      message: '封禁用户失败'
    })
  }
})

// 解封用户
router.post('/users/:userId/unban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    
    await pool.query(
      'UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = ?',
      [userId]
    )
    
    res.json({
      success: true,
      message: '用户已解封'
    })
  } catch (error) {
    console.error('解封用户错误:', error)
    res.status(500).json({
      success: false,
      message: '解封用户失败'
    })
  }
})

// ==================== 社区管理 ====================

// 获取社区统计数据
router.get('/community/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 总帖子数
    const [totalPostsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM community_posts'
    )
    const totalPosts = totalPostsResult[0].count
    
    // 总评论数
    const [totalCommentsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM post_comments'
    )
    const totalComments = totalCommentsResult[0].count
    
    // 总点赞数（帖子+评论）
    const [postLikesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM post_likes'
    )
    const [commentLikesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM comment_likes'
    )
    const totalLikes = postLikesResult[0].count + commentLikesResult[0].count
    
    // 活跃用户数（发过帖子或评论的用户）
    const [activeUsersResult] = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id FROM community_posts
        UNION
        SELECT user_id FROM post_comments
      ) as active_users
    `)
    const activeUsers = activeUsersResult[0].count
    
    res.json({
      success: true,
      stats: {
        totalPosts,
        totalComments,
        totalLikes,
        activeUsers
      }
    })
  } catch (error) {
    console.error('获取社区统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取社区统计失败'
    })
  }
})

// 获取所有帖子（管理员视图）
router.get('/community/posts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query
    const offset = (page - 1) * limit
    
    let whereClause = ''
    let params = []
    
    if (search) {
      whereClause = 'WHERE p.title LIKE ? OR p.content LIKE ?'
      params = [`%${search}%`, `%${search}%`]
    }
    
    const [posts] = await pool.query(`
      SELECT 
        p.*,
        u.username,
        u.avatar
      FROM community_posts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset])
    
    // 获取总数
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM community_posts p
      ${whereClause}
    `, params)
    
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

// 删除帖子
router.delete('/community/posts/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params
    
    await pool.query('DELETE FROM community_posts WHERE id = ?', [postId])
    
    res.json({
      success: true,
      message: '帖子已删除'
    })
  } catch (error) {
    console.error('删除帖子错误:', error)
    res.status(500).json({
      success: false,
      message: '删除帖子失败'
    })
  }
})

// 设置帖子置顶状态
router.put('/community/posts/:postId/pin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params
    const { isPinned } = req.body
    
    await pool.query(
      'UPDATE community_posts SET is_pinned = ? WHERE id = ?',
      [isPinned ? 1 : 0, postId]
    )
    
    res.json({
      success: true,
      message: isPinned ? '帖子已置顶' : '已取消置顶'
    })
  } catch (error) {
    console.error('设置置顶状态错误:', error)
    res.status(500).json({
      success: false,
      message: '设置置顶状态失败'
    })
  }
})

// 设置官方帖子状态
router.put('/community/posts/:postId/official', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params
    const { isOfficial } = req.body
    
    await pool.query(
      'UPDATE community_posts SET is_official = ? WHERE id = ?',
      [isOfficial ? 1 : 0, postId]
    )
    
    res.json({
      success: true,
      message: isOfficial ? '已设置为官方帖子' : '已取消官方标记'
    })
  } catch (error) {
    console.error('设置官方状态错误:', error)
    res.status(500).json({
      success: false,
      message: '设置官方状态失败'
    })
  }
})

// 获取所有评论（管理员视图）
router.get('/community/comments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit
    
    const [comments] = await pool.query(`
      SELECT 
        c.*,
        u.username,
        u.avatar,
        p.title as post_title
      FROM post_comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN community_posts p ON c.post_id = p.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset])
    
    // 获取总数
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM post_comments')
    
    res.json({
      success: true,
      comments,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    console.error('获取评论列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取评论列表失败'
    })
  }
})

// 删除评论
router.delete('/community/comments/:commentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { commentId } = req.params
    
    // 获取评论所属帖子ID
    const [comments] = await pool.query(
      'SELECT post_id FROM post_comments WHERE id = ?',
      [commentId]
    )
    
    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      })
    }
    
    const postId = comments[0].post_id
    
    // 删除评论
    await pool.query('DELETE FROM post_comments WHERE id = ?', [commentId])
    
    // 更新帖子评论数
    await pool.query(
      'UPDATE community_posts SET comment_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = ?) WHERE id = ?',
      [postId, postId]
    )
    
    res.json({
      success: true,
      message: '评论已删除'
    })
  } catch (error) {
    console.error('删除评论错误:', error)
    res.status(500).json({
      success: false,
      message: '删除评论失败'
    })
  }
})

export default router
