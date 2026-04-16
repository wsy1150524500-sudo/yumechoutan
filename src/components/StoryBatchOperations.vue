<template>
  <div class="batch-operations">
    <div class="batch-header">
      <h3>批量操作</h3>
      <button @click="$emit('close')" class="close-btn">✖️</button>
    </div>

    <div class="batch-tabs">
      <button 
        :class="['batch-tab', { active: activeTab === 'delete' }]"
        @click="activeTab = 'delete'"
      >
        批量删除
      </button>
      <button 
        :class="['batch-tab', { active: activeTab === 'export' }]"
        @click="activeTab = 'export'"
      >
        导出数据
      </button>
      <button 
        :class="['batch-tab', { active: activeTab === 'import' }]"
        @click="activeTab = 'import'"
      >
        导入数据
      </button>
    </div>

    <!-- 批量删除 -->
    <div v-if="activeTab === 'delete'" class="batch-content">
      <div class="warning-box">
        ⚠️ 警告：批量删除操作不可恢复，请谨慎操作！
      </div>
      
      <div class="form-group">
        <label>选择章节：</label>
        <select v-model="selectedChapterId" class="form-control">
          <option value="">-- 请选择章节 --</option>
          <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
            {{ chapter.title }}
          </option>
        </select>
      </div>

      <div v-if="selectedChapterId" class="nodes-selection">
        <div class="selection-header">
          <label>
            <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            全选 ({{ selectedNodes.length }}/{{ availableNodes.length }})
          </label>
        </div>
        
        <div class="nodes-list">
          <label v-for="node in availableNodes" :key="node.id" class="node-checkbox">
            <input type="checkbox" :value="node.id" v-model="selectedNodes" />
            <span class="node-info">
              <strong>{{ node.character_name }}</strong>: 
              {{ node.dialogue_text.substring(0, 50) }}...
            </span>
          </label>
        </div>
      </div>

      <div class="batch-actions">
        <button 
          @click="batchDelete" 
          :disabled="selectedNodes.length === 0"
          class="btn btn-danger"
        >
          删除选中的 {{ selectedNodes.length }} 个节点
        </button>
      </div>
    </div>

    <!-- 导出数据 -->
    <div v-if="activeTab === 'export'" class="batch-content">
      <div class="info-box">
        📦 导出章节数据为 JSON 格式，可用于备份或迁移
      </div>

      <div class="form-group">
        <label>选择要导出的章节：</label>
        <select v-model="exportChapterId" class="form-control">
          <option value="">-- 请选择章节 --</option>
          <option value="all">导出所有章节</option>
          <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
            {{ chapter.title }}
          </option>
        </select>
      </div>

      <div class="batch-actions">
        <button 
          @click="exportData" 
          :disabled="!exportChapterId"
          class="btn btn-primary"
        >
          导出数据
        </button>
      </div>
    </div>

    <!-- 导入数据 -->
    <div v-if="activeTab === 'import'" class="batch-content">
      <div class="info-box">
        📥 导入 JSON 格式的章节数据
      </div>

      <div class="form-group">
        <label>选择 JSON 文件：</label>
        <input 
          type="file" 
          accept=".json" 
          @change="handleFileSelect"
          class="file-input"
        />
      </div>

      <div v-if="importPreview" class="import-preview">
        <h4>预览导入数据：</h4>
        <div class="preview-stats">
          <div class="stat">章节数: {{ importPreview.chapters?.length || 0 }}</div>
          <div class="stat">节点数: {{ importPreview.nodes?.length || 0 }}</div>
          <div class="stat">选项数: {{ importPreview.choices?.length || 0 }}</div>
        </div>
      </div>

      <div class="batch-actions">
        <button 
          @click="importData" 
          :disabled="!importPreview"
          class="btn btn-success"
        >
          确认导入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { adminStoryApi } from '@/api/admin-story'

const props = defineProps({
  chapters: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'refresh'])

const activeTab = ref('delete')
const selectedChapterId = ref('')
const selectedNodes = ref([])
const selectAll = ref(false)
const availableNodes = ref([])
const exportChapterId = ref('')
const importPreview = ref(null)
const importFile = ref(null)

