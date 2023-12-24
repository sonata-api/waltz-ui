<script setup lang="ts">
import type { FiltersPreset } from '@sonata-api/types'
import { computed, watch, type ComputedRef } from 'vue'
import { useParentStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'
import { AeriaAsync } from '../../utils'
import AeriaTabs from '../../aeria-tabs/aeria-tabs.vue'
import AeriaIcon from '../../aeria-icon/aeria-icon.vue'
import AeriaBadge from '../../aeria-badge/aeria-badge.vue'

type Props = {
  collection?: string
}

const props = defineProps<Props>()
const router = ROUTER
const route = router.currentRoute

const store = computed(() => {
  try {
    const collection = props.collection
      ? props.collection
      : (route.value.meta?.collection || route.value.params?.collection) as string

    return useParentStore(collection)
  } catch( e ) {
    return null
  }
})

const togglePreset = (preset: FiltersPreset<any> | null) => {
  if( !store.value ) {
    return
  }

  return (({ value: store }: ComputedRef<ReturnType<typeof useParentStore>|null>) => {
    if( !store ) {
      return
    }

    if( !preset ) {
      store.filtersPreset = {}
      store.preferredTableProperties = []
      store.pagination.offset = 0
      return
    }

    store.filtersPreset = preset.filters || {}
    store.preferredTableProperties = preset.table || []
    store.pagination.offset = 0
  })(store)
}

watch(route, (currRoute) => {
  if( !store.value ) {
    return
  }

  return ((store) => {
    if( !store ) {
      return
    }

    if( store.description.filtersPresets ) {
      const currPreset = currRoute.query.section as string
        || Object.keys(store.description.filtersPresets)[0]

      togglePreset(store.description.filtersPresets[currPreset])
    }

  })(store.value!)
}, { immediate: true })
</script>

<template>
  <aeria-tabs
    v-if="store && store.description.filtersPresets"
    dropdown
    query="section"
  >
    <template
      v-for="([presetName, preset]) in Object.entries(store.description.filtersPresets as Record<string, FiltersPreset<any>>)"
      v-slot:[presetName]
    >
      <div
        class="topbar__preset"
        @click="togglePreset(preset)"
      >
        <aeria-icon
          v-if="preset.icon"
          :icon="preset.icon"
        >
          {{ preset.name || t(presetName, { plural: true }) }}
        </aeria-icon>
        <div v-else>
          {{ preset.name || t(presetName, { plural: true }) }}
        </div>

        <aeria-badge v-if="preset.badgeFunction">
          <aeria-async
            :initial-value="0"
            :promise="store.$functions[preset.badgeFunction]({ filters: preset.filters })"
          ></aeria-async>
        </aeria-badge>
      </div>
    </template>
  </aeria-tabs>
</template>

<style scoped src="./aeria-crud-topbar.less"></style>
