<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const selectedChunk = ref<any>(null)

async function handleSearch() {
  if (!query.value.trim()) return
  loading.value = true
  try {
    // results will be populated by API in real implementation
    results.value = []
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="recall-test">
    <div class="page-header">
      <h2>召回测试</h2>
    </div>

    <div class="recall-layout">
      <div class="recall-left">
        <div class="search-bar">
          <el-input
            v-model="query"
            placeholder="输入查询问题..."
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :loading="loading" @click="handleSearch">检索</el-button>
            </template>
          </el-input>
        </div>

        <div v-if="results.length === 0 && !loading" class="recall-empty">
          <el-empty description="输入问题检索相关分块" />
        </div>

        <div v-else class="chunk-list">
          <div
            v-for="(chunk, index) in results"
            :key="index"
            class="chunk-item"
            :class="{ active: selectedChunk === chunk }"
            @click="selectedChunk = chunk"
          >
            <div class="chunk-score">评分: {{ chunk.score?.toFixed(3) }}</div>
            <div class="chunk-text">{{ chunk.text }}</div>
          </div>
        </div>
      </div>

      <div class="recall-right">
        <template v-if="selectedChunk">
          <el-collapse v-model="['parent', 'children']">
            <el-collapse-item title="父段内容" name="parent">
              <div class="segment-content">
                {{ selectedChunk.parentSegment || '暂无父段信息' }}
              </div>
            </el-collapse-item>
            <el-collapse-item title="子段内容" name="children">
              <div class="segment-content">
                {{ selectedChunk.childSegments || '暂无子段信息' }}
              </div>
            </el-collapse-item>
          </el-collapse>
          <el-collapse>
            <el-collapse-item title="全文内容" name="fulltext">
              <div class="segment-content">
                {{ selectedChunk.fullText || '暂无全文信息' }}
              </div>
            </el-collapse-item>
          </el-collapse>
        </template>
        <el-empty v-else description="点击左侧分块查看详情" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.recall-test {
  padding: 24px 32px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    color: var(--ev-c-text-1);
  }
}

.recall-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

.recall-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  margin-bottom: 12px;
}

.recall-empty {
  padding: 40px 0;
}

.chunk-list {
  flex: 1;
  overflow-y: auto;
}

.chunk-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.chunk-score {
  font-size: 12px;
  color: var(--el-color-primary);
  margin-bottom: 4px;
}

.chunk-text {
  font-size: 13px;
  color: var(--ev-c-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recall-right {
  width: 360px;
  overflow-y: auto;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
}

.segment-content {
  font-size: 13px;
  color: var(--ev-c-text-1);
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
