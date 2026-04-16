/**
 * 系统测试脚本 - 東方夢蝶譚
 * 测试内容：功能测试 + API性能测试 + 安全性测试
 */

const BASE_URL = 'http://localhost:3000/api'
let adminToken = ''
let testUserToken = ''
let testUserId = null
let testPostId = null

const results = []
let passCount = 0
let failCount = 0

// 工具函数
const request = async (method, path, body = null, token = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  if (token) options.headers['Authorization'] = `Bearer ${token}`
  if (body) options.body = JSON.stringify(body)

  const start = Date.now()
  const res = await fetch(`${BASE_URL}${path}`, options)
  const time = Date.now() - start
  const data = await res.json()
  return { status: res.status, data, time }
}

const test = (id, name, passed, detail = '') => {
  const status = passed ? '✅ 通过' : '❌ 失败'
  if (passed) passCount++
  else failCount++
  results.push({ id, name, status, detail })
  console.log(`${status} [${id}] ${name}${detail ? ' - ' + detail : ''}`)
}

const printSection = (title) => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

// ==================== 功能测试 ====================

const testUserModule = async () => {
  printSection('用户模块测试')

  // U-01: 正常注册
  const testUsername = 'testuser_' + Date.now()
  let r = await request('POST', '/user/register', { username: testUsername, password: '123456', email: 'test@test.com' })
  test('U-01', '正常注册', r.status === 201 && r.data.success, `${r.time}ms`)
  testUserId = r.data.userId

  // U-02: 重复用户名注册
  r = await request('POST', '/user/register', { username: 'admin', password: '123456' })
  test('U-02', '重复用户名注册', r.status === 400 && r.data.message === '用户名已存在', `${r.time}ms`)

  // U-03: 空密码注册
  r = await request('POST', '/user/register', { username: 'emptypass', password: '' })
  test('U-03', '空密码注册', r.status === 400, `${r.time}ms`)

  // U-04: 管理员正常登录
  r = await request('POST', '/user/login', { username: 'admin', password: 'admin' })
  test('U-04', '管理员正常登录', r.status === 200 && r.data.success && r.data.token, `${r.time}ms`)
  adminToken = r.data.token

  // U-05: 错误密码登录
  r = await request('POST', '/user/login', { username: 'admin', password: 'wrongpassword' })
  test('U-05', '错误密码登录', r.status === 401 && !r.data.success, `${r.time}ms`)

  // U-06: 测试用户登录
  r = await request('POST', '/user/login', { username: testUsername, password: '123456' })
  test('U-06', '测试用户登录', r.status === 200 && r.data.success, `${r.time}ms`)
  testUserToken = r.data.token

  // U-07: 获取用户信息（已认证）
  r = await request('GET', '/user/info', null, adminToken)
  test('U-07', '获取用户信息', r.status === 200 && r.data.success && r.data.user, `${r.time}ms`)

  // U-08: 修改邮箱
  r = await request('PUT', '/user/email', { email: 'newemail@test.com' }, testUserToken)
  test('U-08', '修改邮箱', r.status === 200 && r.data.success, `${r.time}ms`)

  // U-09: 无效邮箱格式
  r = await request('PUT', '/user/email', { email: 'invalid-email' }, testUserToken)
  test('U-09', '无效邮箱格式', r.status === 400, `${r.time}ms`)
}

