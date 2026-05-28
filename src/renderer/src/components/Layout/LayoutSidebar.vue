<script setup lang="ts">
import SidebarHeader from './SidebarHeader.vue'
import SidebarContent from './SidebarContent.vue'
import SidebarFooter from './SidebarFooter.vue'
</script>

<template>
  <aside class="layout-sidebar">
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
