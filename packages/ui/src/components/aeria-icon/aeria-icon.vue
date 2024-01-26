<script setup lang="ts">
import type { Icon } from '@sonata-api/types'
import { inject, computed } from 'vue'

type Props = {
  icon: Icon
  size?: string
  medium?: boolean
  reactive?: boolean|null
  iconRight?: boolean
  fill?: string
}

const props = defineProps<Props>()

const reactive = typeof props.reactive === 'boolean'
  ? props.reactive
  : inject('iconReactive', false)

const computedIcon = computed(() => {
  return props.icon.includes(':')
    ? props.icon
    : `regular:${props.icon}`
})
</script>

<template>
  <a
    :class="`
      icon
      ${reactive && 'icon--reactive'}
      ${
        $slots.default
        ? 'icon--centered'
        : 'icon--standalone'
      }
  `">
    <div :class="`
      icon__icon
      ${ size && `icon__icon--${size}` }
      ${ iconRight && 'icon__icon--right' }
    `">
      <svg
        width="24"
        height="24"
        viewBox="0 0 256 256"
        data-component="icon"
        v-bind="{
          ...(fill ? { fill } : {})
        }"
      >
        <use :href="`/assets/icons.svg#${computedIcon}`"></use>
      </svg>
    </div>
    <div
      v-if="$slots.default"
      data-component="icon-label"
    >
      <slot></slot>
    </div>
  </a>
</template>

<style scoped src="./aeria-icon.less"></style>
