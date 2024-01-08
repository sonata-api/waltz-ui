<script setup lang="ts">
import type { ArrayProperty, EnumProperty, BooleanProperty, Property } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { t } from '@waltz-ui/i18n'
import { computed } from 'vue'

type Props = FormFieldProps<any, (ArrayProperty | EnumProperty | BooleanProperty) & Property> & {
  value?: any
  variant?: string
}

const props = defineProps<Props>()
const property = props.property || {} as NonNullable<typeof props.property>

const type = !('enum' in property) && ['array', 'boolean'].includes(property.type)
  ? 'checkbox'
  : 'radio'

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', value: Props['modelValue']): void
}>()

const value = props.value || false

const bindVal = computed({
  get: () => {
    if( 'type' in property && property.type === 'boolean' ) {
      return !!props.value
    }

    if( 'items' in property ) {
      return props.modelValue?.includes(props.value)
    }

    return props.modelValue === props.value
  },

  set: () => {
    if( property.readOnly ) {
      return
    }

    if( 'type' in property && property.type === 'boolean' ) {
      emit('update:modelValue', !props.modelValue)
      return
    }

    if( 'items' in property ) {
      emit('update:modelValue', !props.modelValue?.includes(value)
        ? [ ...props.modelValue || [], value ]
        : props.modelValue.filter((v: any) => v !== value))
      return
    }

    emit('update:modelValue', props.value)
  }
})
</script>

<template>
  <label :class="`
    checkbox
    ${property.readOnly && 'checkbox--readOnly'}
  `">
    <input
      v-model="bindVal"
      v-bind="{
        type,
        readOnly: property.readOnly,
        checked: bindVal
      }"
      class="checkbox__input"
    />

    <div
      v-clickable
      class="checkbox__text"
    >
      <div>
        <slot name="description" v-if="$slots.description"></slot>
        <div v-else-if="value" v-html="property.translate ? t(value) : value"></div>
        <slot v-else></slot>
      </div>
      <div class="checkbox__hint">
        <slot name="hint" v-if="$slots.hint"></slot>
        <div v-else-if="property.hint" v-html="property.hint"></div>
      </div>
    </div>
  </label>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<style scoped src="./aeria-checkbox.less"></style>
