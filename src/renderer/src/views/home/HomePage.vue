<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { page } from '@renderer/router/config'
import { useConfigStore } from '@renderer/stores/config'
import ConversationMessage from './ConversationMessage.vue'
import ConversationInput from './ConversationInput.vue'

const router = useRouter()
const config = useConfigStore()

const selectedApp = ref<any>(null)
const messages = ref<any[]>([])

onMounted(() => {
  config.fetchApps()
})

function selectApp(app: any) {
  selectedApp.value = app
}

function backToAppSelection() {
  selectedApp.value = null
  messages.value = []
}

function handleSend(content: string) {
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content,
    createdAt: new Date().toISOString()
  })
}
</script>

<template>
  <div class="home-page">
    <template v-if="!selectedApp">
      <div class="app-selection">
        <div class="selection-header">
          <h2>选择一个应用开始对话</h2>
        </div>
        <div v-if="config.apps.length === 0" class="no-apps">
          <el-empty description="暂无可用应用">
            <el-button type="primary" @click="router.push(page.configApps)">
              创建应用
            </el-button>
          </el-empty>
        </div>
        <div v-else class="app-grid">
          <el-card
            v-for="app in config.apps"
            :key="app.id"
            shadow="hover"
            class="app-card"
            @click="selectApp(app)"
          >
            <div class="app-card-body">
              <el-avatar :size="48" :src="app.icon" />
              <h3>{{ app.name }}</h3>
              <p>{{ app.description }}</p>
            </div>
          </el-card>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="conversation-view">
        <div class="conversation-header">
          <div class="conv-header-left">
            <el-button text @click="backToAppSelection">
              &larr; 返回
            </el-button>
            <span class="conv-app-name">{{ selectedApp.name }}</span>
          </div>
        </div>
        <div class="message-list">
          <div v-if="messages.length === 0" class="message-empty">
            开始新对话
          </div>
          <ConversationMessage
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
          />
        </div>
        <ConversationInput @send="handleSend" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-selection {
  padding: 40px;
}

.selection-header {
  margin-bottom: 24px;

  h2 {
    font-size: 20px;
    color: var(--ev-c-text-1);
  }
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.app-card {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .app-card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;

    h3 {
      font-size: 16px;
      color: var(--ev-c-text-1);
    }

    p {
      font-size: 13px;
      color: var(--ev-c-text-3);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

.no-apps {
  padding: 60px 0;
}

.conversation-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.conv-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conv-app-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--ev-c-text-1);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-empty {
  text-align: center;
  color: var(--ev-c-text-3);
  padding: 60px 0;
}
</style>
