import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const STORAGE_KEY = 'fs_auth_token'

  const USER_DEFAULT_STATE = {
    id: 0,
    serial: '',
    name: '',
    email: '',
    token: ''
  }

  const ready = ref(false)
  const visible = ref(false)
  const info: any = ref(Object.assign({}, USER_DEFAULT_STATE))

  const reload = async () => {
    // TODO: 调用 UserApi.info() 获取用户信息
    // if (info.value.token) { ... }
    ready.value = true
  }

  const reset = (data: any = {}, isReady = true) => {
    ready.value = isReady
    Object.assign(info.value, USER_DEFAULT_STATE, data?.info ?? data)
    if (info.value.token) {
      localStorage.setItem(STORAGE_KEY, info.value.token)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const initialize = async () => {
    Object.assign(info.value, { token: localStorage.getItem(STORAGE_KEY) || '' })
    if (info.value.token) {
      reload()
    } else {
      reset()
    }
  }

  const isLogined = () => {
    return info.value.id > 0 && info.value.token !== ''
  }

  return { ready, visible, info, reload, reset, initialize, isLogined, USER_DEFAULT_STATE }
})
