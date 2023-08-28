<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '@waltz-ui/web'

type Props = {
  query?: string
  param?: string
}

const props = defineProps<Props>()

const source = (<any>props).query
  ? 'query'
  : 'params'

const currentTab = computed(() => {
  return router.currentRoute.value[source][props.query || props.param!]
})

const router = await useRouter()

const change = (tab: string) => {
  router.push({
    [source]: {
      [props.query || props.param!]: tab
    }
  })
}
</script>

<template>
  <div class="tabs">
    <div
      v-for="(slotName, index) in Object.keys($slots)"
      :key="slotName"
      :class="{
        'tabs__tab': true,
        'tabs__tab--current': slotName === currentTab
          || !currentTab && index === 0
      }"
      @click="change(slotName)"
    >
      <slot :name="slotName"></slot>
    </div>
  </div>
</template>

<style scoped src="./w-tabs.scss"></style>
