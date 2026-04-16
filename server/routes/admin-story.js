import express from 'express'
import pool from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      message: '需要管理员权限' 
    })
  }
  next()
}

// 所有路由都需要管理员权限
router.use(authenticateToken, requireAdmin)

// ==================== 章节管理 ====================

// 获取所有章节（带节点数统计）
router.get('/chapters', async (req, res) => {
  try {
    const [chapters] = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT sn.id) as node_count,
        COUNT(DISTINCT ch.id) as choice_count
      FROM chapters c
      LEFT JOIN story_nodes sn ON c.id = sn.chapter_id
      LEFT JOIN choices ch ON sn.id = ch.node_id
      GROUP BY c.id
      ORDER BY c.chapter_order ASC
    `)

    res.json({ 
      success: true, 
      chapters 
    })
  } catch (error) {
    console.error('获取章节列表失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取章节列表失败' 
    })
  }
})

// 创建章节
router.post('/chapters', async (req, res) => {
  try {
    const { title, description, chapter_order } = req.body

    if (!title || chapter_order === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '章节标题和顺序不能为空' 
      })
    }

    const [result] = await pool.query(
      'INSERT INTO chapters (title, description, chapter_order) VALUES (?, ?, ?)',
      [title, description || '', chapter_order]
    )

    res.json({ 
      success: true, 
      message: '章节创建成功',
      chapterId: result.insertId
    })
  } catch (error) {
    console.error('创建章节失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建章节失败' 
    })
  }
})

// 更新章节
router.put('/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, chapter_order } = req.body

    if (!title || chapter_order === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '章节标题和顺序不能为空' 
      })
    }

    await pool.query(
      'UPDATE chapters SET title = ?, description = ?, chapter_order = ? WHERE id = ?',
      [title, description || '', chapter_order, id]
    )

    res.json({ 
      success: true, 
      message: '章节更新成功' 
    })
  } catch (error) {
    console.error('更新章节失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新章节失败' 
    })
  }
})

// 删除章节
router.delete('/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 检查章节是否存在
    const [chapters] = await pool.query('SELECT * FROM chapters WHERE id = ?', [id])
    if (chapters.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '章节不存在' 
      })
    }

    // 删除章节（会级联删除相关节点和选项）
    await pool.query('DELETE FROM chapters WHERE id = ?', [id])

    res.json({ 
      success: true, 
      message: '章节删除成功' 
    })
  } catch (error) {
    console.error('删除章节失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除章节失败' 
    })
  }
})

// ==================== 节点管理 ====================

// 获取节点列表（支持分页和按章节筛选）
router.get('/nodes', async (req, res) => {
  try {
    const { page = 1, limit = 20, chapterId } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        sn.*,
        c.title as chapter_title,
        COUNT(DISTINCT ch.id) as choice_count
      FROM story_nodes sn
      LEFT JOIN chapters c ON sn.chapter_id = c.id
      LEFT JOIN choices ch ON sn.id = ch.node_id
    `
    const params = []

    if (chapterId) {
      query += ' WHERE sn.chapter_id = ?'
      params.push(chapterId)
    }

    query += ' GROUP BY sn.id ORDER BY sn.chapter_id ASC, sn.node_order ASC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [nodes] = await pool.query(query, params)

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM story_nodes'
    const countParams = []
    if (chapterId) {
      countQuery += ' WHERE chapter_id = ?'
      countParams.push(chapterId)
    }
    const [countResult] = await pool.query(countQuery, countParams)

    res.json({ 
      success: true, 
      nodes,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (error) {
    console.error('获取节点列表失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取节点列表失败' 
    })
  }
})

// 获取单个节点详情（包含选项）
router.get('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [nodes] = await pool.query(
      'SELECT * FROM story_nodes WHERE id = ?',
      [id]
    )

    if (nodes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '节点不存在' 
      })
    }

    // 获取节点的选项
    const [choices] = await pool.query(
      'SELECT * FROM choices WHERE node_id = ? ORDER BY choice_order ASC',
      [id]
    )

    const node = nodes[0]
    node.choices = choices

    res.json({ 
      success: true, 
      node 
    })
  } catch (error) {
    console.error('获取节点详情失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取节点详情失败' 
    })
  }
})

