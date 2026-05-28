<script setup lang="ts">
import TitleBar from '@renderer/components/Layout/TitleBar.vue'
import LayoutSidebar from '@renderer/components/Layout/LayoutSidebar.vue'
import { useSidebarStore } from '@renderer/stores/sidebar'

const sidebar = useSidebarStore()
const isMac = window.electron.process.platform === 'darwin'
</script>

<template>
  <!-- macOS: title bar overlays full width (traffic lights on left) -->
  <div v-if="isMac" class="main-layout main-layout--mac">
    <TitleBar class="main-layout__titlebar" />
    <div class="main-layout__body">
      <LayoutSidebar v-if="sidebar.visible" />
      <main class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </main>
    </div>
  </div>

  <!-- Windows/Linux: title bar only above main content, sidebar fills full height -->
  <div v-else class="main-layout main-layout--win">
    <LayoutSidebar v-if="sidebar.visible" />
    <div class="main-right">
      <TitleBar />
      <main class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

// ── macOS ────────────────────────────────────────────────

.main-layout--mac {
  position: relative;
}

.main-layout--mac .main-layout__titlebar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.main-layout--mac .main-layout__body {
  display: flex;
  height: 100%;
}

// ── Windows / Linux ─────────────────────────────────────

.main-layout--win {
  display: flex;
}

.main-right {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

// ── shared ──────────────────────────────────────────────

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
