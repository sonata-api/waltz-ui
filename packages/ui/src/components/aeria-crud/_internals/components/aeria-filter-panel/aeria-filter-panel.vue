<script setup lang="ts">
import { useParentStore } from '@waltz-ui/state-management'
import AeriaPanel from '../../../../aeria-panel/aeria-panel.vue'
import AeriaForm from '../../../../form/aeria-form/aeria-form.vue'
import AeriaButton from '../../../../aeria-button/aeria-button.vue'
import AeriaBadge from '../../../../aeria-badge/aeria-badge.vue'

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
  <aeria-panel
    close-hint
    fixed-right
    title="Filtrar por"

    @close="emit('update:modelValue', false)"
    @overlay-click="emit('update:modelValue', false)"
  >
    <aeria-form
      v-model="store.filters"
      v-bind="{
        form: store.availableFilters,
        searchOnly: true,
        layout: store.description.formLayout || {}
      }"
    ></aeria-form>
    <template #footer>
      <aeria-button
        v-if="store.filtersCount > 0"
        variant="transparent"
        @click="
          store.$actions.clearFilters();
          filter();
          emit('update:modelValue', false)
      ">
        Limpar
        <aeria-badge>
          {{ store.filtersCount }}
        </aeria-badge>
      </aeria-button>
      <aeria-button
        large
        icon="filter"
        :disabled="!store.hasActiveFilters"
        @click="filter"
      >
        Filtrar
      </aeria-button>
    </template>
  </aeria-panel>
</template>
