<script setup lang="ts">
import { useStore } from '@waltz-ui/state-management'
import AeriaIcon from '../../aeria-icon/aeria-icon.vue'

const props = defineProps<{
  idx: number
  itr: number
  date: Date
  icon?: string
}>()

const metaStore = useStore('meta')
</script>

<template>
  <div
    v-clickable
    :class="{
      'toast': true,
      'toast--animate': metaStore.toasts[0].itr === itr
    }"
    @animationend="metaStore.$actions.popToast()"
    @click="metaStore.$actions.popToast(itr)"
  >
    <div>
      <aeria-icon
        v-if="icon"
        :icon="icon"
      >
        <slot></slot>
      </aeria-icon>

      <slot v-else></slot>
    </div>

    <div>
      {{ date }}
    </div>
  </div>
</template>

<style scoped src="./aeria-toast.less"></style>
