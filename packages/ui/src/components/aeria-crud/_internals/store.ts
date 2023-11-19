import { ref } from 'vue'
import type { useAction } from '@waltz-ui/web'

export const isInsertVisible = ref<boolean|string>(false)
export const isInsertReadonly = ref<boolean>(false)
export const isFilterVisible = ref<boolean>(false)

export const call = ref<ReturnType<typeof useAction>[0]>()
export const actionEventBus = ref<ReturnType<typeof useAction>[1]>()
