<script setup lang="ts">
import { useRouter } from 'vue-router'
import { page } from '@renderer/router/config'

const router = useRouter()

const emit = defineEmits<{
  newChat: []
}>()
</script>

<template>
  <div class="sidebar-header">
    <div class="header-top">
      <div class="header-brand">
        <span class="header-logo">🤖</span>
        <span class="header-name">fs-bot</span>
      </div>
      <div class="header-actions">
        <el-button text size="small" @click="router.push(page.search)">
          🔍
        </el-button>
      </div>
    </div>
    <div class="header-new-chat">
      <el-button type="primary" class="new-chat-btn" @click="emit('newChat')">
        开启新对话
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  font-size: 20px;
}

.header-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ev-c-text-1);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-new-chat {
  margin-top: 10px;

  .new-chat-btn {
    width: 100%;
  }
}
</style>