const testStoryModule = async () => {
  printSection('游戏引擎模块测试')

  // G-01: 获取章节列表
  let r = await request('GET', '/story/chapters')
  test('G-01', '获取章节列表', r.status === 200 && r.data.success, `${r.time}ms, ${r.data.chapters?.length || 0}个章节`)

  // G-02: 获取章节节点
  r = await request('GET', '/story/chapter/1/nodes')
  const nodeCount = r.data.nodes?.length || 0
  test('G-02', '获取章节节点', r.status === 200 && r.data.success && nodeCount > 0, `${r.time}ms, ${nodeCount}个节点`)

  // G-03: 获取单个节点详情
  if (nodeCount > 0) {
    const firstNodeId = r.data.nodes[0].id
    r = await request('GET', `/story/node/${firstNodeId}`)
    test('G-03', '获取节点详情', r.status === 200 && r.data.success && r.data.node, `${r.time}ms`)

    // G-04: 验证节点包含必要字段
    const node = r.data.node
    const hasFields = node.character_name && node.dialogue_text !== undefined && node.node_key
    test('G-04', '节点数据完整性', hasFields, `字段: character_name, dialogue_text, node_key`)
  }

  // G-05: 保存游戏进度（已登录）
  r = await request('POST', '/story/progress', { chapterId: 1, currentNodeId: 1 }, testUserToken)
  test('G-05', '保存游戏进度', r.status === 200 && r.data.success, `${r.time}ms`)

  // G-06: 获取游戏进度
  r = await request('GET', '/story/progress', null, testUserToken)
  test('G-06', '获取游戏进度', r.status === 200 && r.data.success, `${r.time}ms`)

  // G-07: 获取不存在的节点
  r = await request('GET', '/story/node/99999')
  test('G-07', '获取不存在的节点', r.status === 404, `${r.time}ms`)
}

const testAdminModule = async () => {
  printSection('管理后台模块测试')

  // A-01: 获取管理统计数据
  let r = await request('GET', '/admin/stats', null, adminToken)
  test('A-01', '获取管理统计数据', r.status === 200 && r.data.success && r.data.stats, `${r.time}ms`)

  // A-02: 获取用户列表
  r = await request('GET', '/admin/users', null, adminToken)
  test('A-02', '获取用户列表', r.status === 200 && r.data.success, `${r.time}ms, ${r.data.users?.length || 0}个用户`)

  // A-03: 获取章节进度
  r = await request('GET', '/admin/chapter-progress', null, adminToken)
  test('A-03', '获取章节进度', r.status === 200 && r.data.success, `${r.time}ms`)

  // A-04: 获取选择统计
  r = await request('GET', '/admin/choice-stats', null, adminToken)
  test('A-04', '获取选择统计', r.status === 200 && r.data.success, `${r.time}ms`)

  // A-05: 普通用户访问管理接口
  r = await request('GET', '/admin/stats', null, testUserToken)
  test('A-05', '普通用户访问管理接口（应拒绝）', r.status === 403, `${r.time}ms`)

  // A-06: 获取故事章节列表（管理）
  r = await request('GET', '/admin/story/chapters', null, adminToken)
  test('A-06', '管理端获取章节列表', r.status === 200 && r.data.success, `${r.time}ms`)

  // A-07: 获取章节节点（管理）
  r = await request('GET', '/admin/story/nodes/1', null, adminToken)
  test('A-07', '管理端获取章节节点', r.status === 200 && r.data.success, `${r.time}ms`)
}

const testCommunityModule = async () => {
  printSection('社区模块测试')

  // C-01: 发布帖子
  let r = await request('POST', '/community/posts', {
    title: '测试帖子_' + Date.now(),
    content: '这是一条系统测试自动发布的帖子'
  }, testUserToken)
  test('C-01', '发布帖子', r.status === 200 && r.data.success, `${r.time}ms`)
  testPostId = r.data.postId

  // C-02: 获取帖子列表
  r = await request('GET', '/community/posts')
  test('C-02', '获取帖子列表', r.status === 200 && r.data.success, `${r.time}ms, ${r.data.posts?.length || 0}条帖子`)

  // C-03: 发表评论
  if (testPostId) {
    r = await request('POST', `/community/posts/${testPostId}/comments`, {
      content: '这是一条测试评论'
    }, testUserToken)
    test('C-03', '发表评论', r.status === 200 && r.data.success, `${r.time}ms`)
  }

  // C-04: 点赞帖子
  if (testPostId) {
    r = await request('POST', `/community/posts/${testPostId}/like`, null, testUserToken)
    test('C-04', '点赞帖子', r.status === 200 && r.data.success, `${r.time}ms`)
  }

  // C-05: 重复点赞（应取消）
  if (testPostId) {
    r = await request('POST', `/community/posts/${testPostId}/like`, null, testUserToken)
    test('C-05', '重复点赞（取消点赞）', r.status === 200 && r.data.success, `${r.time}ms`)
  }

  // C-06: 未登录发帖
  r = await request('POST', '/community/posts', { title: 'test', content: 'test' })
  test('C-06', '未登录发帖（应拒绝）', r.status === 401 || r.status === 403, `${r.time}ms`)
}

