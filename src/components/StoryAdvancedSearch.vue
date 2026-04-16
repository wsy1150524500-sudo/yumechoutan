<template>
  <div class="advanced-search">
    <div class="search-header">
      <h3>🔍 高级搜索</h3>
      <button @click="resetSearch" class="reset-btn">重置</button>
    </div>

    <div class="search-form">
      <!-- 关键词搜索 -->
      <div class="form-row">
        <label>关键词：</label>
        <input 
          v-model="searchParams.keyword" 
          type="text" 
          placeholder="搜索对话内容、角色名称..."
          class="search-input"
          @input="onSearch"
        />
      </div>

      <!-- 章节筛选 -->
      <div class="form-row">
        <label>章节：</label>
        <select v-model="searchParams.chapterId" @change="onSearch" class="search-select">
          <option value="">全部章节</option>
          <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
            {{ chapter.title }}
          </option>
        </select>
      </div>

      <!-- 角色筛选 -->
      <div class="form-row">
        <label>角色：</label>
        <select v-model="searchParams.character" @change="onSearch" class="search-select">
          <option value="">全部角色</option>
          <option v-for="char in characters" :key="char" :value="char">
            {{ char }}
          </option>
        </select>
      </div>

      <!-- 节点类型筛选 -->
      <div class="form-row">
        <label>节点类型：</label>
        <select v-model="searchParams.nodeType" @change="onSearch" class="search-select">
          <option value="">全部类型</option>
          <option value="branch">分支节点（有选项）</option>
          <option value="linear">线性节点（无选项）</option>
          <option value="end">结束节点</option>
        </select>
      </div>

      <!-- 排序方式 -->
      <div class="form-row">
        <label>排序：</label>
        <select v-model="searchParams.sortBy" @change="onSearch" class="search-select">
          <option value="order">按顺序</option>
          <option value="id">按ID</option>
          <option value="character">按角色</option>
        </select>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <div class="results-header">
        <span>找到 {{ filteredResults.length }} 个结果</span>
        <button v-if="filteredResults.length > 0" @click="exportResults" class="export-btn">
          导出结果
        </button>
      </div>

      <div v-if="loading" class="loading">
        搜索中...
      </div>

      <div v-else-if="filteredResults.length === 0" class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>没有找到匹配的结果</p>
      </div>

      <div v-else class="results-list">
        <div 
          v-for="node in paginatedResults" 
          :key="node.id"
          class="result-item"
          @click="$emit('selectNode', node)"
        >
          <div class="result-header">
            <span class="result-chapter">{{ getChapterTitle(node.chapter_id) }}</span>
            <span class="result-type" :class="getNodeTypeClass(node)">
              {{ getNodeTypeLabel(node) }}
            </span>
          </div>
          <div class="result-content">
            <div class="result-character">{{ node.character_name }}</div>
            <div class="result-dialogue" v-html="highlightKeyword(node.dialogue_text)"></div>
          </div>
          <div class="result-meta">
            <span>ID: {{ node.id }}</span>
            <span>Key: {{ node.node_key }}</span>
            <span v-if="node.choice_count > 0">{{ node.choice_count }} 个选项</span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  chapters: {
    type: Array,
    required: true
  },
  allNodes: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['selectNode'])

const searchParams = ref({
  keyword: '',
  chapterId: '',
  character: '',
  nodeType: '',
  sortBy: 'order'
})

const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10

// 提取所有角色
const characters = computed(() => {
  const chars = new Set()
  props.allNodes.forEach(node => {
    if (node.character_name) {
      chars.add(node.character_name)
    }
  })
  return Array.from(chars).sort()
})

