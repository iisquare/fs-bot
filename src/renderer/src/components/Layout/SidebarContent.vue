<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSidebarStore } from '@renderer/stores/sidebar'
import { useConversationStore } from '@renderer/stores/conversation'
import { groupByTime, GROUP_LABELS } from '@renderer/utils/TimeUtil'
import { page } from '@renderer/router/config'
import SidebarConversationItem from './SidebarConversationItem.vue'

const sidebar = useSidebarStore()
const conversation = useConversationStore()

onMounted(() => {
  conversation.fetchConversations()
})

const grouped = computed(() => {
  return groupByTime(conversation.conversations)
})

const groupKeys = ['today', 'yesterday', 'thisWeek', 'earlier'] as const
</script>

<template>
  <div class="sidebar-content">
    <!-- Default: Conversation History -->
    <div v-if="sidebar.mode === 'default'" class="mode-default">
      <template v-for="key in groupKeys" :key="key">
        <div v-if="grouped[key].length > 0" class="history-group">
          <div class="group-title">{{ GROUP_LABELS[key] }}</div>
          <SidebarConversationItem
            v-for="conv in grouped[key]"
            :key="conv.id"
            :conversation="conv"
            :active="conversation.currentId === conv.id"
            @select="conversation.selectConversation($event)"
          />
        </div>
      </template>
      <div v-if="conversation.conversations.length === 0" class="group-empty">
        暂无对话记录
      </div>
    </div>

    <!-- Config: Config Menu -->
    <div v-else-if="sidebar.mode === 'config'" class="mode-config">
      <el-menu
        :default-active="$route?.path"
        router
        class="config-menu"
      >
        <el-menu-item :index="page.profile">
          <LayoutIcon name="plus.user" />
          <span>个人信息</span>
        </el-menu-item>
        <el-menu-item :index="page.configApps">
          <LayoutIcon name="menu.apps" />
          <span>应用管理</span>
        </el-menu-item>
        <el-menu-item :index="page.configKnowledge">
          <LayoutIcon name="menu.knowledge" />
          <span>知识库</span>
        </el-menu-item>
        <el-menu-item :index="page.configTools">
          <LayoutIcon name="menu.tools" />
          <span>工具管理</span>
        </el-menu-item>
        <el-menu-item :index="page.configSkills">
          <LayoutIcon name="menu.skills" />
          <span>技能管理</span>
        </el-menu-item>
        <el-menu-item :index="page.settings">
          <LayoutIcon name="plus.setting" />
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-content {
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
    transition: background 0.3s;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }
}

.mode-default {
  padding: 8px 0;
}

.history-group {
  .group-title {
    padding: 8px 16px;
    font-size: 12px;
    color: var(--ev-c-text-3);
  }
}

.group-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--ev-c-text-3);
}

.mode-config {
  .config-menu {
    border-right: none;
  }
}
</style>
