<template>
  <div class="admin-page">
    <!-- 返回首页按钮 -->
    <button class="back-home-btn" @click="$router.push('/')">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span>返回首页</span>
    </button>

    <div class="admin-container">
      <h1>管理员后台</h1>
      
      <!-- 标签页切换 -->
      <div class="tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'overview' }]"
          @click="activeTab = 'overview'"
        >
          数据概览
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          用户管理
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'community' }]"
          @click="activeTab = 'community'"
        >
          社区管理
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'story' }]"
          @click="activeTab = 'story'"
        >
          故事管理
        </button>
      </div>

      <!-- 数据概览标签页 -->
      <div v-show="activeTab === 'overview'" class="tab-content">
      
      <!-- 统计概览 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🎮</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeUsers }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalChoices }}</div>
            <div class="stat-label">总选择次数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgProgress }}%</div>
            <div class="stat-label">平均进度</div>
          </div>
        </div>
      </div>

      <!-- 圆环图可视化 -->
      <div class="charts-grid">
        <!-- 章节完成度圆环图 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>章节完成度分布</h2>
          </div>
          <div class="card-body chart-container">
            <canvas ref="chapterChart"></canvas>
          </div>
        </div>

        <!-- 用户活跃度圆环图 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>用户活跃度</h2>
          </div>
          <div class="card-body chart-container">
            <canvas ref="activityChart"></canvas>
          </div>
        </div>
      </div>

      <!-- 用户选择数据分析 -->
      <div class="admin-card">
        <div class="card-header">
          <h2>用户选择数据分析</h2>
        </div>
        <div class="card-body">
          <div v-if="choiceStats.length > 0" class="choice-stats">
            <div v-for="stat in choiceStats" :key="stat.choice_id" class="choice-item">
              <div class="choice-info">
                <div class="choice-text">{{ stat.choice_text }}</div>
                <div class="choice-node">节点：{{ stat.node_key }}</div>
              </div>
              <div class="choice-data">
                <div class="choice-count">{{ stat.count }} 次选择</div>
                <div class="choice-bar">
                  <div class="choice-fill" :style="{ width: stat.percentage + '%' }"></div>
                </div>
                <div class="choice-percentage">{{ stat.percentage }}%</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无用户选择数据</p>
          </div>
        </div>
      </div>
      </div>

      <!-- 用户管理标签页 -->
      <div v-show="activeTab === 'users'" class="tab-content">
      <!-- 用户列表 -->
      <div class="admin-card">
        <div class="card-header">
          <h2>用户列表</h2>
          <div class="pagination-info">
            共 {{ totalUsers }} 个用户，第 {{ currentPage }} / {{ totalPages }} 页
          </div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>注册时间</th>
                  <th>游戏进度</th>
                  <th>选择次数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in paginatedUsers" :key="user.id" @click="viewUserDetail(user.id)" class="user-row">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.email || '未设置' }}</td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td>{{ user.progress_count }} 个章节</td>
                  <td>{{ user.choice_count }} 次</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- 分页控件 -->
          <div class="pagination">
            <button 
              class="page-btn" 
              @click="prevPage" 
              :disabled="currentPage === 1"
            >
              上一页
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in visiblePages" 
                :key="page"
                :class="['page-number', { active: page === currentPage }]"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              class="page-btn" 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- 章节进度分布 -->
      <div class="admin-card">
        <div class="card-header">
          <h2>章节进度分布</h2>
        </div>
        <div class="card-body">
          <div v-if="chapterProgress.length > 0" class="chapter-progress">
            <div v-for="chapter in chapterProgress" :key="chapter.chapter_id" class="chapter-item">
              <div class="chapter-title">{{ chapter.chapter_title }}</div>
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: chapter.percentage + '%' }"></div>
                </div>
                <div class="progress-text">{{ chapter.user_count }} 人 ({{ chapter.percentage }}%)</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无章节进度数据</p>
          </div>
        </div>
      </div>
      </div>

      <!-- 社区管理标签页 -->
      <div v-show="activeTab === 'community'" class="tab-content">
        <!-- 社区统计 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-info">
              <div class="stat-value">{{ communityStats.totalPosts }}</div>
              <div class="stat-label">总帖子数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-info">
              <div class="stat-value">{{ communityStats.totalComments }}</div>
              <div class="stat-label">总评论数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">❤️</div>
            <div class="stat-info">
              <div class="stat-value">{{ communityStats.totalLikes }}</div>
              <div class="stat-label">总点赞数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-info">
              <div class="stat-value">{{ communityStats.activeUsers }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </div>
        </div>

        <!-- 帖子管理 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>帖子管理</h2>
            <div class="header-actions">
              <input 
                v-model="postSearchQuery" 
                type="text" 
                placeholder="搜索帖子标题或内容..."
                class="search-input"
                @input="searchPosts"
              />
              <button @click="refreshPosts" class="refresh-btn" title="刷新帖子列表">
                🔄 刷新
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table class="post-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>标题</th>
                    <th>作者</th>
                    <th>浏览</th>
                    <th>点赞</th>
                    <th>评论</th>
                    <th>状态</th>
                    <th>发布时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="post in communityPosts" :key="post.id">
                    <td>{{ post.id }}</td>
                    <td class="post-title">
                      <span v-if="post.is_official" class="badge official">官方</span>
                      <span v-if="post.is_pinned" class="badge pinned">置顶</span>
                      <span class="clickable-title" @click="viewPostDetail(post.id)">{{ post.title }}</span>
                    </td>
                    <td>
                      <span class="clickable-author" @click="viewAuthorProfile(post.user_id)">{{ post.username }}</span>
                    </td>
                    <td>{{ post.view_count }}</td>
                    <td>{{ post.like_count }}</td>
                    <td>{{ post.comment_count }}</td>
                    <td>
                      <span :class="['status-badge', post.is_official ? 'official' : 'normal']">
                        {{ post.is_official ? '官方' : '普通' }}
                      </span>
                    </td>
                    <td>{{ formatDate(post.created_at) }}</td>
                    <td class="action-cell">
                      <button 
                        @click="togglePin(post)" 
                        :class="['action-btn', post.is_pinned ? 'unpin' : 'pin']"
                        :title="post.is_pinned ? '取消置顶' : '置顶'"
                      >
                        {{ post.is_pinned ? '📌' : '📍' }}
                      </button>
                      <button 
                        @click="toggleOfficial(post)" 
                        :class="['action-btn', post.is_official ? 'unofficial' : 'official']"
                        :title="post.is_official ? '取消官方' : '设为官方'"
                      >
                        {{ post.is_official ? '⭐' : '☆' }}
                      </button>
                      <button 
                        @click="deletePost(post.id)" 
                        class="action-btn delete"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- 帖子分页 -->
            <div class="pagination" v-if="postTotalPages > 1">
              <button 
                class="page-btn" 
                @click="loadCommunityPosts(postCurrentPage - 1)" 
                :disabled="postCurrentPage === 1"
              >
                上一页
              </button>
              
              <span class="page-info">第 {{ postCurrentPage }} / {{ postTotalPages }} 页</span>
              
              <button 
                class="page-btn" 
                @click="loadCommunityPosts(postCurrentPage + 1)" 
                :disabled="postCurrentPage === postTotalPages"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        <!-- 评论管理 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>评论管理</h2>
          </div>
          <div class="card-body">
            <div class="comments-list">
              <div v-for="comment in communityComments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <img 
                    :src="getUserAvatar(comment.avatar)" 
                    alt="头像" 
                    class="comment-avatar"
                  />
                  <div class="comment-info">
                    <div class="comment-author">{{ comment.username }}</div>
                    <div class="comment-meta">
                      评论于帖子：<span class="post-link clickable-post" @click="viewPostDetail(comment.post_id)">{{ comment.post_title }}</span>
                      <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                    </div>
                  </div>
                  <button 
                    @click="deleteComment(comment.id)" 
                    class="delete-comment-btn"
                    title="删除评论"
                  >
                    删除
                  </button>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-stats">
                  <span>❤️ {{ comment.like_count }} 点赞</span>
                </div>
              </div>
            </div>
            
            <!-- 评论分页 -->
            <div class="pagination" v-if="commentTotalPages > 1">
              <button 
                class="page-btn" 
                @click="loadCommunityComments(commentCurrentPage - 1)" 
                :disabled="commentCurrentPage === 1"
              >
                上一页
              </button>
              
              <span class="page-info">第 {{ commentCurrentPage }} / {{ commentTotalPages }} 页</span>
              
              <button 
                class="page-btn" 
                @click="loadCommunityComments(commentCurrentPage + 1)" 
                :disabled="commentCurrentPage === commentTotalPages"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 故事管理标签页 -->
      <div v-show="activeTab === 'story'" class="tab-content">
        <!-- 进阶功能工具栏 -->
        <div class="advanced-toolbar">
          <button 
            @click="showFlowChart = true" 
            class="toolbar-action-btn"
            :title="nodeFilterChapter ? '查看当前章节的流程图' : '请先在下方选择一个章节'"
          >
            🗺️ 可视化流程图
          </button>
          <button @click="showBatchOps = true" class="toolbar-action-btn" title="批量删除、导入导出">
            📦 批量操作
          </button>
          <button @click="showAdvancedSearch = true" class="toolbar-action-btn" title="搜索和筛选节点">
            🔍 高级搜索
          </button>
        </div>

        <!-- 章节管理 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>章节管理</h2>
            <button @click="openChapterModal(null)" class="add-btn">
              ➕ 新建章节
            </button>
          </div>
          <div class="card-body">
            <div v-if="storyChapters.length > 0" class="chapters-grid">
              <div 
                v-for="chapter in storyChapters" 
                :key="chapter.id" 
                class="chapter-card"
                @click="selectChapterFilter(chapter.id)"
              >
                <div class="chapter-header">
                  <h3>{{ chapter.title }}</h3>
                  <div class="chapter-actions">
                    <button 
                      @click.stop="openChapterModal(chapter)" 
                      class="icon-btn edit"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button 
                      @click.stop="deleteChapterConfirm(chapter)" 
                      class="icon-btn delete"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="chapter-description">{{ chapter.description || '暂无描述' }}</div>
                <div class="chapter-stats">
                  <span>📄 {{ chapter.node_count }} 个节点</span>
                  <span>🔀 {{ chapter.choice_count }} 个选项</span>
                  <span>📊 顺序: {{ chapter.chapter_order }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>暂无章节，点击"新建章节"开始创建</p>
            </div>
          </div>
        </div>

        <!-- 节点管理 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>节点管理</h2>
            <div class="header-actions">
              <select 
                v-model="nodeFilterChapter" 
                class="chapter-filter"
                @change="loadStoryNodes"
              >
                <option :value="null">全部章节</option>
                <option 
                  v-for="chapter in storyChapters" 
                  :key="chapter.id" 
                  :value="chapter.id"
                >
                  {{ chapter.title }}
                </option>
              </select>
              <button @click="openNodeModal(null)" class="add-btn">
                ➕ 新建节点
              </button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="storyNodes.length > 0" class="table-container">
              <table class="story-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>节点标识</th>
                    <th>章节</th>
                    <th>角色</th>
                    <th>对话内容</th>
                    <th>选项数</th>
                    <th>顺序</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="node in storyNodes" :key="node.id" class="story-row">
                    <td>{{ node.id }}</td>
                    <td class="node-key">{{ node.node_key }}</td>
                    <td>{{ node.chapter_title }}</td>
                    <td>{{ node.character_name || '-' }}</td>
                    <td class="dialogue-preview">{{ node.dialogue_text.substring(0, 50) }}...</td>
                    <td>{{ node.choice_count }}</td>
                    <td>{{ node.node_order }}</td>
                    <td class="action-cell">
                      <button 
                        @click="previewNode(node)" 
                        class="action-btn preview"
                        title="预览"
                      >
                        👁️
                      </button>
                      <button 
                        @click="openNodeModal(node)" 
                        class="action-btn edit"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button 
                        @click="deleteNodeConfirm(node)" 
                        class="action-btn delete"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state">
              <p>{{ nodeFilterChapter ? '该章节暂无节点' : '暂无节点，点击"新建节点"开始创建' }}</p>
            </div>

            <!-- 节点分页 -->
            <div class="pagination" v-if="nodeTotalPages > 1">
              <button 
                class="page-btn" 
                @click="loadStoryNodes(nodeCurrentPage - 1)" 
                :disabled="nodeCurrentPage === 1"
              >
                上一页
              </button>
              <span class="page-info">第 {{ nodeCurrentPage }} / {{ nodeTotalPages }} 页</span>
              <button 
                class="page-btn" 
                @click="loadStoryNodes(nodeCurrentPage + 1)" 
                :disabled="nodeCurrentPage === nodeTotalPages"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        <!-- 验证工具 -->
        <div class="admin-card">
          <div class="card-header">
            <h2>故事验证</h2>
            <button @click="validateStory" class="validate-btn">
              🔍 验证故事完整性
            </button>
          </div>
          <div class="card-body">
            <div v-if="validationIssues.length > 0" class="validation-results">
              <div 
                v-for="(issue, index) in validationIssues" 
                :key="index"
                :class="['validation-issue', issue.severity]"
              >
                <div class="issue-header">
                  <span class="issue-icon">
                    {{ issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️' }}
                  </span>
                  <span class="issue-message">{{ issue.message }}</span>
                </div>
                <div v-if="issue.details && issue.details.length > 0" class="issue-details">
                  <div v-for="detail in issue.details.slice(0, 5)" :key="detail.id" class="detail-item">
                    {{ detail.node_key || detail.from_node }}: {{ detail.dialogue_text?.substring(0, 30) || detail.choice_text }}...
                  </div>
                  <div v-if="issue.details.length > 5" class="more-details">
                    还有 {{ issue.details.length - 5 }} 个...
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>点击"验证故事完整性"按钮检查故事是否存在问题</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 章节编辑弹窗 -->
    <div v-if="showChapterModal" class="modal-overlay" @click="closeChapterModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ chapterForm.id ? '编辑章节' : '新建章节' }}</h2>
          <button class="close-btn" @click="closeChapterModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>章节标题 *</label>
            <input 
              v-model="chapterForm.title" 
              type="text" 
              placeholder="请输入章节标题"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>章节描述</label>
            <textarea 
              v-model="chapterForm.description" 
              placeholder="请输入章节描述"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>章节顺序 *</label>
            <input 
              v-model.number="chapterForm.chapter_order" 
              type="number" 
              min="1"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeChapterModal" class="cancel-btn">取消</button>
          <button @click="saveChapter" class="save-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 节点编辑弹窗 -->
    <div v-if="showNodeModal" class="modal-overlay" @click="closeNodeModal">
      <div class="edit-modal large" @click.stop>
        <div class="modal-header">
          <h2>{{ nodeForm.id ? '编辑节点' : '新建节点' }}</h2>
          <button class="close-btn" @click="closeNodeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>所属章节 *</label>
              <select v-model.number="nodeForm.chapter_id" class="form-input">
                <option :value="null">请选择章节</option>
                <option 
                  v-for="chapter in storyChapters" 
                  :key="chapter.id" 
                  :value="chapter.id"
                >
                  {{ chapter.title }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>节点标识 *</label>
              <input 
                v-model="nodeForm.node_key" 
                type="text" 
                placeholder="如: chapter1_node1"
                class="form-input"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>角色名称</label>
              <input 
                v-model="nodeForm.character_name" 
                type="text" 
                placeholder="角色名称"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>节点顺序 *</label>
              <input 
                v-model.number="nodeForm.node_order" 
                type="number" 
                min="1"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>角色立绘路径</label>
            <input 
              v-model="nodeForm.character_image" 
              type="text" 
              placeholder="/images/character.png"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>背景图路径</label>
            <input 
              v-model="nodeForm.background_image" 
              type="text" 
              placeholder="/images/background.jpg"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>对话文本 *</label>
            <textarea 
              v-model="nodeForm.dialogue_text" 
              placeholder="请输入对话内容"
              class="form-textarea"
              rows="5"
            ></textarea>
          </div>

          <!-- 选项管理 -->
          <div v-if="nodeForm.id" class="choices-section">
            <div class="section-header">
              <h3>选项管理</h3>
              <button @click="addChoice" class="add-choice-btn">➕ 添加选项</button>
            </div>
            <div v-if="selectedNode && selectedNode.choices && selectedNode.choices.length > 0" class="choices-list">
              <div 
                v-for="(choice, index) in selectedNode.choices" 
                :key="choice.id"
                class="choice-item"
              >
                <div class="choice-order">{{ index + 1 }}</div>
                <div class="choice-content">
                  <div class="choice-text">{{ choice.choice_text }}</div>
                  <div class="choice-target">
                    → {{ choice.next_node_id ? `节点 ${choice.next_node_id}` : '结束' }}
                  </div>
                </div>
                <div class="choice-actions">
                  <button @click="editChoice(choice)" class="icon-btn edit">✏️</button>
                  <button @click="deleteChoiceConfirm(choice)" class="icon-btn delete">🗑️</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-choices">
              <p>暂无选项，点击"添加选项"创建分支</p>
            </div>
          </div>
          <div v-else class="info-message">
            💡 保存节点后可以添加选项
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeNodeModal" class="cancel-btn">取消</button>
          <button @click="saveNode" class="save-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 选项编辑弹窗 -->
    <div v-if="showChoiceModal" class="modal-overlay" @click="closeChoiceModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ choiceForm.id ? '编辑选项' : '新建选项' }}</h2>
          <button class="close-btn" @click="closeChoiceModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>选项文本 *</label>
            <input 
              v-model="choiceForm.choice_text" 
              type="text" 
              placeholder="请输入选项文本"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>目标节点</label>
            <select v-model.number="choiceForm.next_node_id" class="form-input">
              <option :value="null">结束（无下一节点）</option>
              <option 
                v-for="node in storyNodesSimple" 
                :key="node.id" 
                :value="node.id"
              >
                [{{ node.chapter_title }}] {{ node.node_key }}: {{ node.preview }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>选项顺序 *</label>
            <input 
              v-model.number="choiceForm.choice_order" 
              type="number" 
              min="1"
              class="form-input"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeChoiceModal" class="cancel-btn">取消</button>
          <button @click="saveChoice" class="save-btn">保存</button>
        </div>
      </div>
    </div>

    <!-- 用户详情弹窗 -->
    <div v-if="showUserDetail" class="modal-overlay" @click="closeUserDetail">
      <div class="user-detail-modal" @click.stop>
        <button class="close-btn" @click="closeUserDetail">×</button>
        
        <div v-if="selectedUser" class="user-detail-content">
          <div class="user-header">
            <img 
              :src="getUserAvatar(selectedUser.avatar)" 
              alt="用户头像" 
              class="user-avatar-large"
            />
            <div class="user-info-header">
              <h2>{{ selectedUser.username }}</h2>
              <div class="user-id">ID: {{ selectedUser.id }}</div>
            </div>
          </div>

          <div class="user-details">
            <div class="detail-item">
              <span class="detail-label">邮箱：</span>
              <span class="detail-value">{{ selectedUser.email || '未设置' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">注册时间：</span>
              <span class="detail-value">{{ formatDate(selectedUser.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">游戏进度：</span>
              <span class="detail-value">{{ selectedUser.progress_count }} 个章节</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">选择次数：</span>
              <span class="detail-value">{{ selectedUser.choice_count }} 次</span>
            </div>
            <div v-if="selectedUser.banned_until && isBanned(selectedUser.banned_until)" class="detail-item ban-status">
              <span class="detail-label">封禁状态：</span>
              <span class="detail-value banned">{{ isPermanentBan(selectedUser.banned_until) ? '永久封禁' : '已封禁至 ' + formatDateTime(selectedUser.banned_until) }}</span>
            </div>
            <div v-if="selectedUser.ban_reason && isBanned(selectedUser.banned_until)" class="detail-item">
              <span class="detail-label">封禁原因：</span>
              <span class="detail-value">{{ selectedUser.ban_reason }}</span>
            </div>
          </div>

          <div class="ban-section">
            <h3>账户管理</h3>
            
            <div v-if="!isBanned(selectedUser.banned_until)" class="ban-form">
              <div class="form-group">
                <label>封禁时长：</label>
                <select v-model="banDuration" class="ban-select">
                  <option :value="1">1小时</option>
                  <option :value="6">6小时</option>
                  <option :value="24">1天</option>
                  <option :value="72">3天</option>
                  <option :value="168">7天</option>
                  <option :value="720">30天</option>
                  <option :value="8760">1年</option>
                  <option :value="-1">永久封禁</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>封禁原因：</label>
                <textarea 
                  v-model="banReason" 
                  class="ban-reason-input"
                  placeholder="请输入封禁原因..."
                  rows="3"
                ></textarea>
              </div>
              
              <button @click="banUser" class="ban-btn">封禁账户</button>
            </div>
            
            <div v-else class="unban-section">
              <p class="ban-info">该用户已被封禁</p>
              <button @click="unbanUser" class="unban-btn">解除封禁</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 帖子详情弹窗 -->
    <div v-if="showPostDetail" class="modal-overlay" @click="closePostDetail">
      <div class="post-detail-modal" @click.stop>
        <button class="close-btn" @click="closePostDetail">×</button>
        
        <div v-if="selectedPost" class="post-detail-content">
          <div class="post-detail-header">
            <div class="post-badges">
              <span v-if="selectedPost.is_official" class="badge official">官方</span>
              <span v-if="selectedPost.is_pinned" class="badge pinned">置顶</span>
            </div>
            <h2 class="post-detail-title">{{ selectedPost.title }}</h2>
            <div class="post-detail-meta">
              <img 
                :src="getUserAvatar(selectedPost.avatar)" 
                alt="作者头像" 
                class="author-avatar"
              />
              <div class="author-info">
                <span class="author-name clickable-author" @click="viewAuthorProfile(selectedPost.user_id)">
                  {{ selectedPost.username }}
                </span>
                <span class="post-time">{{ formatDateTime(selectedPost.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="post-detail-body">
            <div class="post-content">{{ selectedPost.content }}</div>
            
            <div class="post-stats">
              <span>👁️ {{ selectedPost.view_count }} 浏览</span>
              <span>❤️ {{ selectedPost.like_count }} 点赞</span>
              <span>💬 {{ selectedPost.comment_count }} 评论</span>
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="post-comments-section">
            <h3>评论列表 ({{ postComments.length }})</h3>
            <div v-if="postComments.length > 0" class="post-comments-list">
              <div v-for="comment in postComments" :key="comment.id" class="post-comment-item">
                <img 
                  :src="getUserAvatar(comment.avatar)" 
                  alt="头像" 
                  class="comment-user-avatar"
                />
                <div class="comment-main">
                  <div class="comment-user-info">
                    <span class="comment-username clickable-author" @click="viewAuthorProfile(comment.user_id)">
                      {{ comment.username }}
                    </span>
                    <span class="comment-date">{{ formatDateTime(comment.created_at) }}</span>
                  </div>
                  <div class="comment-text">{{ comment.content }}</div>
                  <div class="comment-actions">
                    <span class="comment-likes">❤️ {{ comment.like_count }}</span>
                    <button 
                      @click="deleteCommentFromPost(comment.id)" 
                      class="delete-comment-small-btn"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-comments">
              <p>暂无评论</p>
            </div>
          </div>

          <div class="post-detail-actions">
            <button 
              @click="togglePin(selectedPost)" 
              :class="['detail-action-btn', selectedPost.is_pinned ? 'active' : '']"
            >
              {{ selectedPost.is_pinned ? '📌 已置顶' : '📍 置顶' }}
            </button>
            <button 
              @click="toggleOfficial(selectedPost)" 
              :class="['detail-action-btn', selectedPost.is_official ? 'active' : '']"
            >
              {{ selectedPost.is_official ? '⭐ 官方帖' : '☆ 设为官方' }}
            </button>
            <button 
              @click="deletePostFromDetail(selectedPost.id)" 
              class="detail-action-btn delete"
            >
              🗑️ 删除帖子
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 进阶功能组件 -->
    <StoryFlowChart 
      v-if="showFlowChart && flowChartData.nodes.length > 0"
      :chapterData="flowChartData"
      @close="showFlowChart = false"
      @nodeClick="previewNode"
    />

    <div v-if="showBatchOps" class="modal-overlay" @click="showBatchOps = false">
      <div @click.stop style="max-width: 800px; width: 100%;">
        <StoryBatchOperations 
          :chapters="storyChapters"
          @close="showBatchOps = false"
          @refresh="loadStoryChapters"
        />
      </div>
    </div>

    <div v-if="showAdvancedSearch" class="modal-overlay" @click="showAdvancedSearch = false">
      <div @click.stop style="max-width: 900px; width: 100%;">
        <StoryAdvancedSearch 
          :chapters="storyChapters"
          :allNodes="allNodesForSearch"
          @selectNode="selectNodeFromSearch"
        />
      </div>
    </div>

    <StoryNodePreview 
      v-if="showNodePreview && previewNodeData"
      :node="previewNodeData"
      :choices="previewNodeChoices"
      :chapterTitle="previewNodeData.chapterTitle || '未知章节'"
      @close="showNodePreview = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { adminStoryApi } from '../api/admin-story'
import axios from 'axios'
import { Chart, registerables } from 'chart.js'
import StoryFlowChart from '../components/StoryFlowChart.vue'
import StoryBatchOperations from '../components/StoryBatchOperations.vue'
import StoryAdvancedSearch from '../components/StoryAdvancedSearch.vue'
import StoryNodePreview from '../components/StoryNodePreview.vue'

Chart.register(...registerables)

const router = useRouter()
const userStore = useUserStore()

const chapterChart = ref(null)
const activityChart = ref(null)
let chapterChartInstance = null
let activityChartInstance = null

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalChoices: 0,
  avgProgress: 0
})

const users = ref([])
const choiceStats = ref([])
const chapterProgress = ref([])

// 标签页
const activeTab = ref('overview')

// 用户详情相关
const showUserDetail = ref(false)
const selectedUser = ref(null)
const banDuration = ref(24) // 默认1天
const banReason = ref('违反社区规定')

// 帖子详情相关
const showPostDetail = ref(false)
const selectedPost = ref(null)
const postComments = ref([])

// 社区管理相关
const communityStats = ref({
  totalPosts: 0,
  totalComments: 0,
  totalLikes: 0,
  activeUsers: 0
})
const communityPosts = ref([])
const communityComments = ref([])
const postSearchQuery = ref('')
const postCurrentPage = ref(1)
const postTotalPages = ref(1)
const commentCurrentPage = ref(1)
const commentTotalPages = ref(1)

// 故事管理相关
const storyChapters = ref([])
const storyNodes = ref([])
const storyNodesSimple = ref([])
const selectedChapter = ref(null)
const selectedNode = ref(null)
const showChapterModal = ref(false)
const showNodeModal = ref(false)
const showChoiceModal = ref(false)

// 进阶功能状态
const showFlowChart = ref(false)
const showBatchOps = ref(false)
const showAdvancedSearch = ref(false)
const showNodePreview = ref(false)
const previewNodeData = ref(null)
const previewNodeChoices = ref([])
const flowChartData = ref({ nodes: [], choices: [] })
const allNodesForSearch = ref([])

const chapterForm = ref({
  id: null,
  title: '',
  description: '',
  chapter_order: 1
})
const nodeForm = ref({
  id: null,
  chapter_id: null,
  node_key: '',
  character_name: '',
  character_image: '',
  background_image: '',
  dialogue_text: '',
  node_order: 1
})
const choiceForm = ref({
  id: null,
  node_id: null,
  choice_text: '',
  next_node_id: null,
  choice_order: 1
})
const nodeCurrentPage = ref(1)
const nodeTotalPages = ref(1)
const nodeFilterChapter = ref(null)
const validationIssues = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = 10

// 计算属性
const totalUsers = computed(() => users.value.length)
const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return users.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 分页方法
const goToPage = (page) => {
  currentPage.value = page
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  })
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  return `${year}年${month}月${day}日${hour}时${minute}分`
}

// 检查是否被封禁
const isBanned = (bannedUntil) => {
  if (!bannedUntil) return false
  return new Date(bannedUntil) > new Date()
}

// 检查是否永久封禁（使用9999年作为永久封禁标记）
const isPermanentBan = (bannedUntil) => {
  if (!bannedUntil) return false
  const banDate = new Date(bannedUntil)
  return banDate.getFullYear() >= 9999
}

// 获取用户头像
const getUserAvatar = (avatar) => {
  if (!avatar) return '/img/fm.png'
  if (avatar.startsWith('http')) return avatar
  return `http://localhost:3000${avatar}`
}

// 查看用户详情
const viewUserDetail = async (userId) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      selectedUser.value = response.data.user
      showUserDetail.value = true
      // 重置表单
      banDuration.value = 24
      banReason.value = '违反社区规定'
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    alert('获取用户详情失败')
  }
}

// 关闭用户详情
const closeUserDetail = () => {
  showUserDetail.value = false
  selectedUser.value = null
}

// 封禁用户
const banUser = async () => {
  const durationText = banDuration.value === -1 ? '永久' : `${banDuration.value}小时`
  if (!confirm(`确定要封禁用户 ${selectedUser.value.username} ${durationText}吗？`)) {
    return
  }
  
  try {
    const response = await axios.post(
      `http://localhost:3000/api/admin/users/${selectedUser.value.id}/ban`,
      {
        duration: banDuration.value,
        reason: banReason.value
      },
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert('用户已被封禁')
      // 重新加载用户详情
      await viewUserDetail(selectedUser.value.id)
      // 重新加载用户列表
      await loadUsers()
    }
  } catch (error) {
    console.error('封禁用户失败:', error)
    alert('封禁用户失败')
  }
}

// 解封用户
const unbanUser = async () => {
  if (!confirm(`确定要解除用户 ${selectedUser.value.username} 的封禁吗？`)) {
    return
  }
  
  try {
    const response = await axios.post(
      `http://localhost:3000/api/admin/users/${selectedUser.value.id}/unban`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert('用户已解封')
      // 重新加载用户详情
      await viewUserDetail(selectedUser.value.id)
      // 重新加载用户列表
      await loadUsers()
    }
  } catch (error) {
    console.error('解封用户失败:', error)
    alert('解封用户失败')
  }
}

// ==================== 社区管理方法 ====================

// 加载社区统计
const loadCommunityStats = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/community/stats', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      communityStats.value = response.data.stats
    }
  } catch (error) {
    console.error('加载社区统计失败:', error)
  }
}

// 加载社区帖子
const loadCommunityPosts = async (page = 1) => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/community/posts', {
      params: {
        page,
        limit: 20,
        search: postSearchQuery.value
      },
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      communityPosts.value = response.data.posts
      postCurrentPage.value = response.data.page
      postTotalPages.value = Math.ceil(response.data.total / response.data.limit)
    }
  } catch (error) {
    console.error('加载帖子列表失败:', error)
  }
}

// 搜索帖子（防抖）
let searchTimeout = null
const searchPosts = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadCommunityPosts(1)
  }, 500)
}

