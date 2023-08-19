<script setup lang="ts">
import { useStore } from 'waltz-ui'
const animalStore = useStore('animal')
</script>

<template>
  <div>
    specie (component a): {{ animalStore.specie }}
  </div>
</template>
