<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('mcp')
const loading = ref(false)

const mcpServices = ref<any[]>([])
const customTools = ref<any[]>([])
const builtinTools = ref<any[]>([])

const dialogVisible = ref(false)
const form = ref({
  name: '',
  description: '',
  type: 'mcp' as 'mcp' | 'custom',
  config: ''
})

function openCreateDialog(type: 'mcp' | 'custom') {
  form.value = { name: '', description: '', type, config: '' }
  dialogVisible.value = true
}
</script>

<template>
  <div class="tool-management">
    <div class="page-header">
      <h2>工具管理</h2>
      <el-button
        v-if="activeTab !== 'builtin'"
        type="primary"
        @click="openCreateDialog(activeTab as 'mcp' | 'custom')"
      >
        添加{{ activeTab === 'mcp' ? 'MCP 服务' : '自定义工具' }}
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="MCP 服务" name="mcp">
        <div v-loading="loading">
          <el-empty v-if="mcpServices.length === 0" description="暂无 MCP 服务" />
          <div v-else class="tool-grid">
            <el-card
              v-for="tool in mcpServices"
              :key="tool.id"
              shadow="hover"
              class="tool-card"
            >
              <template #header>
                <span class="card-title">{{ tool.name }}</span>
              </template>
              <p class="card-desc">{{ tool.description || '暂无描述' }}</p>
              <div class="card-actions">
                <el-button text type="primary">编辑</el-button>
                <el-button text type="danger">删除</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="自定义工具" name="custom">
        <div v-loading="loading">
          <el-empty v-if="customTools.length === 0" description="暂无自定义工具" />
          <div v-else class="tool-grid">
            <el-card
              v-for="tool in customTools"
              :key="tool.id"
              shadow="hover"
              class="tool-card"
            >
              <template #header>
                <span class="card-title">{{ tool.name }}</span>
              </template>
              <p class="card-desc">{{ tool.description || '暂无描述' }}</p>
              <div class="card-actions">
                <el-button text type="primary">编辑</el-button>
                <el-button text type="danger">删除</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="内置工具" name="builtin">
        <div v-loading="loading">
          <el-empty v-if="builtinTools.length === 0" description="暂无内置工具" />
          <div v-else class="tool-grid">
            <el-card
              v-for="tool in builtinTools"
              :key="tool.id"
              shadow="hover"
              class="tool-card"
            >
              <template #header>
                <span class="card-title">{{ tool.name }}</span>
              </template>
              <p class="card-desc">{{ tool.description || '暂无描述' }}</p>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="dialogVisible"
      :title="form.type === 'mcp' ? '添加 MCP 服务' : '添加自定义工具'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入工具名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入工具描述"
          />
        </el-form-item>
        <el-form-item label="配置">
          <el-input
            v-model="form.config"
            type="textarea"
            :rows="6"
            placeholder="JSON 配置..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.tool-management {
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

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.tool-card {
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
