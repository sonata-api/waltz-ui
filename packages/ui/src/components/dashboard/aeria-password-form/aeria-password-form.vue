<script setup lang="ts">
import { usePasswordPolicy } from '@waltz-ui/web'
import { computed, provide } from 'vue'
import AeriaForm from '../../form/aeria-form/aeria-form.vue'

type Props = {
  modelValue: Record<string, any> & {
    password: string
    confirmation: string
  }
}

const props = defineProps<Props>()
provide('storeId', null)

const passwordPolicy = usePasswordPolicy()

const passwordError = computed(() => {
  return passwordPolicy(
    props.modelValue.password,
    props.modelValue.confirmation,
  )
})
</script>

<template>
  <aeria-form
    :form="{
      password: {
        type: 'string',
        icon: 'key',
        inputType: 'password'
      },
      confirmation: {
        type: 'string',
        icon: 'key',
        inputType: 'password'
      },
    }"

    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  ></aeria-form>

  <div>
    {{ passwordError || 'Senhas conferem' }}
  </div>

  <slot v-bind="{ passwordError }"></slot>
</template>
