<template>
  <div class="story-mode">
    <!-- 返回首页按钮 -->
    <button class="back-home-btn" @click="$router.push('/')">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      <span>返回首页</span>
    </button>
    <StoryEngine />
  </div>
</template>

<script setup>
import StoryEngine from '../components/StoryEngine.vue'
</script>

<style scoped>
.story-mode {
  min-height: 100vh;
  background: #1a1a2e;
  position: relative;
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
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateX(-5px);
}

.back-home-btn svg {
  transition: transform 0.3s;
}

.back-home-btn:hover svg {
  transform: translateX(-3px);
}
</style>
