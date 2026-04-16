<template>
  <div class="story-flow-chart">
    <div class="flow-toolbar">
      <button @click="fitView" class="toolbar-btn">
        <span>🔍</span> 适应视图
      </button>
      <button @click="zoomIn" class="toolbar-btn">
        <span>➕</span> 放大
      </button>
      <button @click="zoomOut" class="toolbar-btn">
        <span>➖</span> 缩小
      </button>
      <button @click="toggleMinimap" class="toolbar-btn">
        <span>🗺️</span> {{ showMinimap ? '隐藏' : '显示' }}小地图
      </button>
      <button @click="$emit('close')" class="toolbar-btn close-btn">
        <span>✖️</span> 关闭
      </button>
    </div>
    
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-zoom="1"
      :min-zoom="0.2"
      :max-zoom="4"
      @node-click="onNodeClick"
      class="vue-flow-container"
    >
      <Background pattern-color="#aaa" :gap="16" />
      <Controls />
      <MiniMap v-if="showMinimap" />
    </VueFlow>

    <!-- 节点详情面板 -->
    <div v-if="selectedNode" class="node-detail-panel">
      <div class="panel-header">
        <h3>节点详情</h3>
        <button @click="selectedNode = null" class="close-panel-btn">✖️</button>
      </div>
      <div class="panel-content">
        <div class="detail-item">
          <label>节点ID:</label>
          <span>{{ selectedNode.data.nodeData.id }}</span>
        </div>
        <div class="detail-item">
          <label>节点Key:</label>
          <span>{{ selectedNode.data.nodeData.node_key }}</span>
        </div>
        <div class="detail-item">
          <label>角色:</label>
          <span>{{ selectedNode.data.nodeData.character_name }}</span>
        </div>
        <div class="detail-item">
          <label>对话:</label>
          <p>{{ selectedNode.data.nodeData.dialogue_text }}</p>
        </div>
        <div class="detail-item" v-if="selectedNode.data.choices && selectedNode.data.choices.length > 0">
          <label>选项 ({{ selectedNode.data.choices.length }}):</label>
          <ul class="choices-list">
            <li v-for="choice in selectedNode.data.choices" :key="choice.id">
              {{ choice.choice_text }} → {{ choice.next_node_id || '结束' }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

const props = defineProps({
  chapterData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'nodeClick'])

const { fitView: flowFitView, zoomIn: flowZoomIn, zoomOut: flowZoomOut } = useVueFlow()

const nodes = ref([])
const edges = ref([])
const selectedNode = ref(null)
const showMinimap = ref(true)

// 生成流程图数据
const generateFlowData = () => {
  const nodesList = props.chapterData.nodes || []
  const choicesList = props.chapterData.choices || []
  
  if (nodesList.length === 0) return
  
  // 创建节点映射
  const nodeMap = new Map()
  nodesList.forEach(node => {
    nodeMap.set(node.id, node)
  })
  
  // 按照node_order排序节点
  const sortedNodes = [...nodesList].sort((a, b) => a.node_order - b.node_order)
  
  // 构建图结构
  const childrenMap = new Map()
  const parentCount = new Map()
  
  // 初始化
  sortedNodes.forEach(node => {
    childrenMap.set(node.id, [])
    parentCount.set(node.id, 0)
  })
  
  // 统计每个节点的父节点数量和子节点
  choicesList.forEach(choice => {
    if (choice.next_node_id && nodeMap.has(choice.next_node_id)) {
      childrenMap.get(choice.node_id).push(choice.next_node_id)
      parentCount.set(choice.next_node_id, (parentCount.get(choice.next_node_id) || 0) + 1)
    }
  })
  
  // 检查是否有选项连接，如果没有则按node_order创建线性连接
  const hasChoices = choicesList.length > 0
  if (!hasChoices) {
    // 线性故事：按顺序连接节点
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const currentNode = sortedNodes[i]
      const nextNode = sortedNodes[i + 1]
      childrenMap.set(currentNode.id, [nextNode.id])
      parentCount.set(nextNode.id, 1)
    }
  }
  
  // 使用BFS进行层级布局
  const levels = []
  const visited = new Set()
  const nodeLevel = new Map()
  
  // 找到根节点（没有父节点的节点）
  const rootNodes = sortedNodes.filter(node => parentCount.get(node.id) === 0)
  if (rootNodes.length === 0 && sortedNodes.length > 0) {
    rootNodes.push(sortedNodes[0])
  }
  
  // 改进的BFS：确保同一父节点的所有子节点在同一层
  let currentLevel = [rootNodes.map(node => node.id)]
  let levelIndex = 0
  
  while (currentLevel[levelIndex] && currentLevel[levelIndex].length > 0) {
    const currentLevelNodes = currentLevel[levelIndex]
    const nextLevelNodes = new Set()
    
    // 记录当前层的所有节点
    if (!levels[levelIndex]) {
      levels[levelIndex] = []
    }
    
    currentLevelNodes.forEach(nodeId => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId)
        levels[levelIndex].push(nodeId)
        nodeLevel.set(nodeId, levelIndex)
        
        // 收集所有子节点到下一层
        const children = childrenMap.get(nodeId) || []
        children.forEach(childId => {
          if (!visited.has(childId)) {
            nextLevelNodes.add(childId)
          }
        })
      }
    })
    
    // 准备下一层
    levelIndex++
    currentLevel[levelIndex] = Array.from(nextLevelNodes)
  }
  
  // 处理未访问的节点（孤立节点）
  sortedNodes.forEach(node => {
    if (!visited.has(node.id)) {
      const lastLevel = levels.length
      if (!levels[lastLevel]) {
        levels[lastLevel] = []
      }
      levels[lastLevel].push(node.id)
      nodeLevel.set(node.id, lastLevel)
    }
  })
  
  // 计算位置
  const horizontalSpacing = 300
  const verticalSpacing = 200
  const positionMap = new Map()
  
  levels.forEach((nodeIds, level) => {
    const levelWidth = nodeIds.length * horizontalSpacing
    const startX = -levelWidth / 2 + horizontalSpacing / 2
    
    nodeIds.forEach((nodeId, index) => {
      positionMap.set(nodeId, {
        x: startX + index * horizontalSpacing,
        y: level * verticalSpacing + 50
      })
    })
  })
  
  // 生成节点
  const flowNodes = sortedNodes.map(node => {
    const choices = choicesList.filter(c => c.node_id === node.id)
    const position = positionMap.get(node.id) || { x: 0, y: 0 }
    
    // 截取对话文本
    const dialoguePreview = node.dialogue_text.length > 30 
      ? node.dialogue_text.substring(0, 30) + '...' 
      : node.dialogue_text
    
    return {
      id: String(node.id),
      type: choices.length > 0 ? 'default' : 'output',
      position: position,
      data: { 
        label: `${node.node_key}\n${node.character_name}\n${dialoguePreview}`,
        nodeData: node,
        choices: choices
      },
      style: {
        background: choices.length > 0 ? '#4CAF50' : '#2196F3',
        color: 'white',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '12px',
        width: '220px',
        minHeight: '80px',
        fontSize: '12px',
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }
    }
  })
  
  // 生成连接线
  const flowEdges = []
  
  if (hasChoices) {
    // 有选项的情况：使用选项数据
    choicesList.forEach(choice => {
      if (choice.next_node_id && nodeMap.has(choice.next_node_id)) {
        flowEdges.push({
          id: `e${choice.node_id}-${choice.next_node_id}`,
          source: String(choice.node_id),
          target: String(choice.next_node_id),
          sourceHandle: 'bottom',
          targetHandle: 'top',
          label: choice.choice_text,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#666', strokeWidth: 2 },
          labelStyle: { fill: '#333', fontSize: '11px', fontWeight: 'bold' },
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 }
        })
      }
    })
  } else {
    // 线性故事：按顺序连接
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const currentNode = sortedNodes[i]
      const nextNode = sortedNodes[i + 1]
      flowEdges.push({
        id: `e${currentNode.id}-${nextNode.id}`,
        source: String(currentNode.id),
        target: String(nextNode.id),
        sourceHandle: 'bottom',
        targetHandle: 'top',
        label: '继续',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#666', strokeWidth: 2 },
        labelStyle: { fill: '#333', fontSize: '11px', fontWeight: 'bold' },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 }
      })
    }
  }
  
  nodes.value = flowNodes
  edges.value = flowEdges
}

