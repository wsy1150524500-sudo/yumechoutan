import api from './index'

export const adminStoryApi = {
  // ==================== 章节管理 ====================
  
  // 获取所有章节
  getChapters() {
    return api.get('/admin/story/chapters')
  },
  
  // 创建章节
  createChapter(data) {
    return api.post('/admin/story/chapters', data)
  },
  
  // 更新章节
  updateChapter(id, data) {
    return api.put(`/admin/story/chapters/${id}`, data)
  },
  
  // 删除章节
  deleteChapter(id) {
    return api.delete(`/admin/story/chapters/${id}`)
  },
  
  // ==================== 节点管理 ====================
  
  // 获取节点列表
  getNodes(params) {
    return api.get('/admin/story/nodes', { params })
  },
  
  // 获取节点详情
  getNodeDetail(id) {
    return api.get(`/admin/story/nodes/${id}`)
  },
  
  // 创建节点
  createNode(data) {
    return api.post('/admin/story/nodes', data)
  },
  
  // 更新节点
  updateNode(id, data) {
    return api.put(`/admin/story/nodes/${id}`, data)
  },
  
  // 删除节点
  deleteNode(id) {
    return api.delete(`/admin/story/nodes/${id}`)
  },
  
  // 获取节点简要信息（用于选择器）
  getNodesSimple(chapterId) {
    return api.get('/admin/story/nodes-simple', { 
      params: chapterId ? { chapterId } : {} 
    })
  },
  
  // ==================== 选项管理 ====================
  
  // 创建选项
  createChoice(data) {
    return api.post('/admin/story/choices', data)
  },
  
  // 更新选项
  updateChoice(id, data) {
    return api.put(`/admin/story/choices/${id}`, data)
  },
  
  // 删除选项
  deleteChoice(id) {
    return api.delete(`/admin/story/choices/${id}`)
  },
  
  // ==================== 辅助功能 ====================
  
  // 验证故事完整性
  validateStory() {
    return api.get('/admin/story/validate')
  }
}
