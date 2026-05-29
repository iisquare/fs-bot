import { ref } from 'vue'
import { defineStore } from 'pinia'
import ApiUtil from '@renderer/utils/ApiUtil'
import ConversationDb from '@renderer/db/ConversationDb'

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  appId?: string
  appName?: string
}

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const currentId = ref<string | null>(null)
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)

  const pageSize = 20

  async function fetchConversations(append = false) {
    if (loading.value) return
    loading.value = true
    try {
      const result: any = await ConversationDb.list({
        page: page.value,
        pageSize
      })
      const data = ApiUtil.data(result) || []
      if (append) {
        conversations.value.push(...data)
      } else {
        conversations.value = data
      }
      hasMore.value = data.length >= pageSize
      if (data.length > 0 && !append) {
        page.value = 1
      }
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    page.value++
    await fetchConversations(true)
  }

  function selectConversation(id: string) {
    currentId.value = id
  }

  return {
    conversations,
    currentId,
    loading,
    hasMore,
    page,
    fetchConversations,
    loadMore,
    selectConversation
  }
})
