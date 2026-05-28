<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const activeTab = ref('installed')
const loading = ref(false)
const installedSkills = ref<any[]>([])
const marketplaceSkills = ref<any[]>([])
const searchQuery = ref('')

const publishDialogVisible = ref(false)
const publishForm = ref({
  name: '',
  version: '1.0.0',
  description: ''
})

function handleInstall(skill: any) {
  ElMessageBox.prompt('请输入要安装的版本号', '安装技能', {
    inputValue: skill.latestVersion || '1.0.0'
  }).then(({ value: _value }) => {
    // install API call
  }).catch(() => {})
}

function openPublishDialog() {
  publishForm.value = { name: '', version: '1.0.0', description: '' }
  publishDialogVisible.value = true
}
</script>

<template>
  <div class="skill-management">
    <div class="page-header">
      <h2>技能管理</h2>
      <el-button v-if="activeTab === 'installed'" type="primary" @click="openPublishDialog">
        发布技能
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="已安装" name="installed">
        <div v-loading="loading">
          <el-empty v-if="installedSkills.length === 0" description="暂无已安装技能" />
          <div v-else class="skill-grid">
            <el-card
              v-for="skill in installedSkills"
              :key="skill.id"
              shadow="hover"
              class="skill-card"
            >
              <template #header>
                <div class="card-header">
                  <span class="card-title">{{ skill.name }}</span>
                  <el-tag size="small">v{{ skill.installedVersion }}</el-tag>
                </div>
              </template>
              <p class="card-desc">{{ skill.description || '暂无描述' }}</p>
              <div class="card-actions">
                <el-button text type="danger">卸载</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="技能市场" name="marketplace">
        <div class="marketplace-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索技能..."
            clearable
          />
        </div>
        <div v-loading="loading">
          <el-empty v-if="marketplaceSkills.length === 0" description="暂无可用技能" />
          <div v-else class="skill-grid">
            <el-card
              v-for="skill in marketplaceSkills"
              :key="skill.id"
              shadow="hover"
              class="skill-card"
            >
              <template #header>
                <div class="card-header">
                  <span class="card-title">{{ skill.name }}</span>
                  <el-tag size="small">v{{ skill.latestVersion }}</el-tag>
                </div>
              </template>
              <p class="card-desc">{{ skill.description || '暂无描述' }}</p>
              <div class="card-actions">
                <el-button text type="primary" @click="handleInstall(skill)">
                  安装
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="publishDialogVisible"
      title="发布技能"
      width="500px"
    >
      <el-form :model="publishForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="publishForm.name" placeholder="请输入技能名称" />
        </el-form-item>
        <el-form-item label="版本" required>
          <el-input v-model="publishForm.version" placeholder="1.0.0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入技能描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.skill-management {
  padding: 24px 32px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    font-size: 20px;
    color: var(--ev-c-text-1);
  }
}

.marketplace-search {
  margin-bottom: 16px;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.skill-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--ev-c-text-1);
  }

  .card-desc {
    font-size: 13px;
    color: var(--ev-c-text-3);
    margin-bottom: 12px;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
