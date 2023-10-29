<script setup lang="ts">
import { inject } from 'vue'

type Props = {
  icon: string
  variant?: string
  size?: string
  small?: boolean
  medium?: boolean
  alt?: boolean
  reactive?: boolean|null
  iconRight?: boolean
  fill?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'line',
  reactive: null
})

const size = (() => {
  switch( true ) {
    case props.small: return 'small'
    case props.medium: return 'medium'
  }

  return inject('iconSize', props.size) || 'medium'
})()

const reactive = typeof props.reactive === 'boolean'
  ? props.reactive
  : inject('iconReactive', false)
</script>

<template>
  <a
    :class="`
      icon
      ${reactive && 'icon--reactive'}
      ${alt && 'icon--alt'}
      ${$slots.default && 'icon--centered'}
  `">
    <div :class="`
      icon__icon
      ${ size && `icon__icon--${size}` }
      ${ iconRight && 'icon__icon--right' }
      ${
        small
          ? 'icon__icon--small'
          : 'icon__icon--medium'
      }
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
        <use :href="`/assets/icons.svg#${variant}:${icon}`"></use>
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

<style scoped src="./w-icon.less"></style>
