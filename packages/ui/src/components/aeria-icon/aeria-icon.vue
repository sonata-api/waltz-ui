<script setup lang="ts">
import { inject } from 'vue'

type Props = {
  icon: string
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
        viewBox="0 0 24 24"
        data-component="icon"
        v-bind="{
          ...(fill ? { fill } : {})
        }"
      >
        <use :href="`/assets/icons.svg#line:${icon}`"></use>
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
