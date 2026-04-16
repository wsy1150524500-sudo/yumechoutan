import api from './index'

export const storyApi = {
  // 获取章节列表
  getChapters() {
    return api.get('/story/chapters')
  },
  
  // 获取章节的所有节点
  getChapterNodes(chapterId) {
    return api.get(`/story/chapter/${chapterId}/nodes`)
  },
  
  // 获取故事节点
  getNode(nodeId) {
    return api.get(`/story/node/${nodeId}`)
  },
  
  // 保存用户选择
  saveChoice(data) {
    return api.post('/story/choice', data)
  },
  
  // 获取用户进度
  getProgress() {
    return api.get('/story/progress')
  },
  
  // 保存用户进度
  saveProgress(data) {
    return api.post('/story/progress', data)
  }
}
