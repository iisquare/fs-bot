import { ref } from 'vue'
import { defineStore } from 'pinia'
import ApiUtil from '@renderer/utils/ApiUtil'
import SystemApi from '@renderer/api/SystemApi'

export const useSettingsStore = defineStore('settings', () => {
  const autoStart = ref(false)
  const autoUpgrade = ref(false)
  const loading = ref(false)

  async function fetchSettings() {
    loading.value = true
    try {
      const result: any = await SystemApi.getSettings()
      const data = ApiUtil.data(result) || {}
      autoStart.value = data.autoStart ?? false
      autoUpgrade.value = data.autoUpgrade ?? false
    } finally {
      loading.value = false
    }
  }

  async function toggleAutoStart(val: boolean) {
    await SystemApi.updateAutoStart(val)
    autoStart.value = val
  }

  async function toggleAutoUpgrade(val: boolean) {
    await SystemApi.updateAutoUpgrade(val)
    autoUpgrade.value = val
  }

  return { autoStart, autoUpgrade, loading, fetchSettings, toggleAutoStart, toggleAutoUpgrade }
})