// 过滤结果
const filteredResults = computed(() => {
  let results = [...props.allNodes]

  // 关键词搜索
  if (searchParams.value.keyword) {
    const keyword = searchParams.value.keyword.toLowerCase()
    results = results.filter(node => 
      node.dialogue_text?.toLowerCase().includes(keyword) ||
      node.character_name?.toLowerCase().includes(keyword) ||
      node.node_key?.toLowerCase().includes(keyword)
    )
  }

  // 章节筛选
  if (searchParams.value.chapterId) {
    results = results.filter(node => 
      node.chapter_id === parseInt(searchParams.value.chapterId)
    )
  }

  // 角色筛选
  if (searchParams.value.character) {
    results = results.filter(node => 
      node.character_name === searchParams.value.character
    )
  }

  // 节点类型筛选
  if (searchParams.value.nodeType) {
    results = results.filter(node => {
      const hasChoices = node.choice_count > 0
      const isEnd = !hasChoices && !node.next_node_id
      
      if (searchParams.value.nodeType === 'branch') return hasChoices
      if (searchParams.value.nodeType === 'linear') return !hasChoices && !isEnd
      if (searchParams.value.nodeType === 'end') return isEnd
      return true
    })
  }

  // 排序
  if (searchParams.value.sortBy === 'order') {
    results.sort((a, b) => a.node_order - b.node_order)
  } else if (searchParams.value.sortBy === 'id') {
    results.sort((a, b) => a.id - b.id)
  } else if (searchParams.value.sortBy === 'character') {
    results.sort((a, b) => a.character_name.localeCompare(b.character_name))
  }

  return results
})

// 分页结果
const totalPages = computed(() => Math.ceil(filteredResults.value.length / pageSize))

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredResults.value.slice(start, end)
})

// 重置当前页
watch(() => searchParams.value, () => {
  currentPage.value = 1
}, { deep: true })

const onSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const resetSearch = () => {
  searchParams.value = {
    keyword: '',
    chapterId: '',
    character: '',
    nodeType: '',
    sortBy: 'order'
  }
}

const getChapterTitle = (chapterId) => {
  const chapter = props.chapters.find(c => c.id === chapterId)
  return chapter?.title || '未知章节'
}

const getNodeTypeLabel = (node) => {
  const hasChoices = node.choice_count > 0
  const isEnd = !hasChoices && !node.next_node_id
  
  if (hasChoices) return '分支'
  if (isEnd) return '结束'
  return '线性'
}

const getNodeTypeClass = (node) => {
  const hasChoices = node.choice_count > 0
  const isEnd = !hasChoices && !node.next_node_id
  
  if (hasChoices) return 'type-branch'
  if (isEnd) return 'type-end'
  return 'type-linear'
}

const highlightKeyword = (text) => {
  if (!searchParams.value.keyword || !text) return text
  
  const keyword = searchParams.value.keyword
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const exportResults = () => {
  const data = filteredResults.value.map(node => ({
    id: node.id,
    chapter: getChapterTitle(node.chapter_id),
    character: node.character_name,
    dialogue: node.dialogue_text,
    node_key: node.node_key,
    type: getNodeTypeLabel(node)
  }))
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `search-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.advanced-search {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.search-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-header h3 {
  margin: 0;
  font-size: 18px;
}

.reset-btn {
  padding: 6px 16px;
  background: rgba(255,255,255,0.2);
  border: 1px solid white;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: rgba(255,255,255,0.3);
}

.search-form {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  max-height: 30vh;
  overflow-y: auto;
  flex-shrink: 0;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.form-row label {
  width: 80px;
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.search-input,
.search-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus,
.search-select:focus {
  outline: none;
  border-color: #667eea;
}

.search-results {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.results-header span {
  font-weight: bold;
  color: #333;
}

.export-btn {
  padding: 6px 16px;
  background: #4CAF50;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.export-btn:hover {
  background: #388E3C;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #999;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.result-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-chapter {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.result-type {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: bold;
}

.type-branch {
  background: #4CAF50;
  color: white;
}

.type-linear {
  background: #2196F3;
  color: white;
}

.type-end {
  background: #f44336;
  color: white;
}

.result-content {
  margin-bottom: 10px;
}

.result-character {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  font-size: 14px;
}

.result-dialogue {
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.result-dialogue :deep(mark) {
  background: #ffeb3b;
  padding: 2px 4px;
  border-radius: 2px;
}

.result-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}
</style>
