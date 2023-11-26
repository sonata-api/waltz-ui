<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import type { Property, BooleanProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { computed } from 'vue'

type Props = FormFieldProps<any, Property & BooleanProperty>

type Emits = {
  (e: 'update:modelValue' | 'change', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const property = props.property || {} as Property

const toggle = () => {
  if( !property.readOnly ) {
    emit('change', !props.modelValue)
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <div class="switch-wrapper">
    <a
      v-clickable="{
        blocked: property.readOnly
      }"

      :class="`
        switch
        ${modelValue && 'switch--active'}
        ${property.readOnly && 'switch--readOnly'}
      `"
      @click.stop="toggle"
    >
      <div class="switch__slider"></div>
      <div :class="`
        switch__dummy
        ${!modelValue && 'switch__dummy--flex'}
      `"></div>
    </a>

    <slot v-if="$slots.default"></slot>

    <div v-else>
      {{ property.description || propertyName }}
    </div>
  </div>
</template>

<style scoped src="./aeria-switch.less"></style>