// 监听章节选择，加载节点
watch(selectedChapterId, async (chapterId) => {
  if (chapterId) {
    try {
      const res = await adminStoryApi.getNodes({ chapter_id: chapterId })
      availableNodes.value = res.nodes || []
      selectedNodes.value = []
      selectAll.value = false
    } catch (error) {
      console.error('加载节点失败:', error)
      alert('加载节点失败')
    }
  } else {
    availableNodes.value = []
    selectedNodes.value = []
  }
})

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedNodes.value = availableNodes.value.map(n => n.id)
  } else {
    selectedNodes.value = []
  }
}

const batchDelete = async () => {
  if (selectedNodes.value.length === 0) return
  
  const confirmed = confirm(`确定要删除选中的 ${selectedNodes.value.length} 个节点吗？此操作不可恢复！`)
  if (!confirmed) return

  try {
    let successCount = 0
    for (const nodeId of selectedNodes.value) {
      try {
        await adminStoryApi.deleteNode(nodeId)
        successCount++
      } catch (error) {
        console.error(`删除节点 ${nodeId} 失败:`, error)
      }
    }
    
    alert(`成功删除 ${successCount} 个节点`)
    selectedNodes.value = []
    emit('refresh')
    
    // 重新加载节点列表
    if (selectedChapterId.value) {
      const res = await adminStoryApi.getNodes({ chapter_id: selectedChapterId.value })
      availableNodes.value = res.nodes || []
    }
  } catch (error) {
    console.error('批量删除失败:', error)
    alert('批量删除失败')
  }
}

const exportData = async () => {
  if (!exportChapterId.value) return

  try {
    let exportData = {}
    
    if (exportChapterId.value === 'all') {
      // 导出所有章节
      const chaptersRes = await adminStoryApi.getChapters()
      exportData.chapters = chaptersRes.chapters || []
      
      const allNodes = []
      const allChoices = []
      
      for (const chapter of exportData.chapters) {
        const nodesRes = await adminStoryApi.getNodes({ chapter_id: chapter.id })
        allNodes.push(...(nodesRes.nodes || []))
        
        for (const node of nodesRes.nodes || []) {
          const nodeDetail = await adminStoryApi.getNodeDetail(node.id)
          if (nodeDetail.choices) {
            allChoices.push(...nodeDetail.choices)
          }
        }
      }
      
      exportData.nodes = allNodes
      exportData.choices = allChoices
    } else {
      // 导出单个章节
      const chapter = props.chapters.find(c => c.id === parseInt(exportChapterId.value))
      exportData.chapters = [chapter]
      
      const nodesRes = await adminStoryApi.getNodes({ chapter_id: exportChapterId.value })
      exportData.nodes = nodesRes.nodes || []
      
      const allChoices = []
      for (const node of exportData.nodes) {
        const nodeDetail = await adminStoryApi.getNodeDetail(node.id)
        if (nodeDetail.choices) {
          allChoices.push(...nodeDetail.choices)
        }
      }
      exportData.choices = allChoices
    }
    
    // 下载 JSON 文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    alert('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败')
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      importPreview.value = data
      importFile.value = file
    } catch (error) {
      alert('JSON 文件格式错误')
      console.error(error)
    }
  }
  reader.readAsText(file)
}

const importData = async () => {
  if (!importPreview.value) return

  const confirmed = confirm('确定要导入这些数据吗？')
  if (!confirmed) return

  try {
    // 这里需要后端支持批量导入API
    // 暂时提示功能开发中
    alert('导入功能开发中，请使用数据库直接导入')
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败')
  }
}
</script>

<style scoped>
.batch-operations {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.batch-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
}

.batch-tabs {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
}

.batch-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.batch-tab.active {
  color: #667eea;
  border-bottom: 3px solid #667eea;
  font-weight: bold;
}

.batch-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.warning-box,
.info-box {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.warning-box {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.info-box {
  background: #d1ecf1;
  border-left: 4px solid #17a2b8;
  color: #0c5460;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.nodes-selection {
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.selection-header {
  background: #f5f5f5;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
}

.nodes-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.node-checkbox {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.node-checkbox:hover {
  background: #f5f5f5;
}

.node-checkbox input {
  margin-right: 10px;
  margin-top: 3px;
}

.node-info {
  font-size: 13px;
  line-height: 1.5;
}

.batch-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
}

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #388E3C;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.import-preview {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.import-preview h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.preview-stats {
  display: flex;
  gap: 20px;
}

.preview-stats .stat {
  padding: 8px 16px;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
}
</style>
