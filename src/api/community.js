import request from './index'

export const communityApi = {
  // 获取帖子列表
  getPosts(params) {
    return request.get('/community/posts', { params })
  },

  // 获取帖子详情
  getPostDetail(id) {
    return request.get(`/community/posts/${id}`)
  },

  // 发布帖子
  createPost(data) {
    return request.post('/community/posts', data)
  },

  // 删除帖子
  deletePost(id) {
    return request.delete(`/community/posts/${id}`)
  },

  // 点赞/取消点赞帖子
  likePost(id) {
    return request.post(`/community/posts/${id}/like`)
  },

  // 检查是否点赞
  checkLiked(id) {
    return request.get(`/community/posts/${id}/liked`)
  },

  // 获取评论列表
  getComments(postId) {
    return request.get(`/community/posts/${postId}/comments`)
  },

  // 发表评论
  createComment(postId, data) {
    return request.post(`/community/posts/${postId}/comments`, data)
  },

  // 删除评论
  deleteComment(id) {
    return request.delete(`/community/comments/${id}`)
  },

  // 点赞/取消点赞评论
  likeComment(id) {
    return request.post(`/community/comments/${id}/like`)
  }
}