// 创建节点
router.post('/nodes', async (req, res) => {
  try {
    const { 
      chapter_id, 
      node_key, 
      character_name, 
      character_image, 
      background_image, 
      dialogue_text, 
      node_order 
    } = req.body

    if (!chapter_id || !node_key || !dialogue_text || node_order === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '章节ID、节点标识、对话文本和顺序不能为空' 
      })
    }

    // 检查node_key是否已存在
    const [existing] = await pool.query(
      'SELECT id FROM story_nodes WHERE node_key = ?',
      [node_key]
    )
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '节点标识已存在，请使用唯一的标识' 
      })
    }

    const [result] = await pool.query(
      `INSERT INTO story_nodes 
       (chapter_id, node_key, character_name, character_image, background_image, dialogue_text, node_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [chapter_id, node_key, character_name || '', character_image || '', background_image || '', dialogue_text, node_order]
    )

    res.json({ 
      success: true, 
      message: '节点创建成功',
      nodeId: result.insertId
    })
  } catch (error) {
    console.error('创建节点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建节点失败' 
    })
  }
})

// 更新节点
router.put('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { 
      chapter_id, 
      node_key, 
      character_name, 
      character_image, 
      background_image, 
      dialogue_text, 
      node_order 
    } = req.body

    if (!chapter_id || !node_key || !dialogue_text || node_order === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '章节ID、节点标识、对话文本和顺序不能为空' 
      })
    }

    // 检查node_key是否与其他节点冲突
    const [existing] = await pool.query(
      'SELECT id FROM story_nodes WHERE node_key = ? AND id != ?',
      [node_key, id]
    )
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '节点标识已被其他节点使用' 
      })
    }

    await pool.query(
      `UPDATE story_nodes 
       SET chapter_id = ?, node_key = ?, character_name = ?, character_image = ?, 
           background_image = ?, dialogue_text = ?, node_order = ?
       WHERE id = ?`,
      [chapter_id, node_key, character_name || '', character_image || '', background_image || '', dialogue_text, node_order, id]
    )

    res.json({ 
      success: true, 
      message: '节点更新成功' 
    })
  } catch (error) {
    console.error('更新节点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新节点失败' 
    })
  }
})

// 删除节点
router.delete('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 检查是否有选项指向此节点
    const [pointingChoices] = await pool.query(
      'SELECT COUNT(*) as count FROM choices WHERE next_node_id = ?',
      [id]
    )

    if (pointingChoices[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `无法删除：有 ${pointingChoices[0].count} 个选项指向此节点，请先修改这些选项` 
      })
    }

    // 删除节点（会级联删除该节点的选项）
    await pool.query('DELETE FROM story_nodes WHERE id = ?', [id])

    res.json({ 
      success: true, 
      message: '节点删除成功' 
    })
  } catch (error) {
    console.error('删除节点失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除节点失败' 
    })
  }
})

// ==================== 选项管理 ====================

// 创建选项
router.post('/choices', async (req, res) => {
  try {
    const { node_id, choice_text, next_node_id, choice_order } = req.body

    if (!node_id || !choice_text || choice_order === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '节点ID、选项文本和顺序不能为空' 
      })
    }

    // 如果指定了next_node_id，检查目标节点是否存在
    if (next_node_id) {
      const [targetNode] = await pool.query(
        'SELECT id FROM story_nodes WHERE id = ?',
        [next_node_id]
      )
      if (targetNode.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '目标节点不存在' 
        })
      }
    }

    const [result] = await pool.query(
      'INSERT INTO choices (node_id, choice_text, next_node_id, choice_order) VALUES (?, ?, ?, ?)',
      [node_id, choice_text, next_node_id || null, choice_order]
    )

    res.json({ 
      success: true, 
      message: '选项创建成功',
      choiceId: result.insertId
    })
  } catch (error) {
    console.error('创建选项失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '创建选项失败' 
    })
  }
})

// 更新选项
router.put('/choices/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { choice_text, next_node_id, choice_order } = req.body

    if (!choice_text || choice_order === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '选项文本和顺序不能为空' 
      })
    }

    // 如果指定了next_node_id，检查目标节点是否存在
    if (next_node_id) {
      const [targetNode] = await pool.query(
        'SELECT id FROM story_nodes WHERE id = ?',
        [next_node_id]
      )
      if (targetNode.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '目标节点不存在' 
        })
      }
    }

    await pool.query(
      'UPDATE choices SET choice_text = ?, next_node_id = ?, choice_order = ? WHERE id = ?',
      [choice_text, next_node_id || null, choice_order, id]
    )

    res.json({ 
      success: true, 
      message: '选项更新成功' 
    })
  } catch (error) {
    console.error('更新选项失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '更新选项失败' 
    })
  }
})

// 删除选项
router.delete('/choices/:id', async (req, res) => {
  try {
    const { id } = req.params

    await pool.query('DELETE FROM choices WHERE id = ?', [id])

    res.json({ 
      success: true, 
      message: '选项删除成功' 
    })
  } catch (error) {
    console.error('删除选项失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '删除选项失败' 
    })
  }
})

// ==================== 辅助功能 ====================

// 获取所有节点的简要信息（用于选项的目标节点选择）
router.get('/nodes-simple', async (req, res) => {
  try {
    const { chapterId } = req.query

    let query = `
      SELECT 
        sn.id, 
        sn.node_key, 
        sn.dialogue_text,
        sn.chapter_id,
        c.title as chapter_title
      FROM story_nodes sn
      LEFT JOIN chapters c ON sn.chapter_id = c.id
    `
    const params = []

    if (chapterId) {
      query += ' WHERE sn.chapter_id = ?'
      params.push(chapterId)
    }

    query += ' ORDER BY sn.chapter_id ASC, sn.node_order ASC'

    const [nodes] = await pool.query(query, params)

    // 截取对话文本前30个字符
    const simpleNodes = nodes.map(node => ({
      id: node.id,
      node_key: node.node_key,
      chapter_id: node.chapter_id,
      chapter_title: node.chapter_title,
      preview: node.dialogue_text.substring(0, 30) + (node.dialogue_text.length > 30 ? '...' : '')
    }))

    res.json({ 
      success: true, 
      nodes: simpleNodes 
    })
  } catch (error) {
    console.error('获取节点简要信息失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '获取节点简要信息失败' 
    })
  }
})

// 验证故事完整性
router.get('/validate', async (req, res) => {
  try {
    const issues = []

    // 检查孤立节点（没有任何选项指向它，且不是章节第一个节点）
    const [orphanNodes] = await pool.query(`
      SELECT sn.id, sn.node_key, sn.dialogue_text, c.title as chapter_title
      FROM story_nodes sn
      LEFT JOIN chapters c ON sn.chapter_id = c.id
      WHERE sn.id NOT IN (SELECT DISTINCT next_node_id FROM choices WHERE next_node_id IS NOT NULL)
      AND sn.node_order > 1
    `)
    if (orphanNodes.length > 0) {
      issues.push({
        type: 'orphan_nodes',
        severity: 'warning',
        message: `发现 ${orphanNodes.length} 个孤立节点（没有选项指向它们）`,
        details: orphanNodes
      })
    }

    // 检查死胡同节点（没有选项且不是结束节点）
    const [deadEndNodes] = await pool.query(`
      SELECT sn.id, sn.node_key, sn.dialogue_text, c.title as chapter_title
      FROM story_nodes sn
      LEFT JOIN chapters c ON sn.chapter_id = c.id
      LEFT JOIN choices ch ON sn.id = ch.node_id
      WHERE ch.id IS NULL
    `)
    if (deadEndNodes.length > 0) {
      issues.push({
        type: 'dead_end_nodes',
        severity: 'info',
        message: `发现 ${deadEndNodes.length} 个没有选项的节点（可能是结束节点）`,
        details: deadEndNodes
      })
    }

    // 检查断链选项（指向不存在的节点）
    const [brokenChoices] = await pool.query(`
      SELECT 
        ch.id, 
        ch.choice_text, 
        ch.next_node_id,
        sn.node_key as from_node,
        c.title as chapter_title
      FROM choices ch
      LEFT JOIN story_nodes sn ON ch.node_id = sn.id
      LEFT JOIN chapters c ON sn.chapter_id = c.id
      WHERE ch.next_node_id IS NOT NULL 
      AND ch.next_node_id NOT IN (SELECT id FROM story_nodes)
    `)
    if (brokenChoices.length > 0) {
      issues.push({
        type: 'broken_choices',
        severity: 'error',
        message: `发现 ${brokenChoices.length} 个断链选项（指向不存在的节点）`,
        details: brokenChoices
      })
    }

    res.json({ 
      success: true, 
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues 
    })
  } catch (error) {
    console.error('验证故事完整性失败:', error)
    res.status(500).json({ 
      success: false, 
      message: '验证故事完整性失败' 
    })
  }
})

export default router
