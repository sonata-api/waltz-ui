<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">
import type { ArrayProperty, EnumProperty, BooleanProperty, Property } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { computed, ref } from 'vue'

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

const checkbox = ref<any>(null)

const value = typeof props.value === 'object'
  ? ((props.value as any)?._id || props.value)
  : props.value||false

const selectedValues = (values: Props['modelValue'][]): (string|boolean)[] => {
  return values.map((v: any) => v._id || v)
}

const bindVal = computed({
  get: () => {
    if( !props.modelValue ) {
      return false
    }

    if( !('items' in property) ) {
      return props.modelValue === props.value
    }

    return Array.isArray(props.modelValue)
      ? selectedValues(props.modelValue).includes(props.value as string)
      : !!props.value
  },

  set: () => {
    if( property.readOnly ) {
      return
    }

    if( !('items' in property) ) {
      emit('update:modelValue', !props.modelValue)
      return
    }

    const values = props.modelValue
      ? [props.modelValue]
      : []

    emit('update:modelValue', !selectedValues(values).includes(value)
      ? [ ...values, value ]
      : selectedValues(values).filter((v) => v !== value))
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
      ref="checkbox"
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
        <div v-else-if="value" v-html="value"></div>
        <slot v-else></slot>
      </div>
      <div class="checkbox__hint">
        <slot name="hint" v-if="$slots.hint"></slot>
        <div v-else-if="property.hint" v-html="property.hint"></div>
      </div>
    </div>
  </label>
</template>

<style scoped src="./aeria-checkbox.less"></style>
