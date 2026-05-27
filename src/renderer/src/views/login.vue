<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@renderer/stores/user'

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const loading = ref(false)

const form = ref({
  name: '',
  password: ''
})

const login = () => {
  loading.value = true
  // TODO: 调用 UserApi.login(form.value)
  setTimeout(() => {
    user.reset({ id: 1, name: form.value.name || 'admin', token: 'mock-token' })
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/home'
    router.replace(redirect)
    loading.value = false
  }, 500)
}
</script>

<template>
  <div class="login-page">
    <h2>fs-bot</h2>
    <el-form :model="form" label-width="60px" size="default">
      <el-form-item label="账号">
        <el-input v-model="form.name" placeholder="请输入账号" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="login" style="width: 100%">
          登录
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 32px;

  h2 {
    font-size: 32px;
    color: var(--ev-c-text-1);
  }
}
</style>
