import { ref } from 'vue'
import { defineStore } from 'pinia'
import ApiUtil from '@renderer/utils/ApiUtil'
import SystemDb from '@renderer/db/SystemDb'

export const useSettingsStore = defineStore('settings', () => {
  const autoStart = ref(false)
  const autoUpgrade = ref(false)
  const loading = ref(false)

  async function fetchSettings() {
    loading.value = true
    try {
      const result: Record<string, unknown> = await SystemDb.getSettings()
      const data = ApiUtil.data(result) || {}
      autoStart.value = (data as Record<string, string>).autoStart === 'true'
      autoUpgrade.value = (data as Record<string, string>).autoUpgrade === 'true'
    } finally {
      loading.value = false
    }
  }

  async function toggleAutoStart(val: boolean) {
    await SystemDb.updateAutoStart(val)
    autoStart.value = val
  }

  async function toggleAutoUpgrade(val: boolean) {
    await SystemDb.updateAutoUpgrade(val)
    autoUpgrade.value = val
  }

  return { autoStart, autoUpgrade, loading, fetchSettings, toggleAutoStart, toggleAutoUpgrade }
})