// 刷新帖子列表
const refreshPosts = async () => {
  await Promise.all([
    loadCommunityStats(),
    loadCommunityPosts(postCurrentPage.value)
  ])
  alert('刷新成功')
}

// 删除帖子
const deletePost = async (postId) => {
  if (!confirm('确定要删除这个帖子吗？此操作不可恢复！')) {
    return
  }
  
  try {
    const response = await axios.delete(
      `http://localhost:3000/api/admin/community/posts/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert('帖子已删除')
      await loadCommunityPosts(postCurrentPage.value)
      await loadCommunityStats()
    }
  } catch (error) {
    console.error('删除帖子失败:', error)
    alert('删除帖子失败')
  }
}

// 切换置顶状态
const togglePin = async (post) => {
  try {
    const response = await axios.put(
      `http://localhost:3000/api/admin/community/posts/${post.id}/pin`,
      { isPinned: !post.is_pinned },
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert(response.data.message)
      await loadCommunityPosts(postCurrentPage.value)
      // 如果详情页打开，更新详情页数据
      if (showPostDetail.value && selectedPost.value && selectedPost.value.id === post.id) {
        selectedPost.value.is_pinned = !post.is_pinned
      }
    }
  } catch (error) {
    console.error('设置置顶状态失败:', error)
    alert('设置置顶状态失败')
  }
}

