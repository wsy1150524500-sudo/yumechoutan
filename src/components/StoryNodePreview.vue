<template>
  <div class="node-preview-modal" @click.self="$emit('close')">
    <div class="preview-container">
      <div class="preview-header">
        <h3>📖 节点预览</h3>
        <button @click="$emit('close')" class="close-btn">✖️</button>
      </div>

      <div class="preview-content">
        <!-- 游戏引擎样式预览 -->
        <div class="game-preview">
          <div class="game-screen" @click="skipTyping">
            <!-- 背景图 -->
            <div 
              class="game-background"
              :style="{ backgroundImage: node.background_image ? `url(${node.background_image})` : 'none' }"
            >
              <div v-if="!node.background_image" class="placeholder-bg">
                背景图片区域
              </div>
            </div>

            <!-- 角色立绘 -->
            <div class="game-character">
              <img 
                v-if="node.character_image" 
                :src="node.character_image" 
                :alt="node.character_name"
                class="character-image"
              />
              <div v-else class="placeholder-character">
                {{ node.character_name }}
              </div>
            </div>

            <!-- 对话框 -->
            <div class="game-dialogue-box">
              <div class="dialogue-header">
                <span class="character-name">{{ node.character_name }}</span>
              </div>
              <div class="dialogue-text">
                <span v-if="showTyping">{{ typedText }}</span>
                <span v-else>{{ node.dialogue_text }}</span>
                <span v-if="showTyping && !typingComplete" class="typing-cursor">▌</span>
              </div>
            </div>

            <!-- 选项 -->
            <div v-if="choices && choices.length > 0" class="game-choices">
              <div 
                v-for="(choice, index) in choices" 
                :key="choice.id"
                class="choice-item"
                :class="{ 'choice-hover': hoveredChoice === index }"
                @mouseenter="hoveredChoice = index"
                @mouseleave="hoveredChoice = null"
              >
                <span class="choice-number">{{ index + 1 }}</span>
                <span class="choice-text">{{ choice.choice_text }}</span>
                <span class="choice-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 控制面板 -->
        <div class="preview-controls">
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showTyping" />
              打字机效果
            </label>
            <button v-if="showTyping" @click="restartTyping" class="control-btn">
              重新播放
            </button>
          </div>

          <div class="control-group">
            <label>打字速度：</label>
            <input 
              type="range" 
              v-model="typingSpeed" 
              min="10" 
              max="100" 
              class="speed-slider"
            />
            <span>{{ typingSpeed }}ms</span>
          </div>
        </div>

        <!-- 节点信息 -->
        <div class="node-info">
          <h4>节点信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>节点ID:</label>
              <span>{{ node.id }}</span>
            </div>
            <div class="info-item">
              <label>节点Key:</label>
              <span>{{ node.node_key }}</span>
            </div>
            <div class="info-item">
              <label>章节:</label>
              <span>{{ chapterTitle }}</span>
            </div>
            <div class="info-item">
              <label>顺序:</label>
              <span>{{ node.node_order }}</span>
            </div>
            <div class="info-item">
              <label>选项数:</label>
              <span>{{ choices?.length || 0 }}</span>
            </div>
            <div class="info-item">
              <label>对话长度:</label>
              <span>{{ node.dialogue_text?.length || 0 }} 字</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  choices: {
    type: Array,
    default: () => []
  },
  chapterTitle: {
    type: String,
    default: '未知章节'
  }
})

const emit = defineEmits(['close'])

const showTyping = ref(true)
const typingSpeed = ref(50)
const typedText = ref('')
const typingComplete = ref(false)
const hoveredChoice = ref(null)
let typingTimer = null

const startTyping = () => {
  typedText.value = ''
  typingComplete.value = false
  
  if (!showTyping.value) {
    typedText.value = props.node.dialogue_text
    typingComplete.value = true
    return
  }

  const text = props.node.dialogue_text || ''
  let index = 0

  const type = () => {
    if (index < text.length) {
      typedText.value += text[index]
      index++
      typingTimer = setTimeout(type, typingSpeed.value)
    } else {
      typingComplete.value = true
    }
  }

  type()
}

const restartTyping = () => {
  if (typingTimer) {
    clearTimeout(typingTimer)
  }
  startTyping()
}

const skipTyping = () => {
  if (!showTyping.value || typingComplete.value) return
  
  if (typingTimer) {
    clearTimeout(typingTimer)
  }
  
  typedText.value = props.node.dialogue_text || ''
  typingComplete.value = true
}

watch(() => props.node, () => {
  restartTyping()
})

watch(showTyping, () => {
  restartTyping()
})

onMounted(() => {
  startTyping()
})
</script>

<style scoped>
.node-preview-modal {
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
  padding: 20px;
}

.preview-container {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h3 {
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

.preview-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.game-preview {
  margin-bottom: 20px;
}

.game-screen {
  position: relative;
  width: 100%;
  height: 500px;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.game-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
}

.placeholder-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.3;
}

.game-character {
  position: absolute;
  bottom: 180px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.character-image {
  max-height: 300px;
  max-width: 300px;
  object-fit: contain;
}

.placeholder-character {
  width: 200px;
  height: 300px;
  background: rgba(255,255,255,0.1);
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.game-dialogue-box {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  padding: 15px 20px;
  z-index: 2;
}

.dialogue-header {
  margin-bottom: 10px;
}

.character-name {
  color: #4CAF50;
  font-weight: bold;
  font-size: 16px;
}

.dialogue-text {
  color: white;
  font-size: 15px;
  line-height: 1.8;
  min-height: 60px;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #4CAF50;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.game-choices {
  position: absolute;
  bottom: 140px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2;
}

.choice-item {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.choice-item.choice-hover {
  background: rgba(76, 175, 80, 0.9);
  border-color: #4CAF50;
  transform: translateX(-5px);
}

.choice-number {
  background: #4CAF50;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.choice-text {
  flex: 1;
  font-size: 14px;
}

.choice-arrow {
  font-size: 16px;
}

.preview-controls {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group label {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.control-btn {
  padding: 6px 12px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.control-btn:hover {
  background: #1976D2;
}

.speed-slider {
  flex: 1;
  max-width: 200px;
}

.node-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.node-info h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 13px;
}

.info-item span {
  color: #333;
  font-size: 13px;
}
</style>
