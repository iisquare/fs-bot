import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', () => {
  const mode = ref<'default' | 'config'>('default')

  function setMode(m: 'default' | 'config') {
    mode.value = m
  }

  return { mode, setMode }
})
