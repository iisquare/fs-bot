<script setup lang="ts">
defineProps<{
  message: {
    id: string
    role: string
    content: string
  }
}>()
</script>

<template>
  <div class="message-item" :class="message.role">
    <div class="message-bubble">
      {{ message.content }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-item {
  margin-bottom: 16px;

  .message-bubble {
    display: inline-block;
    max-width: 70%;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &.user {
    text-align: right;

    .message-bubble {
      background: var(--el-color-primary);
      color: #fff;
      border-bottom-right-radius: 2px;
    }
  }

  &.assistant {
    text-align: left;

    .message-bubble {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      color: var(--ev-c-text-1);
      border-bottom-left-radius: 2px;
    }
  }
}
</style>