const fitView = () => {
  flowFitView({ padding: 0.2, duration: 300 })
}

const zoomIn = () => {
  flowZoomIn({ duration: 300 })
}

const zoomOut = () => {
  flowZoomOut({ duration: 300 })
}

const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}

const onNodeClick = (event) => {
  selectedNode.value = event.node
  emit('nodeClick', event.node.data.nodeData)
}

onMounted(() => {
  generateFlowData()
  setTimeout(() => {
    fitView()
  }, 100)
})
</script>

<style scoped>
.story-flow-chart {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  z-index: 1000;
}

.flow-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  display: flex;
  gap: 10px;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toolbar-btn {
  padding: 8px 16px;
  border: none;
  background: #2196F3;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.toolbar-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
}

.toolbar-btn.close-btn {
  background: #f44336;
}

.toolbar-btn.close-btn:hover {
  background: #d32f2f;
}

.vue-flow-container {
  width: 100%;
  height: 100%;
}

.node-detail-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 350px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  z-index: 10;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-panel-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.3s;
}

.close-panel-btn:hover {
  background: rgba(255,255,255,0.2);
}

.panel-content {
  padding: 20px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item label {
  display: block;
  font-weight: bold;
  color: #666;
  margin-bottom: 5px;
  font-size: 14px;
}

.detail-item span,
.detail-item p {
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}

.detail-item p {
  margin: 0;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.choices-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.choices-list li {
  padding: 8px 12px;
  background: #e3f2fd;
  border-left: 3px solid #2196F3;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 13px;
}
</style>

<style>
/* Vue Flow 样式 */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>
