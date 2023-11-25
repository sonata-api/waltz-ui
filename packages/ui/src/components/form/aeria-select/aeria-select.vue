<script setup lang="ts">
import type { FormFieldProps } from '../types'
import { ref, computed } from 'vue'
import AeriaIcon from '../../aeria-icon/aeria-icon.vue'

type Props = FormFieldProps<any> & {
  booleanRef?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue'|'change', value: any): void
}>()

const property = props.property||{}
const update = (value: any) => {
  if( props.booleanRef ) {
    modelValue.value = value
  }

  emit('update:modelValue', value?._id || value)
  emit('change', value?._id || value)
}

const modelValue = !props.booleanRef
  ? computed({
    get: () => props.modelValue,
    set: update
  })
  : (() => {
    const value = ref(props.modelValue)
    const comp = computed({
      get: () => value.value === 'true'
        ? true : value.value === 'false'
        ? false : null,
      set: (newVal) => {
        value.value = newVal
      }
    })

    return comp
  })()
</script>

<template>
  <div class="select">
    <aeria-icon 
      v-if="property.icon"
      :icon="property.icon"
      class="select__icon"
    ></aeria-icon>

    <select
      :key="modelValue?._id || modelValue"
      :value="modelValue?._id || modelValue"
      class="select__select"

      @click.stop="void"
      @change="update(($event.target as any).value)"
    >
      <option value="">{{ $t('none') }}</option>
      <option
        v-for="option in property.enum"
        :key="option"
        :value="option"
      >
        {{ property.translate ? $t(option) : option }}
      </option>
      <slot></slot>
    </select>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<style scoped src="./aeria-select.less"></style>
