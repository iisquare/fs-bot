<script setup lang="ts">
import { onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import locale from 'element-plus/dist/locale/zh-cn.mjs'
import { useUserStore } from '@renderer/stores/user'
import UserApi from '@renderer/api/UserApi'
import Db from '@renderer/core/Db'
import { page } from '@renderer/router/config'

const user = useUserStore()
const router = useRouter()

async function logout() {
  await UserApi.logout().finally(() => {
    user.reset()
    router.push(page.login)
  })
}

onMounted(() => {
  Db.initSystem(import.meta.env.VITE_DB_SECRET)
  user.initialize()
})

provide('logout', logout)
</script>

<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>
