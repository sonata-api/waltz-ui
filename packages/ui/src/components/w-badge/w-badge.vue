<script setup lang="ts">
type Props = {
  large?: boolean
  alt?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="`
    badge
    ${large && 'badge--large'}
    ${alt && 'badge--alt'}
  `">
    <slot></slot>
  </div>
</template>

<style scoped src="./w-badge.less"></style>
