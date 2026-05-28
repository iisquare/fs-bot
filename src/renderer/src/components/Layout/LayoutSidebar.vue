<script setup lang="ts">
import { computed } from 'vue'
import SidebarHeader from './SidebarHeader.vue'
import SidebarContent from './SidebarContent.vue'
import SidebarFooter from './SidebarFooter.vue'

const isMac = window.electron.process.platform === 'darwin'
const paddingTop = computed(() => (isMac ? '36px' : '0'))
</script>

<template>
  <aside class="layout-sidebar" :style="{ paddingTop }">
    <SidebarHeader />
    <SidebarContent />
    <SidebarFooter />
  </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  min-width: 260px;
  height: 100vh;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}
</style>
