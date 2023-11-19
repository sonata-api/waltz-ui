<script setup lang="ts">
import AeriaCrud from '../../../components/aeria-crud/aeria-crud.vue'

type Props = {
  collection: string
}

const props = defineProps<Props>()
</script>

<template>
  <aeria-crud
    v-if="collection"
    :collection="collection"
    :key="collection"
  >
    <template #empty v-if="$slots['crud-empty']">
      <slot name="crud-empty"></slot>
    </template>
  </aeria-crud>
</template>
