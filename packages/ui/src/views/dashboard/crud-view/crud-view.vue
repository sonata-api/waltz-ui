<script setup lang="ts">
import WCrud from '../../../components/w-crud/w-crud.vue'

type Props = {
  collection: string
}

const props = defineProps<Props>()
</script>

<template>
  <w-crud
    v-if="collection"
    :collection="collection"
    :key="collection"
  >
    <template #empty v-if="$slots['crud-empty']">
      <slot name="crud-empty"></slot>
    </template>
  </w-crud>
</template>
