<script setup lang="ts">
import { inject } from 'vue'
import WBareButton from '../w-bare-button/w-bare-button.vue'
import WIcon from '../w-icon/w-icon.vue'

// #region props
type Size = 
  'small'
  | 'medium'
  | 'large'

type Variant =
  'normal'
  | 'alt'
  | 'transparent'
  | 'brand'

type Props = {
  size?: Size
  small?: boolean
  large?: boolean
  variant?: Variant
  icon?: string
  disabled?: boolean
  loading?: boolean
}
// #endregion props

const props = defineProps<Props>()

const variant = inject('buttonVariant', props.variant) || 'normal'
const size = (() => {
  switch( true ) {
    case props.small: return 'small'
    case props.large: return 'large'
  }

  return inject('buttonSize', props.size) || 'medium'
})()
</script>

<template>
  <w-bare-button
    :class="`
      button
      button--${variant}
      button--${size}
      ${loading && 'button--loading'}
    `"
    :disabled="disabled"
  >
    <div style="width: 100%">
      <w-icon
        v-if="icon"
        :name="icon"
        :small="size === 'small'"
        class="button__icon"
      >
        <slot></slot>
      </w-icon>

      <slot v-else></slot>
    </div>
  </w-bare-button>
</template>

<style scoped src="./w-button.scss"></style>
