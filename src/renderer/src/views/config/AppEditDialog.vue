<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'

const props = defineProps<{
  visible: boolean
  app?: any
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  saved: []
}>()

const formRef = ref<FormInstance>()
const saving = ref(false)

const form = ref({
  name: '',
  description: '',
  icon: '',
  systemPrompt: '',
  enabledKnowledgeBases: [] as string[],
  enabledPlugins: [] as string[],
  enabledSkills: [] as string[]
})

const isEdit = ref(false)

watch(
  () => props.visible,
  (val) => {
    if (val && props.app) {
      isEdit.value = true
      form.value = { ...props.app }
    } else if (val) {
      isEdit.value = false
      form.value = {
        name: '',
        description: '',
        icon: '',
        systemPrompt: '',
        enabledKnowledgeBases: [],
        enabledPlugins: [],
        enabledSkills: []
      }
    }
  }
)

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    emit('saved')
    handleClose()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑应用' : '创建应用'"
    width="600px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入应用名称' }]">
        <el-input v-model="form.name" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item label="图标" prop="icon">
        <el-input v-model="form.icon" placeholder="图标 URL 或图标名称" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入应用描述"
        />
      </el-form-item>
      <el-form-item label="系统提示词" prop="systemPrompt">
        <el-input
          v-model="form.systemPrompt"
          type="textarea"
          :rows="6"
          placeholder="请输入系统提示词"
        />
      </el-form-item>
      <el-form-item label="知识库">
        <el-select v-model="form.enabledKnowledgeBases" multiple placeholder="选择启用的知识库">
        </el-select>
      </el-form-item>
      <el-form-item label="插件">
        <el-select v-model="form.enabledPlugins" multiple placeholder="选择启用的插件">
        </el-select>
      </el-form-item>
      <el-form-item label="技能">
        <el-select v-model="form.enabledSkills" multiple placeholder="选择启用的技能">
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
