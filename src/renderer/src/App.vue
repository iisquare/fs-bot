<script setup lang="ts">
import { onMounted, provide } from 'vue'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import { useUserStore } from '@renderer/stores/user'
import UserApi from '@renderer/api/UserApi'

const user = useUserStore()

async function logout() {
  await UserApi.logout().finally(() => {
    user.reset()
  })
}

onMounted(() => {
  user.initialize()
})

provide('logout', logout)
</script>

<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>
