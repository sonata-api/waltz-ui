<script setup lang="ts">
import { computed } from 'vue'
import type { CollectionProperty } from '@sonata-api/types'
import { useParentStore } from '@waltz-ui/web'
import WIcon from '../../../../../w-icon/w-icon.vue'
import WSearchItem from '../w-search-item/w-search-item.vue'

type Props = {
  modelValue?: any
  indexes: Array<string>
  searchOnly?: boolean
  property: CollectionProperty
}

type Emits = {
  (e: 'update:modelValue' | 'pushBack', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const property = props.property
const store = useParentStore()

const selected = computed(() => {
  if( property.type === 'array' ) {
    return props.modelValue
  }

  return Object.keys(props.modelValue||{}).length > 0
    ? Array(props.modelValue)
    : []
})

const unselect = async (item: any, purge=true) => {
  if( property.s$purge && purge ) {
    const { _id } = item
    await store.remove({ filters: { _id } })
  }

  const deleteFirst = () => {
    const modelValue = props.modelValue
    const idx = modelValue.findIndex((option: any) => option._id === item._id)

    modelValue.splice(idx, 1)
    return modelValue
  }

  emit('update:modelValue', property.type === 'array'
      ? deleteFirst()
      : null
  )

  if( property.uniqueItems || (property.type === 'array' && props.searchOnly) ) {
    emit('pushBack', item)
  }
}
</script>

<template>
  <w-search-item
    v-for="item in selected"
    v-bind="{
      item,
      indexes
    }"
    :key="item._id"
    @click="unselect(item, false)"
  >
    <w-icon v-clickable icon="check-circle"></w-icon>
  </w-search-item>
</template>
