<script setup lang="ts">
import { useSlots, computed } from 'vue'
import { useBreakpoints } from '@waltz-ui/web'
import AeriaContextMenu from '../aeria-context-menu/aeria-context-menu.vue'
import AeriaIcon from '../aeria-icon/aeria-icon.vue'

type Props = {
  query?: string
  param?: string
  dropdown?: boolean
}

const props = defineProps<Props>()
const slots = useSlots()
const router = ROUTER

const breakpoints = useBreakpoints()

const source = 'query' in props && props.query
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
    <div
      v-if="breakpoints.md && !dropdown"
      class="tabs__horizontal"
    >
      <div
        v-if="$slots.default"
        class="
          tabs__tab
          tabs__tab--info
        "
      >
        <slot></slot>
      </div>

      <div
        v-for="(slotName, index) in Object.keys($slots).filter((slotName) => slotName !== 'default')"
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

    <div
      v-else
      class="tabs__context-menu"
    >
      <aeria-context-menu>
        <aeria-icon
          v-clickable
          icon-right
          icon="angle-down"
          class="tabs__context-menu-icon"
        >
          <slot :name="currentTab"></slot>
        </aeria-icon>

        <template
          v-for="slotName in Object.keys($slots).filter((slotName) => slotName !== 'default')"
          v-slot:[slotName]
        >
          <div @click="change(slotName)">
            <slot :name="slotName"></slot>
          </div>
        </template>
      </aeria-context-menu>
    </div>

  </div>

</template>

<style scoped src="./aeria-tabs.less"></style>
