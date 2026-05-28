<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { page } from '@renderer/router/config'

const router = useRouter()

interface KnowledgeItem {
  id: string
  name: string
  description: string
  segmentDelimiter: string
  segmentLength: number
  chunkLength: number
  overlap: number
  recallCount: number
  scoreThreshold: number
}

const items = ref<KnowledgeItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingItem = ref<KnowledgeItem | null>(null)

const defaultForm = {
  name: '',
  description: '',
  segmentDelimiter: '\\r\\n',
  segmentLength: 2000,
  chunkLength: 500,
  overlap: 50,
  recallCount: 20,
  scoreThreshold: 0
}

const form = ref({ ...defaultForm })

function openCreateDialog() {
  editingItem.value = null
  form.value = { ...defaultForm }
  dialogVisible.value = true
}

function openEditDialog(item: KnowledgeItem) {
  editingItem.value = item
  form.value = { ...item }
  dialogVisible.value = true
}

function openRecallTest(_item: KnowledgeItem) {
  router.push(page.configKnowledgeRecall)
}
</script>

<template>
  <div class="knowledge-base">
    <div class="page-header">
      <h2>知识库</h2>
      <el-button type="primary" @click="openCreateDialog">创建知识库</el-button>
    </div>

    <div v-loading="loading">
      <el-empty v-if="items.length === 0" description="暂无知识库" />
      <div v-else class="kb-grid">
        <el-card
          v-for="item in items"
          :key="item.id"
          shadow="hover"
          class="kb-card"
        >
          <template #header>
            <span class="card-title">{{ item.name }}</span>
          </template>
          <p class="card-desc">{{ item.description || '暂无描述' }}</p>
          <div class="card-meta">
            <el-tag size="small">分段: {{ item.segmentLength }}</el-tag>
            <el-tag size="small">分块: {{ item.chunkLength }}</el-tag>
            <el-tag size="small">召回: {{ item.recallCount }}</el-tag>
          </div>
          <div class="card-actions">
            <el-button text type="primary" @click="openRecallTest(item)">召回测试</el-button>
            <el-button text @click="openEditDialog(item)">编辑</el-button>
            <el-button text type="danger">删除</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingItem ? '编辑知识库' : '创建知识库'"
      width="560px"
    >
      <el-form :model="form" label-width="110px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入知识库描述"
          />
        </el-form-item>
        <el-divider content-position="left">检索配置</el-divider>
        <el-form-item label="段落分隔符">
          <el-input v-model="form.segmentDelimiter" placeholder="默认: \r\n" />
        </el-form-item>
        <el-form-item label="分段长度">
          <el-input-number v-model="form.segmentLength" :min="100" :max="10000" />
        </el-form-item>
        <el-form-item label="分块长度">
          <el-input-number v-model="form.chunkLength" :min="100" :max="5000" />
        </el-form-item>
        <el-form-item label="重叠长度">
          <el-input-number v-model="form.overlap" :min="0" :max="1000" />
        </el-form-item>
        <el-form-item label="召回数量">
          <el-input-number v-model="form.recallCount" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="评分阈值">
          <el-slider
            v-model="form.scoreThreshold"
            :min="0"
            :max="1"
            :step="0.05"
            show-input
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
.knowledge-base {
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

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.kb-card {
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

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