// 切换官方状态
const toggleOfficial = async (post) => {
  try {
    const response = await axios.put(
      `http://localhost:3000/api/admin/community/posts/${post.id}/official`,
      { isOfficial: !post.is_official },
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert(response.data.message)
      await loadCommunityPosts(postCurrentPage.value)
      // 如果详情页打开，更新详情页数据
      if (showPostDetail.value && selectedPost.value && selectedPost.value.id === post.id) {
        selectedPost.value.is_official = !post.is_official
      }
    }
  } catch (error) {
    console.error('设置官方状态失败:', error)
    alert('设置官方状态失败')
  }
}

// 加载社区评论
const loadCommunityComments = async (page = 1) => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/community/comments', {
      params: {
        page,
        limit: 50
      },
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      communityComments.value = response.data.comments
      commentCurrentPage.value = response.data.page
      commentTotalPages.value = Math.ceil(response.data.total / response.data.limit)
    }
  } catch (error) {
    console.error('加载评论列表失败:', error)
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？此操作不可恢复！')) {
    return
  }
  
  try {
    const response = await axios.delete(
      `http://localhost:3000/api/admin/community/comments/${commentId}`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert('评论已删除')
      await loadCommunityComments(commentCurrentPage.value)
      await loadCommunityStats()
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    alert('删除评论失败')
  }
}

