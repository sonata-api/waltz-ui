<script setup lang="ts">
import { useStore } from '@waltz-ui/web'
import WIcon from '../../w-icon/w-icon.vue'

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
    @animationend="metaStore.popToast()"
    @click="metaStore.popToast(itr)"
  >
    <div>
      <w-icon
        v-if="icon"
        small
        :name="icon"
      >
        <slot></slot>
      </w-icon>

      <slot v-else></slot>
    </div>

    <div>
      {{ date }}
    </div>
  </div>
</template>

<style scoped src="./w-toast.scss"></style>
