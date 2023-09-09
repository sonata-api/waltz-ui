<script setup lang="ts">
import { useSlots, computed } from 'vue'
import { useRouter } from '@waltz-ui/web'
import WContextMenu from '../w-context-menu/w-context-menu.vue'

type Props = {
  query?: string
  param?: string
}

const props = defineProps<Props>()
const slots = useSlots()
const router = await useRouter()

const source = (<any>props).query
  ? 'query'
  : 'params'

const currentTab = computed(() => {
  const tab = router.currentRoute.value[source][props.query || props.param!]
  if( tab ) {
    return tab
  }

  return Object.keys(slots)[0]
})

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
    <div class="tabs__horizontal">
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

    <div class="tabs__context-menu">
      <w-context-menu>
        <slot :name="currentTab"></slot>

        <template
          v-for="slotName in Object.keys($slots)"
          v-slot:[slotName]
        >
          <div @click="change(slotName)">
            <slot :name="slotName"></slot>
          </div>
        </template>
      </w-context-menu>
    </div>

  </div>

</template>

<style scoped src="./w-tabs.scss"></style>
