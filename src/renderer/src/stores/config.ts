import { ref } from 'vue'
import { defineStore } from 'pinia'
import ApiUtil from '@renderer/utils/ApiUtil'
import AppDb from '@renderer/db/AppDb'

export const useConfigStore = defineStore('config', () => {
  const apps = ref<any[]>([])
  const appsLoading = ref(false)
  const knowledgeBases = ref<any[]>([])
  const kbLoading = ref(false)
  const tools = ref<any[]>([])
  const toolsLoading = ref(false)
  const skills = ref<any[]>([])
  const skillsLoading = ref(false)

  async function fetchApps() {
    appsLoading.value = true
    try {
      const result: any = await AppDb.list()
      apps.value = ApiUtil.data(result) || []
    } finally {
      appsLoading.value = false
    }
  }

  return {
    apps,
    appsLoading,
    knowledgeBases,
    kbLoading,
    tools,
    toolsLoading,
    skills,
    skillsLoading,
    fetchApps
  }
})
