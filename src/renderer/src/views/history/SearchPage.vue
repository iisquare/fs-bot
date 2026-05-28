<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConversationStore } from '@renderer/stores/conversation'
import { groupByTime, GROUP_LABELS, formatTime } from '@renderer/utils/TimeUtil'
import { useRouter } from 'vue-router'
import { page } from '@renderer/router/config'

const router = useRouter()
const conversation = useConversationStore()

const searchQuery = ref('')
const pageNum = ref(1)
const pageSize = 20

onMounted(() => {
  conversation.fetchConversations()
})

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return []
  return conversation.conversations.filter(
    (c) => c.title.includes(searchQuery.value)
  )
})

const grouped = computed(() => {
  return groupByTime(filtered.value)
})

const groupKeys = ['today', 'yesterday', 'thisWeek', 'earlier'] as const

function handleSelect(id: string) {
  conversation.selectConversation(id)
  router.push(page.home)
}
</script>

<template>
  <div class="search-page">
    <div class="search-header">
      <h2>对话检索</h2>
      <el-input
        v-model="searchQuery"
        placeholder="输入关键词检索对话..."
        clearable
        class="search-input"
      >
        <template #prefix>🔍</template>
      </el-input>
    </div>

    <div v-if="!searchQuery.trim()" class="search-placeholder">
      <el-empty description="输入关键词开始检索" />
    </div>
    <div v-else-if="filtered.length === 0" class="search-empty">
      <el-empty description="未找到匹配的对话" />
    </div>
    <div v-else class="search-results">
      <template v-for="key in groupKeys" :key="key">
        <div v-if="grouped[key].length > 0" class="result-group">
          <div class="group-title">{{ GROUP_LABELS[key] }}</div>
          <div
            v-for="conv in grouped[key]"
            :key="conv.id"
            class="result-item"
            @click="handleSelect(conv.id)"
          >
            <div class="result-title">{{ conv.title }}</div>
            <div class="result-time">{{ formatTime(conv.updatedAt) }}</div>
            <div v-if="conv.appName" class="result-app">
              <el-tag size="small">{{ conv.appName }}</el-tag>
            </div>
          </div>
        </div>
      </template>
      <div v-if="filtered.length > pageNum * pageSize" class="load-more">
        <el-button text @click="pageNum++">加载更多</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  padding: 24px 32px;
}

.search-header {
  margin-bottom: 24px;

  h2 {
    font-size: 20px;
    color: var(--ev-c-text-1);
    margin-bottom: 16px;
  }
}

.search-input {
  width: 100%;
}

.search-placeholder,
.search-empty {
  padding: 40px 0;
}

.result-group {
  margin-bottom: 20px;
}

.group-title {
  padding: 8px 0;
  font-size: 12px;
  color: var(--ev-c-text-3);
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.result-title {
  flex: 1;
  font-size: 14px;
  color: var(--ev-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-time {
  font-size: 12px;
  color: var(--ev-c-text-3);
  white-space: nowrap;
}

.load-more {
  text-align: center;
  padding: 12px 0;
}
</style>
