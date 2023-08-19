<script setup lang="ts">
import { useStore } from 'waltz-ui'
const animalStore = useStore('animal')
</script>

<template>
  <div>
    specie (from component b): {{ animalStore.specie }}
  </div>
</template>
