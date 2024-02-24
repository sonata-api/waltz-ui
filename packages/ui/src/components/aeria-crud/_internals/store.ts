import type { useAction, ActionEvent } from '@waltz-ui/web'
import { ref } from 'vue'

export const isInsertVisible = ref<boolean | string>(false)
export const isInsertReadonly = ref<boolean>(false)
export const isFilterVisible = ref<boolean>(false)

export const call = ref<ReturnType<typeof useAction>[0]>((..._args: any) => null as any)
export const actionEventBus = ref<ActionEvent>()
