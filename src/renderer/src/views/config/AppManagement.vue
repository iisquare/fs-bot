<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useConfigStore } from '@renderer/stores/config'
import AppDb from '@renderer/db/AppDb'
import AppEditDialog from './AppEditDialog.vue'

const config = useConfigStore()

const dialogVisible = ref(false)
const editingApp = ref<any>(null)

onMounted(() => {
  config.fetchApps()
})

function openCreateDialog() {
  editingApp.value = null
  dialogVisible.value = true
}

function openEditDialog(app: any) {
  editingApp.value = { ...app }
  dialogVisible.value = true
}

async function handleDelete(app: any) {
  try {
    await ElMessageBox.confirm(`确定删除应用「${app.name}」？`, '确认删除', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await AppDb.delete(app.id)
    config.fetchApps()
  } catch {
    // handled by api layer
  }
}

function handleSaved() {
  config.fetchApps()
}
</script>

<template>
  <div class="app-management">
    <div class="page-header">
      <h2>应用管理</h2>
      <el-button type="primary" @click="openCreateDialog">创建应用</el-button>
    </div>

    <div v-loading="config.appsLoading">
      <el-empty v-if="config.apps.length === 0" description="暂无应用" />
      <div v-else class="app-grid">
        <el-card
          v-for="app in config.apps"
          :key="app.id"
          shadow="hover"
          class="app-card"
        >
          <template #header>
            <div class="card-header">
              <el-avatar :size="32" :src="app.icon" />
              <span class="card-title">{{ app.name }}</span>
            </div>
          </template>
          <p class="card-desc">{{ app.description || '暂无描述' }}</p>
          <div class="card-actions">
            <el-button text type="primary" @click="openEditDialog(app)">编辑</el-button>
            <el-button text type="danger" @click="handleDelete(app)">删除</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <AppEditDialog
      v-model:visible="dialogVisible"
      :app="editingApp"
      @saved="handleSaved"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-management {
  padding: 24px 32px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    font-size: 20px;
    color: var(--ev-c-text-1);
  }
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.app-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--ev-c-text-1);
  }

  .card-desc {
    font-size: 13px;
    color: var(--ev-c-text-3);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
