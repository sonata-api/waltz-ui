<script setup lang="ts">
import { inject, computed } from 'vue'
import { LayoutOptions } from '@sonata-api/types'
import { useParentStore } from '@waltz-ui/state-management'
import WTable from '../../../../w-table/w-table.vue'

type Props = {
  individualActions: any
  hasSelectionActions: boolean
  layoutOptions: LayoutOptions
  componentProps?: Record<string, any>
}

const props = defineProps<Props>()
const store = useParentStore()

const storeId = inject('storeId', '')
const componentProps = computed(() => {
  const original = {
    collection: storeId,
    checkbox: store.hasSelectionActions,
    columns: store.tableProperties,
    rows: store.items,
    actions: props.individualActions,
    layout: store.tableLayout
  }

  return Object.assign(original, props.componentProps)
})
</script>

<template>
  <slot v-if="$slots.inner" name="inner"></slot>
  <w-table
    v-if="store.properties"
    v-bind="componentProps"
    :key="store.$id"
  >
    <template
      v-for="slotName in Object.keys($slots).filter(key => !['inner'].includes(key))"
      v-slot:[slotName]="slotProps"
    >
      <slot
        v-bind="slotProps"
        :name="slotName"
      ></slot>
    </template>
  </w-table>
</template>
