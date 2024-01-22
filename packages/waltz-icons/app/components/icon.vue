<script setup lang="ts">
defineProps<{
  name: string
  variant: string
}>()
</script>

<template>
  <svg
    width="64"
    height="64"
    viewBox="0 0 256 256"
  >
    <use :href="`assets/icons.svg#${variant}:${name}`"></use>
  </svg>
</template>

