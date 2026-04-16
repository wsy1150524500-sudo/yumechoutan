import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStoryStore = defineStore('story', () => {
  const currentChapter = ref(0)
  const currentNode = ref(null)
  const storyProgress = ref({})
  const choices = ref([])
  
  function setCurrentNode(node) {
    currentNode.value = node
  }
  
  function saveProgress(chapterId, nodeId) {
    if (!storyProgress.value[chapterId]) {
      storyProgress.value[chapterId] = []
    }
    if (!storyProgress.value[chapterId].includes(nodeId)) {
      storyProgress.value[chapterId].push(nodeId)
    }
  }
  
  function addChoice(choice) {
    choices.value.push(choice)
  }
  
  return { 
    currentChapter, 
    currentNode, 
    storyProgress, 
    choices,
    setCurrentNode, 
    saveProgress,
    addChoice
  }
})
