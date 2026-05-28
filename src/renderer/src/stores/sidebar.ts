import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', () => {
  const mode = ref<'default' | 'config'>('default')
  const visible = ref(true)

  function setMode(m: 'default' | 'config') {
    mode.value = m
  }

  function setVisible(v: boolean) {
    visible.value = v
  }

  return { mode, visible, setMode, setVisible }
})