// ==================== 帖子详情和导航 ====================

// 查看帖子详情
const viewPostDetail = async (postId) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/community/posts/${postId}`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      selectedPost.value = response.data.post
      showPostDetail.value = true
      // 加载该帖子的评论
      await loadPostComments(postId)
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    alert('获取帖子详情失败')
  }
}

// 加载帖子评论
const loadPostComments = async (postId) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/community/posts/${postId}/comments`, {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      postComments.value = response.data.comments
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    postComments.value = []
  }
}

// 关闭帖子详情
const closePostDetail = () => {
  showPostDetail.value = false
  selectedPost.value = null
  postComments.value = []
}

// 从详情页删除帖子
const deletePostFromDetail = async (postId) => {
  await deletePost(postId)
  closePostDetail()
}

// 从帖子详情删除评论
const deleteCommentFromPost = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？此操作不可恢复！')) {
    return
  }
  
  try {
    const response = await axios.delete(
      `http://localhost:3000/api/admin/community/comments/${commentId}`,
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    )
    
    if (response.data.success) {
      alert('评论已删除')
      // 重新加载当前帖子的评论
      await loadPostComments(selectedPost.value.id)
      // 更新帖子评论数
      selectedPost.value.comment_count = Math.max(0, selectedPost.value.comment_count - 1)
      // 刷新社区统计和帖子列表
      await loadCommunityStats()
      await loadCommunityPosts(postCurrentPage.value)
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    alert('删除评论失败')
  }
}

