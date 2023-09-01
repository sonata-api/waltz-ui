<script setup lang="ts">
import type { CollectionProperty } from '@sonata-api/types'
import { computed } from 'vue'
import { useParentStore } from '@waltz-ui/state-management'

type Props = {
  item: Record<string, any>
  indexes: Array<string>
  modelValue?: any
  property: CollectionProperty
}

type Emits = {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'change', value: Props['item']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const property = props.property
const store = useParentStore()

const isAlreadySelected = computed(() => {
  if( property.type === 'array' || Array.isArray(props.modelValue) ) {
    return Array.isArray(props.modelValue)
      && Object.values(props.modelValue).some(({ _id }) => props.item._id === _id)
  }

  return props.modelValue
    && props.item
    && props.modelValue._id === props.item._id
})

const select = () => {
  if( isAlreadySelected.value ) {
    return
  }

  const filterEmpties = (array: Array<any>) => array.filter(e => !!e?._id)
  const modelValue = property.type === 'array'
    ? filterEmpties(Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue])
    : props.modelValue

  emit('update:modelValue', property.type === 'array' && Array.isArray(modelValue)
    ? [ ...modelValue, props.item ]
    : props.item
  )

  emit('change', props.item)
}


const deselect = async (options?: { purge?: true }) => {
  if( property.s$purge && options?.purge ) {
    const { _id } = props.item
    await store.$actions.remove({ filters: { _id } })
  }

  const deleteFirst = () => {
    const modelValue = props.modelValue
    const idx = modelValue.findIndex((option: any) => option._id === props.item._id)

    modelValue.splice(idx, 1)
    return modelValue
  }

  emit('update:modelValue', property.type === 'array'
    ? deleteFirst()
    : null
  )
}
</script>

<template>
  <div
    v-clickable
    :class="{
      'item': true,
      'item--selected': isAlreadySelected
    }"

    @click="isAlreadySelected
      ? deselect()
      : select()"
  >
    <slot></slot>

    <div class="item__values">
      <div
        v-for="(index, idx) in indexes"
        :key="`index-${item._id}-${idx}`"
        class="item__value"
      >
        {{ item[index] }}
      </div>
    </div>

  </div>
</template>

<style scoped src="./w-search-item.scss"></style>
