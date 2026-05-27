<script setup lang="ts">
import { computed, markRaw } from 'vue'
import IPlusUser from '~icons/plus/user'
import IPlusLock from '~icons/plus/lock'
import IPlusLoading from '~icons/plus/loading'
import ILayoutCaptcha from '~icons/layout/captcha'

const props = defineProps<{
  name: string
  filled?: boolean
}>()

const icons: Record<string, any> = {
  'i-plus-user': markRaw(IPlusUser),
  'i-plus-lock': markRaw(IPlusLock),
  'i-plus-loading': markRaw(IPlusLoading),
  'i-layout-captcha': markRaw(ILayoutCaptcha)
}

const component = computed(() => icons[props.name])
</script>

<template>
  <el-icon v-if="component">
    <component :is="component" :filled="filled" />
  </el-icon>
</template>
