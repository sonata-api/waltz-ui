<script setup lang="ts">
import type { CollectionStore } from '@waltz-ui/web'
import { useParentStore } from '@waltz-ui/state-management'
import { convertToSearchQuery } from '@waltz-ui/web'
import { useRouter } from 'vue-router'
import AeriaPanel from '../../../../aeria-panel/aeria-panel.vue'
import AeriaForm from '../../../../form/aeria-form/aeria-form.vue'
import AeriaButton from '../../../../aeria-button/aeria-button.vue'
import AeriaBadge from '../../../../aeria-badge/aeria-badge.vue'

type Emits = {
  (e: 'update:modelValue', value: boolean): void
}

const emit = defineEmits<Emits>()
const store = useParentStore() as CollectionStore
const router = useRouter()

const filter = () => {
  store.pagination.offset = 0
  store.$actions.filter()
  emit('update:modelValue', false)

  router.push({
    query: convertToSearchQuery(store),
  })

  console.log(convertToSearchQuery(store))
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
        searchOnly: true,
        form: store.availableFilters,
        layout: store.description.formLayout as any || {}
      }"

      focus
    />
    <template #footer>
      <aeria-button
        v-if="store.filtersCount > 0"
        variant="transparent"
        @click="
          store.$actions.clearFilters();
          filter();
          emit('update:modelValue', false)
        "
      >
        Limpar
        <aeria-badge>
          {{ store.filtersCount }}
        </aeria-badge>
      </aeria-button>
      <aeria-button
        large
        icon="funnel"
        :disabled="!store.hasActiveFilters"
        @click="filter"
      >
        Filtrar
      </aeria-button>
    </template>
  </aeria-panel>
</template>

