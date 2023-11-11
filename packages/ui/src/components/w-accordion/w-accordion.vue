<script setup lang="ts">
import { ref } from 'vue'
const currentTab = ref<string|null>(null)
</script>

<template>
    <div
      v-for="(slotName, index) in Object.keys($slots).filter((slotName) => slotName !== 'default')"
      :key="slotName"
      :class="{
        'tabs__tab': true,
        'tabs__tab--current': slotName === currentTab
          || !currentTab && index === 0
      }"
      @click="currentTab = slotName"
    >
      <slot :name="slotName"></slot>
    </div>

</template>
