<script setup lang="ts">
type Props = {
  list?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="`
    grid
    ${list && 'grid--list'}
  `">
    <slot></slot>
  </div>
</template>

<style scoped src="./w-grid.less"></style>
