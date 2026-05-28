<script setup lang="ts">
import LayoutSidebar from '@renderer/components/Layout/LayoutSidebar.vue'
</script>

<template>
  <div class="main-layout">
    <LayoutSidebar />
    <main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.content-wrapper {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}
</style>
