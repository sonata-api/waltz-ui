<script setup lang="ts">
import type { FormFieldProps } from '../types'
import { computed } from 'vue'
import WCheckbox from '../w-checkbox/w-checkbox.vue'

type Props = FormFieldProps<any> & {
  columns?: number
}

type Emits = {
  (e: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  columns: 1
})

const emit = defineEmits<Emits>()
const modelValue = computed(() => props.modelValue)

const updateValue = (value: any) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    class="options"
    :style="`
      --columns: ${columns||1};
      grid-template-columns: repeat(var(--columns), 1fr);
    `"
  >
    <div
      v-for="(option, index) in property.enum"
      :key="`option-${index}`"

      :class="`
        options__checkbox
        ${modelValue && 'options__checkbox--selected'}
    `">
        <w-checkbox
          :model-value="modelValue"
          v-bind="{
            value: option,
            property
          }"

          @update:model-value="updateValue"
        ></w-checkbox>
      </div>
  </div>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<style scoped src="./w-options.less"></style>