// ==================== 安全性测试 ====================

const testSecurity = async () => {
  printSection('安全性测试')

  // S-01: SQL注入测试 - 登录
  let r = await request('POST', '/user/login', { username: "' OR 1=1 --", password: 'anything' })
  test('S-01', 'SQL注入防护（登录）', r.status === 401, `${r.time}ms, 参数化查询有效`)

  // S-02: SQL注入测试 - 注册
  r = await request('POST', '/user/register', { username: "'; DROP TABLE users; --", password: '123456' })
  test('S-02', 'SQL注入防护（注册）', r.status === 201 || r.status === 400, `${r.time}ms`)

  // S-03: 无token访问受保护接口
  r = await request('GET', '/user/info')
  test('S-03', '无token访问受保护接口', r.status === 401 || r.status === 403, `${r.time}ms`)

  // S-04: 伪造token
  r = await request('GET', '/user/info', null, 'fake.token.here')
  test('S-04', '伪造token访问', r.status === 401 || r.status === 403, `${r.time}ms`)

  // S-05: 普通用户访问管理接口
  r = await request('GET', '/admin/users', null, testUserToken)
  test('S-05', '越权访问管理接口', r.status === 403, `${r.time}ms`)
}

// ==================== API性能测试 ====================

const testPerformance = async () => {
  printSection('API性能测试（每接口请求10次取平均值）')

  const apis = [
    { name: 'POST /user/login', method: 'POST', path: '/user/login', body: { username: 'admin', password: 'admin' } },
    { name: 'GET /user/info', method: 'GET', path: '/user/info', token: adminToken },
    { name: 'GET /story/chapters', method: 'GET', path: '/story/chapters' },
    { name: 'GET /story/chapter/1/nodes', method: 'GET', path: '/story/chapter/1/nodes' },
    { name: 'GET /admin/stats', method: 'GET', path: '/admin/stats', token: adminToken },
    { name: 'GET /admin/users', method: 'GET', path: '/admin/users', token: adminToken },
    { name: 'GET /community/posts', method: 'GET', path: '/community/posts' },
  ]

  console.log('')
  console.log(`${'接口'.padEnd(35)}${'平均(ms)'.padStart(10)}${'最小(ms)'.padStart(10)}${'最大(ms)'.padStart(10)}`)
  console.log('-'.repeat(65))

  for (const api of apis) {
    const times = []
    for (let i = 0; i < 10; i++) {
      const r = await request(api.method, api.path, api.body || null, api.token || null)
      times.push(r.time)
    }
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)
    const min = Math.min(...times)
    const max = Math.max(...times)
    console.log(`${api.name.padEnd(35)}${String(avg).padStart(10)}${String(min).padStart(10)}${String(max).padStart(10)}`)
  }
}

// ==================== 清理测试数据 ====================

const cleanup = async () => {
  printSection('清理测试数据')

  // 删除测试帖子
  if (testPostId && adminToken) {
    try {
      await request('DELETE', `/community/posts/${testPostId}`, null, adminToken)
      console.log('已清理测试帖子')
    } catch (e) { /* ignore */ }
  }

  // 删除测试用户
  if (testUserId && adminToken) {
    try {
      await request('DELETE', `/admin/users/${testUserId}`, null, adminToken)
      console.log('已清理测试用户')
    } catch (e) { /* ignore */ }
  }
}

// ==================== 主流程 ====================

const main = async () => {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║          東方夢蝶譚 - 系统测试报告                      ║')
  console.log('║          测试时间:', new Date().toLocaleString('zh-CN'), '                ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  try {
    await testUserModule()
    await testStoryModule()
    await testAdminModule()
    await testCommunityModule()
    await testSecurity()
    await testPerformance()
    await cleanup()
  } catch (error) {
    console.error('\n测试过程中出错:', error.message)
  }

  // 汇总
  printSection('测试汇总')
  console.log(`总测试数: ${passCount + failCount}`)
  console.log(`通过: ${passCount}`)
  console.log(`失败: ${failCount}`)
  console.log(`通过率: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`)
}

main()
