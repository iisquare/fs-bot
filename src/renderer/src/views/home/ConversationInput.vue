<script setup lang="ts">
import { ref } from 'vue'

const inputText = ref('')

const emit = defineEmits<{
  send: [content: string]
}>()

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
}
</script>

<template>
  <div class="conversation-input">
    <el-input
      v-model="inputText"
      type="textarea"
      :rows="3"
      placeholder="输入消息... (Enter 发送)"
      resize="none"
      @keyup.enter.exact="handleSend"
    />
    <el-button
      type="primary"
      :disabled="!inputText.trim()"
      @click="handleSend"
    >
      发送
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.conversation-input {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);

  :deep(.el-textarea) {
    flex: 1;
  }
}
</style>
