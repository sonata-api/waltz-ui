<script setup lang="ts">
import { useStore } from 'waltz-ui'

const animalStore = useStore('animal')
</script>

<template>
  <button @click="animalStore.functions.get">Action!</button>
  <button @click="animalStore.actions.getAll">Function!</button>
  <button @click="animalStore.actions.insert({ what: { name: 'thor', specie: 'dog' } })">Insert</button>
  <pre>{{ animalStore }}</pre>
</template>
