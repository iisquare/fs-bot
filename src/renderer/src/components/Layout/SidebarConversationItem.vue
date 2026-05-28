<script setup lang="ts">
import { formatTime } from '@renderer/utils/TimeUtil'

defineProps<{
  conversation: {
    id: string
    title: string
    updatedAt: string
  }
  active?: boolean
}>()

defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div
    class="conversation-item"
    :class="{ active }"
    @click="$emit('select', conversation.id)"
  >
    <div class="conv-title">{{ conversation.title || '新对话' }}</div>
    <div class="conv-time">{{ formatTime(conversation.updatedAt) }}</div>
  </div>
</template>

<style lang="scss" scoped>
.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 6px;
  margin: 2px 8px;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);
  }
}

.conv-title {
  font-size: 14px;
  color: var(--ev-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.conv-time {
  font-size: 12px;
  color: var(--ev-c-text-3);
  white-space: nowrap;
}
</style>
