<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@renderer/stores/user'
import { useSidebarStore } from '@renderer/stores/sidebar'
import { page } from '@renderer/router/config'

const router = useRouter()
const user = useUserStore()
const sidebar = useSidebarStore()

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      sidebar.setMode('default')
      router.push(page.profile)
      break
    case 'config':
      sidebar.setMode('config')
      router.push(page.configApps)
      break
    case 'settings':
      sidebar.setMode('default')
      router.push(page.settings)
      break
  }
}
</script>

<template>
  <div class="sidebar-footer">
    <div class="footer-trigger">
      <el-dropdown
        trigger="click"
        popper-class="footer-dropdown"
        @command="handleCommand"
      >
        <div class="footer-user">
          <el-avatar :size="32" :src="user.info.avatar">
            {{ user.info.name?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="footer-name">
            {{ user.info.name || user.info.serial || '用户' }}
          </span>
          <span class="footer-more">···</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <i-ep-user />
              <span>个人信息</span>
            </el-dropdown-item>
            <el-dropdown-item command="config">
              <i-ep-setting />
              <span>配置管理</span>
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <i-ep-tools />
              <span>系统设置</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--el-border-color-light);
}

.footer-trigger {
  width: 100%;
}

.footer-trigger :deep(.el-dropdown) {
  display: block;
}

.footer-user {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  cursor: pointer;
  padding: 4px;
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

<style lang="scss">
.footer-dropdown {
  min-width: 160px;

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    .el-icon {
      font-size: 16px;
    }
  }
}
</style>
