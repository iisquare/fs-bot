<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@renderer/stores/settings'

const settings = useSettingsStore()

onMounted(() => {
  settings.fetchSettings()
})
</script>

<template>
  <div class="system-settings">
    <h2>系统设置</h2>
    <div class="settings-card">
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-title">开机启动</span>
          <span class="setting-desc">系统启动时自动运行 fs-bot</span>
        </div>
        <el-switch
          :model-value="settings.autoStart"
          @update:model-value="(val: any) => settings.toggleAutoStart(val)"
        />
      </div>
      <el-divider />
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-title">自动升级</span>
          <span class="setting-desc">有新版本时自动下载并安装</span>
        </div>
        <el-switch
          :model-value="settings.autoUpgrade"
          @update:model-value="(val: any) => settings.toggleAutoUpgrade(val)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-settings {
  padding: 40px;

  h2 {
    font-size: 20px;
    color: var(--ev-c-text-1);
    margin-bottom: 24px;
  }
}

.settings-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--el-border-color-light);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.setting-label {
  display: flex;
  flex-direction: column;

  .setting-title {
    font-size: 15px;
    color: var(--ev-c-text-1);
  }

  .setting-desc {
    font-size: 13px;
    color: var(--ev-c-text-3);
    margin-top: 4px;
  }
}
</style>
