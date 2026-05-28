<script setup lang="ts">
import { useUserStore } from '@renderer/stores/user'
import { useSidebarStore } from '@renderer/stores/sidebar'

const user = useUserStore()
const sidebar = useSidebarStore()

function toggleConfig() {
  sidebar.setMode(sidebar.mode === 'config' ? 'default' : 'config')
}
</script>

<template>
  <div class="sidebar-footer">
    <div class="footer-user" @click="toggleConfig">
      <el-avatar :size="32" :src="user.info.avatar">
        {{ user.info.name?.charAt(0) || 'U' }}
      </el-avatar>
      <span class="footer-name">
        {{ user.info.name || user.info.serial || '用户' }}
      </span>
      <span class="footer-more">···</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--el-border-color-light);
}

.footer-user {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.footer-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--ev-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-more {
  flex-shrink: 0;
  color: var(--ev-c-text-3);
  font-weight: bold;
  letter-spacing: 1px;
}
</style>
