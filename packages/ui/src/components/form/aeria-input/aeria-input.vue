<script setup lang="ts">
import type { CollectionProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { ref, inject, watch } from 'vue'
import { type MaskaDetail, vMaska } from 'maska'
import { useClipboard } from '@waltz-ui/web'

import AeriaInfo from '../../aeria-info/aeria-info.vue'
import AeriaIcon from '../../aeria-icon/aeria-icon.vue'

type InputType = string | number | Date

type InputVariant =
  | 'normal'
  | 'bold'
  | 'light'

type Props = FormFieldProps<InputType> & {
  variant?: InputVariant
  bordered?: boolean
}

const props = defineProps<Props>()
const property = props.property || {} as CollectionProperty
const bordered = props.bordered || inject('inputBordered', false)

const searchOnly = inject('searchOnly', false)
const innerInputLabel = inject('innerInputLabel', false)
const readOnly = !searchOnly && (property.readOnly || property.s$isGetter)

const copyToClipboard = useClipboard()

const emit = defineEmits<{
  (e: 'update:modelValue' | 'input', value: InputType): void
  (e: 'change', value: any): void
}>()

const variant = inject('inputVariant', props.variant) || 'normal'

const {
  s$icon: icon = property.s$inputType === 'search' && 'search-alt',
  s$mask: mask

} = property

const inputBind: {
  type: string
  placeholder?: string
  min?: number
  max?: number
  name?: string
  readonly?: boolean
} = {
  type: (() => {
    if( 'type' in property ) {
      if( ['number', 'integer'].includes(property.type!) ) {
        return 'number'
      }
    }

    if( property.s$inputType ) {
      return property.s$inputType
    }

    switch( typeof props.modelValue ) {
      case 'string': return 'text'
      case 'number': return 'number'
      default: return 'text'
    }
  })(),
  placeholder: innerInputLabel
    ? property.description || props.propertyName
    : property.s$placeholder
}

if( 'type' in property ) {
  if( property.type === 'number' ) {
    inputBind.min = property.minimum || property.exclusiveMinimum
    inputBind.max = property.maximum || property.exclusiveMaximum
  }

  inputBind.name = props.propertyName
  inputBind.readonly = readOnly

  if( property.type === 'string' && ['date', 'date-time'].includes(property.format!) ) {
    inputBind.type = !searchOnly && property.format === 'date-time'
      ? 'datetime-local'
      : 'date'
  }
}

if( inputBind.type === 'text' && searchOnly ) {
  inputBind.type = 'search'
}

const getDatetimeString = () => {
  try {
    const date = props.modelValue
      ? new Date(props.modelValue).toISOString().split('T').shift()
      : ''
    return date
  } catch( e ) {
    return ''
  }
}

const inputValue = ref(
  ['date', 'date-time'].includes(inputBind.type)
    ? getDatetimeString()
    : props.modelValue || ''
)

const updateValue = (value: InputType) => {
  const newVal = (() => {
    if( inputBind.type === 'number' ) {
      return Number(value)
    }

    if( !('type' in property && property.type === 'string') ) {
      return value
    }

    switch( property.format ) {
      case 'date':
      case 'date-time': {
        return new Date(value)
      }
        
      default: return value
    }
  })()

  emit('input', newVal)
  emit('update:modelValue', newVal)
}

const onInput = (
  event: CustomEvent<MaskaDetail> | InputEvent,
  options?: {
    masked?: true
  }
) => {
  const { masked } = options || {}
  if( !masked && (<CustomEvent<MaskaDetail>>event).detail?.unmasked ) {
    return
  }

  const value = inputValue.value = (<any>event).target.value
  const newValue = masked
    ? (<CustomEvent<MaskaDetail>>event).detail?.unmasked
    : value
    
  if( 'type' in property ) {
    if( property.type === 'number' && !newValue ) {
      updateValue(0)
      return
    }
  }

  updateValue(newValue!)
}

watch(() => props.modelValue, (value, oldValue) => {
  if( value instanceof Date ) {
    return
  }

  if( oldValue && !value ) {
    inputValue.value = 'type' in property && property.type === 'number'
      ? 0
      : ''
  }

  else if( value && oldValue === undefined ) {
    inputValue.value = value
  }
})
</script>

<template>
  <label class="input">
    <div class="input__label" v-if="!innerInputLabel">
      <slot v-if="$slots.default"></slot>
      <slot v-else name="description"></slot>
    </div>
    <div v-if="$slots.hint" class="input__hint">
      <slot name="hint"></slot>
    </div>
    <div
      v-if="property.s$element !== 'textarea'"
      :class="`
        input__container
        input__container--${variant}
        ${bordered && 'input__container--bordered'}
    `">
      <input
        v-maska
        v-bind="inputBind"
        v-focus="property.s$focus"
        :value="inputValue"
        data-component="input"
        :data-maska="mask"

        :class="`
          input__input
          input__input--${variant}
          ${icon && 'input__input--icon'}
          ${readOnly && 'input__input--readOnly'}
        `"

        @maska="onInput($event, { masked: true })"
        @input="onInput"
        @change="emit('change', $event)"
      />
      <aeria-icon 
        v-if="icon"
        :icon="icon"
        :class="`
          input__icon
          input__icon--${variant}
      `"></aeria-icon>

      <div
        v-if="readOnly"
        class="input__clipboard"
      >
        <aeria-info>
          <template #text>Copiar</template>
          <aeria-icon
            v-clickable
            icon="clipboard"
            @click="copyToClipboard(modelValue.toString())"
          ></aeria-icon>
        </aeria-info>
      </div>
    </div>

    <div
      v-else
      :class="`
        input__container
        input__container--${variant}
        ${bordered && 'input__container--bordered'}
    `">
      <textarea
        v-focus="property.s$focus"
        :placeholder="inputBind.placeholder"
        :readonly="inputBind.readonly"
        :value="inputValue"

        :class="`
          input__textarea
          input__input--${variant}
        `"

        @input="onInput"
      ></textarea>
    </div>
  </label>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<style scoped src="./aeria-input.less"></style>
