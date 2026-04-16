<template>
  <div class="story-engine">
    <div class="story-container">
      <!-- 背景图 -->
      <div class="background" :style="{ backgroundImage: currentNode.background_image ? `url(${currentNode.background_image})` : 'none' }"></div>
      
      <!-- 角色立绘 -->
      <div class="character-container" v-if="currentNode.character_image">
        <img :src="currentNode.character_image" :alt="currentNode.character_name" class="character-sprite" />
      </div>
      
      <!-- 文本框 -->
      <div class="text-box" @click="skipTyping">
        <div class="character-name" v-if="currentNode.character_name && currentNode.character_name !== '旁白'">
          {{ currentNode.character_name }}
        </div>
        <div class="dialogue-text">
          {{ displayedText }}
        </div>
        
        <!-- 选项 -->
        <div class="choices" v-if="showChoices && currentNode.choices && currentNode.choices.length > 0">
          <button 
            class="choice-btn" 
            v-for="(choice, index) in currentNode.choices" 
            :key="index"
            @click="selectChoice(choice)"
          >
            {{ choice.choice_text }}
          </button>
        </div>
        
        <!-- 继续按钮（当没有选项时，点击继续到下一个节点） -->
        <div class="continue-indicator" v-if="isTextComplete && (!currentNode.choices || currentNode.choices.length === 0)" @click="continueToNext">
          <span>点击继续</span>
          <span>▼</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStoryStore } from '../stores/story'
import { storyApi } from '../api/story'

const router = useRouter()
const storyStore = useStoryStore()

const currentNode = ref({
  id: null,
  character_name: '',
  character_image: '',
  background_image: '',
  dialogue_text: '加载中...',
  choices: []
})

const displayedText = ref('')
const isTextComplete = ref(false)
const showChoices = ref(false)
const textSpeed = 50 // 打字速度（毫秒）
const allNodes = ref([]) // 存储所有节点
let typeInterval = null

// 打字机效果
const typeText = () => {
  if (typeInterval) {
    clearInterval(typeInterval)
  }
  
  displayedText.value = ''
  isTextComplete.value = false
  showChoices.value = false
  
  let index = 0
  const text = currentNode.value.dialogue_text
  
  typeInterval = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
    } else {
      clearInterval(typeInterval)
      typeInterval = null
      isTextComplete.value = true
      if (currentNode.value.choices && currentNode.value.choices.length > 0) {
        showChoices.value = true
      }
    }
  }, textSpeed)
}

// 跳过打字机效果
const skipTyping = () => {
  if (!isTextComplete.value && typeInterval) {
    // 停止打字机
    clearInterval(typeInterval)
    typeInterval = null
    // 直接显示完整文本
    displayedText.value = currentNode.value.dialogue_text
    isTextComplete.value = true
    // 如果有选项，显示选项
    if (currentNode.value.choices && currentNode.value.choices.length > 0) {
      showChoices.value = true
    }
  }
}

// 加载故事节点
const loadNode = async (nodeId) => {
  try {
    const response = await storyApi.getNode(nodeId)
    if (response.success) {
      currentNode.value = response.node
      storyStore.setCurrentNode(response.node)
      typeText()
    }
  } catch (error) {
    console.error('加载节点失败:', error)
    currentNode.value.dialogue_text = '加载失败，请刷新重试'
    displayedText.value = currentNode.value.dialogue_text
  }
}

// 下一个节点（自动继续）
const nextNode = () => {
  // 如果没有选项，说明故事结束
}

// 继续到下一个节点（按顺序）
const continueToNext = async () => {
  // 找到当前节点在所有节点中的索引
  const currentIndex = allNodes.value.findIndex(node => node.id === currentNode.value.id)
  
  if (currentIndex !== -1 && currentIndex < allNodes.value.length - 1) {
    // 加载下一个节点
    const nextNode = allNodes.value[currentIndex + 1]
    currentNode.value = nextNode
    storyStore.setCurrentNode(nextNode)
    
    // 保存进度
    await saveProgress(nextNode.id)
    
    typeText()
  } else {
    // 已经是最后一个节点
    alert('Demo到此结束，感谢体验！')
    router.push('/')
  }
}

// 选择选项
const selectChoice = async (choice) => {
  // 如果是Demo结束
  if (!choice.next_node_id) {
    alert('Demo到此结束，感谢体验！')
    router.push('/')
    return
  }
  
  // 保存用户选择（如果已登录）
  try {
    const token = localStorage.getItem('token')
    if (token) {
      await storyApi.saveChoice({
        nodeId: currentNode.value.id,
        choiceId: choice.id
      })
    }
  } catch (error) {
    // 未登录时忽略保存失败
  }
  
  // 找到目标节点
  const targetNode = allNodes.value.find(node => node.id === choice.next_node_id)
  if (targetNode) {
    currentNode.value = targetNode
    storyStore.setCurrentNode(targetNode)
    
    // 保存进度
    await saveProgress(targetNode.id)
    
    typeText()
  } else {
    // 如果在当前章节找不到，尝试从后端加载
    loadNode(choice.next_node_id)
  }
}

// 保存进度
const saveProgress = async (nodeId) => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      await storyApi.saveProgress({
        chapterId: 1, // 序章
        currentNodeId: nodeId
      })
    }
  } catch (error) {
    // 未登录时忽略保存失败
  }
}

// 初始化 - 加载序章第一个节点
onMounted(async () => {
  try {
    // 获取序章的所有节点
    const response = await storyApi.getChapterNodes(1)
    if (response.success && response.nodes.length > 0) {
      // 保存所有节点
      allNodes.value = response.nodes
      
      // 检查是否有保存的进度
      let startNode = response.nodes[0]
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const progressResponse = await storyApi.getProgress()
          if (progressResponse.success && progressResponse.progress.length > 0) {
            // 找到序章的进度
            const chapterProgress = progressResponse.progress.find(p => p.chapter_id === 1)
            if (chapterProgress && chapterProgress.current_node_id) {
              // 找到保存的节点
              const savedNode = allNodes.value.find(node => node.id === chapterProgress.current_node_id)
              if (savedNode) {
                const continueFromSaved = confirm('检测到上次未完成的进度，是否继续？')
                if (continueFromSaved) {
                  startNode = savedNode
                }
              }
            }
          }
        }
      } catch (error) {
        // 获取进度失败时从头开始
      }
      
      // 加载起始节点
      currentNode.value = startNode
      storyStore.setCurrentNode(startNode)
      typeText()
    }
  } catch (error) {
    console.error('初始化失败:', error)
    currentNode.value.dialogue_text = '加载失败，请刷新重试'
    displayedText.value = currentNode.value.dialogue_text
  }
})
</script>

<style scoped>
.story-engine {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.story-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-color: #1a1a2e;
}

.character-container {
  position: absolute;
  bottom: 200px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.character-sprite {
  max-height: 600px;
  filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
}

.text-box {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.85);
  padding: 2rem;
  min-height: 200px;
  z-index: 3;
  cursor: pointer;
}

.character-name {
  color: #4ecdc4;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.dialogue-text {
  color: white;
  font-size: 1.2rem;
  line-height: 1.8;
  min-height: 80px;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.choice-btn {
  background: rgba(78, 205, 196, 0.2);
  border: 2px solid #4ecdc4;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.choice-btn:hover {
  background: rgba(78, 205, 196, 0.4);
  transform: translateX(10px);
}

.continue-indicator {
  position: absolute;
  bottom: 1rem;
  right: 2rem;
  color: white;
  font-size: 1.2rem;
  animation: bounce 1s infinite;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