// 查看作者主页（复用用户详情弹窗）
const viewAuthorProfile = async (userId) => {
  await viewUserDetail(userId)
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      stats.value = response.data.stats
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载用户列表
const loadUsers = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      users.value = response.data.users
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

// 加载选择统计
const loadChoiceStats = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/choice-stats', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      choiceStats.value = response.data.stats
    }
  } catch (error) {
    console.error('加载选择统计失败:', error)
  }
}

// 加载章节进度
const loadChapterProgress = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/admin/chapter-progress', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (response.data.success) {
      chapterProgress.value = response.data.progress
      // 创建章节完成度圆环图
      createChapterChart()
    }
  } catch (error) {
    console.error('加载章节进度失败:', error)
  }
}

// 创建章节完成度圆环图
const createChapterChart = () => {
  if (!chapterChart.value) return
  
  // 销毁旧图表
  if (chapterChartInstance) {
    chapterChartInstance.destroy()
  }
  
  const ctx = chapterChart.value.getContext('2d')
  chapterChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chapterProgress.value.map(c => c.chapter_title),
      datasets: [{
        label: '完成人数',
        data: chapterProgress.value.map(c => c.user_count),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(118, 75, 162, 0.8)',
          'rgba(237, 100, 166, 0.8)',
          'rgba(255, 154, 158, 0.8)'
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(118, 75, 162, 1)',
          'rgba(237, 100, 166, 1)',
          'rgba(255, 154, 158, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${value}人 (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// 创建用户活跃度圆环图
const createActivityChart = () => {
  if (!activityChart.value) return
  
  // 销毁旧图表
  if (activityChartInstance) {
    activityChartInstance.destroy()
  }
  
  const ctx = activityChart.value.getContext('2d')
  const activeUsers = Math.min(stats.value.activeUsers, stats.value.totalUsers)
  const inactiveUsers = Math.max(stats.value.totalUsers - activeUsers, 0)
  
  activityChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['活跃用户', '未活跃用户'],
      datasets: [{
        label: '用户数',
        data: [activeUsers, inactiveUsers],
        backgroundColor: [
          'rgba(40, 167, 69, 0.8)',
          'rgba(220, 53, 69, 0.8)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${value}人 (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

onMounted(async () => {
  // 检查登录状态和管理员权限
  if (!userStore.token) {
    alert('请先登录')
    router.push('/')
    return
  }
  
  // 加载所有数据
  await Promise.all([
    loadStats(),
    loadUsers(),
    loadChoiceStats(),
    loadChapterProgress()
  ])
  
  // 创建活跃度图表（需要等stats加载完成）
  createActivityChart()
})

// ==================== 故事管理方法 ====================

// 加载章节列表
const loadStoryChapters = async () => {
  try {
    const response = await adminStoryApi.getChapters()
    if (response.success) {
      storyChapters.value = response.chapters
    }
  } catch (error) {
    console.error('加载章节列表失败:', error)
    alert('加载章节列表失败')
  }
}

// 打开章节弹窗
const openChapterModal = (chapter) => {
  if (chapter) {
    chapterForm.value = {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      chapter_order: chapter.chapter_order
    }
  } else {
    chapterForm.value = {
      id: null,
      title: '',
      description: '',
      chapter_order: storyChapters.value.length + 1
    }
  }
  showChapterModal.value = true
}

// 关闭章节弹窗
const closeChapterModal = () => {
  showChapterModal.value = false
  chapterForm.value = { id: null, title: '', description: '', chapter_order: 1 }
}

// 保存章节
const saveChapter = async () => {
  if (!chapterForm.value.title) {
    alert('请输入章节标题')
    return
  }

  try {
    if (chapterForm.value.id) {
      // 更新
      const response = await adminStoryApi.updateChapter(chapterForm.value.id, chapterForm.value)
      if (response.success) {
        alert('章节更新成功')
        closeChapterModal()
        await loadStoryChapters()
      }
    } else {
      // 创建
      const response = await adminStoryApi.createChapter(chapterForm.value)
      if (response.success) {
        alert('章节创建成功')
        closeChapterModal()
        await loadStoryChapters()
      }
    }
  } catch (error) {
    console.error('保存章节失败:', error)
    alert('保存章节失败')
  }
}

// 删除章节确认
const deleteChapterConfirm = (chapter) => {
  if (confirm(`确定要删除章节"${chapter.title}"吗？\n这将删除该章节的所有节点和选项！`)) {
    deleteChapter(chapter.id)
  }
}

// 删除章节
const deleteChapter = async (chapterId) => {
  try {
    const response = await adminStoryApi.deleteChapter(chapterId)
    if (response.success) {
      alert('章节删除成功')
      await loadStoryChapters()
      // 如果当前筛选的是被删除的章节，清空筛选
      if (nodeFilterChapter.value === chapterId) {
        nodeFilterChapter.value = null
      }
      await loadStoryNodes()
    }
  } catch (error) {
    console.error('删除章节失败:', error)
    alert(error.response?.data?.message || '删除章节失败')
  }
}

// 选择章节筛选
const selectChapterFilter = (chapterId) => {
  nodeFilterChapter.value = chapterId
  loadStoryNodes()
}

// 加载节点列表
const loadStoryNodes = async (page = 1) => {
  try {
    const params = {
      page,
      limit: 20
    }
    if (nodeFilterChapter.value) {
      params.chapterId = nodeFilterChapter.value
    }

    const response = await adminStoryApi.getNodes(params)
    if (response.success) {
      storyNodes.value = response.nodes
      nodeCurrentPage.value = response.page
      nodeTotalPages.value = Math.ceil(response.total / response.limit)
    }
  } catch (error) {
    console.error('加载节点列表失败:', error)
    alert('加载节点列表失败')
  }
}

// 打开节点弹窗
const openNodeModal = async (node) => {
  if (node) {
    // 编辑模式 - 加载节点详情
    try {
      const response = await adminStoryApi.getNodeDetail(node.id)
      if (response.success) {
        selectedNode.value = response.node
        nodeForm.value = {
          id: node.id,
          chapter_id: node.chapter_id,
          node_key: node.node_key,
          character_name: node.character_name,
          character_image: node.character_image,
          background_image: node.background_image,
          dialogue_text: node.dialogue_text,
          node_order: node.node_order
        }
      }
    } catch (error) {
      console.error('加载节点详情失败:', error)
      alert('加载节点详情失败')
      return
    }
  } else {
    // 新建模式
    selectedNode.value = null
    nodeForm.value = {
      id: null,
      chapter_id: nodeFilterChapter.value || null,
      node_key: '',
      character_name: '',
      character_image: '',
      background_image: '',
      dialogue_text: '',
      node_order: 1
    }
  }
  showNodeModal.value = true
}

// 关闭节点弹窗
const closeNodeModal = () => {
  showNodeModal.value = false
  selectedNode.value = null
  nodeForm.value = {
    id: null,
    chapter_id: null,
    node_key: '',
    character_name: '',
    character_image: '',
    background_image: '',
    dialogue_text: '',
    node_order: 1
  }
}

// 保存节点
const saveNode = async () => {
  if (!nodeForm.value.chapter_id) {
    alert('请选择所属章节')
    return
  }
  if (!nodeForm.value.node_key) {
    alert('请输入节点标识')
    return
  }
  if (!nodeForm.value.dialogue_text) {
    alert('请输入对话文本')
    return
  }

  try {
    if (nodeForm.value.id) {
      // 更新
      const response = await adminStoryApi.updateNode(nodeForm.value.id, nodeForm.value)
      if (response.success) {
        alert('节点更新成功')
        closeNodeModal()
        await loadStoryNodes(nodeCurrentPage.value)
      }
    } else {
      // 创建
      const response = await adminStoryApi.createNode(nodeForm.value)
      if (response.success) {
        alert('节点创建成功')
        closeNodeModal()
        await loadStoryNodes(nodeCurrentPage.value)
      }
    }
  } catch (error) {
    console.error('保存节点失败:', error)
    alert(error.response?.data?.message || '保存节点失败')
  }
}

// 删除节点确认
const deleteNodeConfirm = (node) => {
  if (confirm(`确定要删除节点"${node.node_key}"吗？\n这将删除该节点的所有选项！`)) {
    deleteNode(node.id)
  }
}

// 删除节点
const deleteNode = async (nodeId) => {
  try {
    const response = await adminStoryApi.deleteNode(nodeId)
    if (response.success) {
      alert('节点删除成功')
      await loadStoryNodes(nodeCurrentPage.value)
      await loadStoryChapters() // 更新章节统计
    }
  } catch (error) {
    console.error('删除节点失败:', error)
    alert(error.response?.data?.message || '删除节点失败')
  }
}

// 添加选项
const addChoice = async () => {
  if (!nodeForm.value.id) {
    alert('请先保存节点')
    return
  }

  // 加载节点简要信息用于选择器
  try {
    const response = await adminStoryApi.getNodesSimple(nodeForm.value.chapter_id)
    if (response.success) {
      storyNodesSimple.value = response.nodes
    }
  } catch (error) {
    console.error('加载节点列表失败:', error)
  }

  choiceForm.value = {
    id: null,
    node_id: nodeForm.value.id,
    choice_text: '',
    next_node_id: null,
    choice_order: (selectedNode.value?.choices?.length || 0) + 1
  }
  showChoiceModal.value = true
}

// 编辑选项
const editChoice = async (choice) => {
  // 加载节点简要信息用于选择器
  try {
    const response = await adminStoryApi.getNodesSimple(nodeForm.value.chapter_id)
    if (response.success) {
      storyNodesSimple.value = response.nodes
    }
  } catch (error) {
    console.error('加载节点列表失败:', error)
  }

  choiceForm.value = {
    id: choice.id,
    node_id: choice.node_id,
    choice_text: choice.choice_text,
    next_node_id: choice.next_node_id,
    choice_order: choice.choice_order
  }
  showChoiceModal.value = true
}

// 关闭选项弹窗
const closeChoiceModal = () => {
  showChoiceModal.value = false
  choiceForm.value = {
    id: null,
    node_id: null,
    choice_text: '',
    next_node_id: null,
    choice_order: 1
  }
}

// 保存选项
const saveChoice = async () => {
  if (!choiceForm.value.choice_text) {
    alert('请输入选项文本')
    return
  }

  try {
    if (choiceForm.value.id) {
      // 更新
      const response = await adminStoryApi.updateChoice(choiceForm.value.id, choiceForm.value)
      if (response.success) {
        alert('选项更新成功')
        closeChoiceModal()
        // 重新加载节点详情
        await openNodeModal({ id: nodeForm.value.id, ...nodeForm.value })
      }
    } else {
      // 创建
      const response = await adminStoryApi.createChoice(choiceForm.value)
      if (response.success) {
        alert('选项创建成功')
        closeChoiceModal()
        // 重新加载节点详情
        await openNodeModal({ id: nodeForm.value.id, ...nodeForm.value })
      }
    }
  } catch (error) {
    console.error('保存选项失败:', error)
    alert(error.response?.data?.message || '保存选项失败')
  }
}

// 删除选项确认
const deleteChoiceConfirm = (choice) => {
  if (confirm(`确定要删除选项"${choice.choice_text}"吗？`)) {
    deleteChoice(choice.id)
  }
}

// 删除选项
const deleteChoice = async (choiceId) => {
  try {
    const response = await adminStoryApi.deleteChoice(choiceId)
    if (response.success) {
      alert('选项删除成功')
      // 重新加载节点详情
      await openNodeModal({ id: nodeForm.value.id, ...nodeForm.value })
    }
  } catch (error) {
    console.error('删除选项失败:', error)
    alert('删除选项失败')
  }
}

// 验证故事完整性
const validateStory = async () => {
  try {
    const response = await adminStoryApi.validateStory()
    if (response.success) {
      validationIssues.value = response.issues
      if (response.valid) {
        alert('✅ 故事验证通过，未发现问题！')
      } else {
        alert(`⚠️ 发现 ${response.issues.filter(i => i.severity === 'error').length} 个错误，请查看详情`)
      }
    }
  } catch (error) {
    console.error('验证故事失败:', error)
    alert('验证故事失败')
  }
}

// ==================== 进阶功能方法 ====================

// 预览节点
const previewNode = async (node) => {
  try {
    const response = await adminStoryApi.getNodeDetail(node.id)
    previewNodeData.value = node
    previewNodeChoices.value = response.choices || []
    
    // 获取章节标题
    const chapter = storyChapters.value.find(c => c.id === node.chapter_id)
    if (chapter) {
      previewNodeData.value.chapterTitle = chapter.title
    }
    
    showNodePreview.value = true
  } catch (error) {
    console.error('加载节点详情失败:', error)
    alert('加载节点详情失败')
  }
}

// 打开流程图
watch(showFlowChart, async (show) => {
  if (show) {
    if (!nodeFilterChapter.value) {
      alert('请先在节点管理中选择一个章节，然后再打开流程图')
      showFlowChart.value = false
      return
    }
    
    try {
      // 加载选中章节的所有节点和选项
      const nodesRes = await adminStoryApi.getNodes({ chapter_id: nodeFilterChapter.value })
      const nodes = nodesRes.nodes || []
      
      if (nodes.length === 0) {
        alert('该章节暂无节点')
        showFlowChart.value = false
        return
      }
      
      // 加载所有节点的选项
      const allChoices = []
      for (const node of nodes) {
        const nodeDetail = await adminStoryApi.getNodeDetail(node.id)
        if (nodeDetail.choices) {
          allChoices.push(...nodeDetail.choices)
        }
      }
      
      flowChartData.value = {
        nodes: nodes,
        choices: allChoices
      }
    } catch (error) {
      console.error('加载流程图数据失败:', error)
      alert('请先选择一个章节')
      showFlowChart.value = false
    }
  }
})

// 加载所有节点用于搜索
const loadAllNodesForSearch = async () => {
  try {
    const allNodes = []
    for (const chapter of storyChapters.value) {
      const res = await adminStoryApi.getNodes({ chapter_id: chapter.id })
      const nodes = res.nodes || []
      
      // 为每个节点添加选项数量
      for (const node of nodes) {
        const detail = await adminStoryApi.getNodeDetail(node.id)
        node.choice_count = detail.choices?.length || 0
      }
      
      allNodes.push(...nodes)
    }
    allNodesForSearch.value = allNodes
  } catch (error) {
    console.error('加载节点数据失败:', error)
  }
}

// 打开高级搜索时加载数据
watch(showAdvancedSearch, async (show) => {
  if (show && allNodesForSearch.value.length === 0) {
    await loadAllNodesForSearch()
  }
})

// 从搜索结果选择节点
const selectNodeFromSearch = (node) => {
  showAdvancedSearch.value = false
  previewNode(node)
}

// 监听标签页切换
watch(activeTab, async (newTab) => {
  if (newTab === 'community') {
    // 切换到社区管理时加载社区数据
    await Promise.all([
      loadCommunityStats(),
      loadCommunityPosts(),
      loadCommunityComments()
    ])
  } else if (newTab === 'story') {
    // 切换到故事管理时加载故事数据
    await loadStoryChapters()
  }
})
</script>

<style scoped>
/* Admin Page Styles - Updated */
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.back-home-btn {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s;
}

.back-home-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateX(-5px);
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 4rem;
}

.admin-container h1 {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.chart-container canvas {
  max-height: 300px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 3rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* 管理卡片 */
.admin-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.card-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.card-body {
  padding: 2rem;
}

/* 选择统计 */
.choice-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.choice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 2rem;
}

.choice-info {
  flex: 1;
}

.choice-text {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.choice-node {
  color: #666;
  font-size: 0.9rem;
}

.choice-data {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.choice-count {
  min-width: 100px;
  color: #667eea;
  font-weight: bold;
}

.choice-bar {
  flex: 1;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.choice-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s;
}

.choice-percentage {
  min-width: 50px;
  text-align: right;
  font-weight: bold;
  color: #667eea;
}

/* 用户表格 */
.table-container {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.user-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.user-table tr:hover {
  background: #f8f9fa;
}

.user-row {
  cursor: pointer;
  transition: all 0.2s;
}

.user-row:hover {
  background: #e9ecef !important;
  transform: scale(1.01);
}

/* 章节进度 */
.chapter-progress {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chapter-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.chapter-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.progress-text {
  min-width: 150px;
  text-align: right;
  color: #667eea;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* 分页控件 */
.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #764ba2;
  transform: translateY(-2px);
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 40px;
  height: 40px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s;
}

.page-number:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.page-number.active {
  background: #667eea;
  color: white;
}

/* 用户详情弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.user-detail-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  font-size: 2rem;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: rotate(90deg);
}

.user-detail-content {
  padding: 2rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #667eea;
}

.user-info-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
}

.user-id {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.user-details {
  margin-bottom: 2rem;
}

.detail-item {
  display: flex;
  padding: 0.8rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: bold;
  color: #666;
  min-width: 100px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.detail-value.banned {
  color: #dc3545;
  font-weight: bold;
}

.ban-status {
  background: #fff3cd;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.ban-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
}

.ban-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.3rem;
}

.ban-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: #666;
  font-size: 0.9rem;
}

.ban-select {
  padding: 0.8rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.ban-select:focus {
  outline: none;
  border-color: #667eea;
}

.ban-reason-input {
  padding: 0.8rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.ban-reason-input:focus {
  outline: none;
  border-color: #667eea;
}

.ban-btn {
  padding: 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.ban-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.unban-section {
  text-align: center;
}

.ban-info {
  color: #dc3545;
  font-weight: bold;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.unban-btn {
  padding: 1rem 2rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.unban-btn:hover {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
}

.tab-btn {
  flex: 1;
  padding: 1rem 2rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 12px;
}

.tab-btn:hover::before {
  opacity: 1;
}

.tab-btn:hover {
  color: white;
  transform: translateY(-2px);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  color: #667eea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.tab-btn.active::before {
  opacity: 0;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 社区管理 */
.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
  min-width: 300px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.refresh-btn {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.refresh-btn:active {
  transform: translateY(0);
}

.post-table {
  width: 100%;
  border-collapse: collapse;
}

.post-table th,
.post-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.post-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.post-table tr:hover {
  background: #f8f9fa;
}

.post-title {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.badge.official {
  background: #ffc107;
  color: #000;
}

.badge.pinned {
  background: #dc3545;
  color: white;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
}

.status-badge.official {
  background: #fff3cd;
  color: #856404;
}

.status-badge.normal {
  background: #e9ecef;
  color: #666;
}

.action-cell {
  white-space: nowrap;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  margin: 0 0.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
  background: #f8f9fa;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn.pin,
.action-btn.unpin {
  background: #fff3cd;
}

.action-btn.official,
.action-btn.unofficial {
  background: #d1ecf1;
}

.action-btn.delete {
  background: #f8d7da;
}

.action-btn.delete:hover {
  background: #dc3545;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

/* 评论列表 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.comment-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-info {
  flex: 1;
}

.comment-author {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.3rem;
}

.comment-meta {
  font-size: 0.85rem;
  color: #666;
}

.post-link {
  color: #667eea;
  font-weight: bold;
}

.comment-time {
  margin-left: 1rem;
  color: #999;
}

.delete-comment-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.delete-comment-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.comment-content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
}

.comment-stats {
  font-size: 0.9rem;
  color: #666;
}

/* 可点击元素 */
.clickable-title,
.clickable-author,
.clickable-post {
  cursor: pointer;
  transition: all 0.3s;
}

.clickable-title:hover {
  color: #667eea;
  text-decoration: underline;
}

.clickable-author {
  color: #667eea;
  font-weight: bold;
}

.clickable-author:hover {
  color: #764ba2;
  text-decoration: underline;
}

.clickable-post {
  cursor: pointer;
}

.clickable-post:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 帖子详情弹窗 */
.post-detail-modal {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.post-detail-content {
  padding: 2rem;
}

.post-detail-header {
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

.post-badges {
  margin-bottom: 1rem;
}

.post-detail-title {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.post-detail-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #667eea;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.author-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: #667eea;
  cursor: pointer;
}

.author-name:hover {
  color: #764ba2;
  text-decoration: underline;
}

.post-time {
  font-size: 0.9rem;
  color: #666;
}

.post-detail-body {
  margin-bottom: 2rem;
}

.post-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  margin-bottom: 1.5rem;
}

.post-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 1rem;
  color: #666;
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-detail-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
}

.detail-action-btn {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e9ecef;
  background: white;
  color: #666;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s;
}

.detail-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.detail-action-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.detail-action-btn.delete {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.detail-action-btn.delete:hover {
  background: #c82333;
  border-color: #c82333;
}

/* 帖子详情中的评论列表 */
.post-comments-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.post-comments-section h3 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.post-comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.post-comment-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;
}

.post-comment-item:hover {
  background: #e9ecef;
}

.comment-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.comment-username {
  font-weight: bold;
  color: #667eea;
  cursor: pointer;
}

.comment-username:hover {
  color: #764ba2;
  text-decoration: underline;
}

.comment-date {
  font-size: 0.85rem;
  color: #999;
}

.comment-text {
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comment-likes {
  font-size: 0.9rem;
  color: #666;
}

.delete-comment-small-btn {
  padding: 0.3rem 0.8rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.delete-comment-small-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.no-comments p {
  margin: 0;
}

/* 故事管理样式 */
.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.chapter-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.chapter-card:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.chapter-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.chapter-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  padding: 0.4rem 0.6rem;
  border: none;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
}

.icon-btn:hover {
  transform: scale(1.1);
}

.icon-btn.edit {
  background: #d1ecf1;
}

.icon-btn.delete {
  background: #f8d7da;
}

.chapter-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.chapter-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #667eea;
  font-weight: bold;
}

.add-btn {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: bold;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.chapter-filter {
  padding: 0.6rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
  min-width: 200px;
}

.chapter-filter:focus {
  outline: none;
  border-color: #667eea;
}

.story-table {
  width: 100%;
  border-collapse: collapse;
}

.story-table th,
.story-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.story-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.story-row {
  transition: all 0.2s;
}

.story-row:hover {
  background: #f8f9fa;
}

.node-key {
  font-family: 'Courier New', monospace;
  color: #667eea;
  font-weight: bold;
}

.dialogue-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
}

.validate-btn {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: bold;
  transition: all 0.3s;
}

.validate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.validation-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.validation-issue {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.validation-issue.error {
  background: #f8d7da;
  border-color: #dc3545;
}

.validation-issue.warning {
  background: #fff3cd;
  border-color: #ffc107;
}

.validation-issue.info {
  background: #d1ecf1;
  border-color: #17a2b8;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.issue-icon {
  font-size: 1.2rem;
}

.issue-details {
  margin-top: 0.5rem;
  padding-left: 2rem;
  font-size: 0.9rem;
  color: #666;
}

.detail-item {
  padding: 0.3rem 0;
}

.more-details {
  color: #667eea;
  font-style: italic;
  margin-top: 0.3rem;
}

/* 弹窗样式 */
.edit-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.edit-modal.large {
  max-width: 900px;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 2px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.cancel-btn,
.save-btn {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: #e9ecef;
  color: #666;
}

.cancel-btn:hover {
  background: #dee2e6;
}

.save-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 选项管理 */
.choices-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.add-choice-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.add-choice-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.choice-item:hover {
  background: #e9ecef;
}

.choice-order {
  width: 30px;
  height: 30px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.choice-content {
  flex: 1;
}

.choice-text {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.3rem;
}

.choice-target {
  font-size: 0.9rem;
  color: #667eea;
}

.choice-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-choices {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.info-message {
  padding: 1rem;
  background: #d1ecf1;
  border-left: 4px solid #17a2b8;
  border-radius: 8px;
  color: #0c5460;
  margin-top: 1rem;
}
</style>


/* 进阶功能工具栏样式 - 完全模仿标签页按钮 */
.advanced-toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.toolbar-action-btn {
  flex: 1;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  color: #667eea;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.toolbar-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  opacity: 0;
  transition: opacity 0.3s;
  border-radius: 12px;
}

.toolbar-action-btn:hover::before {
  opacity: 1;
}

.toolbar-action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.toolbar-action-btn:active {
  transform: translateY(-1px);
}

.action-btn.preview {
  background: #2196F3;
  color: white;
}

.action-btn.preview:hover {
  background: #1976D2;
}
