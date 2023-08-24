<script setup lang="ts">
import { useParentStore } from '@waltz-ui/state-management'
import WBox from '../../../../w-box/w-box.vue'
import WForm from '../../../../form/w-form/w-form.vue'
import WButton from '../../../../w-button/w-button.vue'

type Emits = {
  (e: 'update:modelValue', value: boolean): void
}

const emit = defineEmits<Emits>()
const store = useParentStore()

const filter = () => {
  store.pagination.offset = 0
  store.$actions.filter()
  emit('update:modelValue', false)
}
</script>

<template>
  <w-box
    close-hint
    fixed-right
    title="Filtrar por"

    @close="emit('update:modelValue', false)"
    @overlay-click="emit('update:modelValue', false)"
  >
    <w-form
      v-model="store.filters"
      v-bind="{
        form: store.availableFilters,
        searchOnly: true,
        layout: store.description.formLayout || {}
      }"
    ></w-form>
    <template #footer>
      <w-button
        variant="transparent"
        @click="store.$actions.clearFilters"
      >
        Limpar
      </w-button>
      <w-button
        icon="filter"
        :disabled="!store.hasActiveFilters"
        @click="filter"
      >
        Filtrar
      </w-button>
    </template>
  </w-box>
</template>

<style scoped src="./w-filter-panel.scss"></style>
