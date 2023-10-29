<script setup lang="ts">
import type { FiltersPreset } from '@sonata-api/types'
import { computed, watch, type ComputedRef } from 'vue'
import { useRouter } from '@waltz-ui/web'
import { useParentStore } from '@waltz-ui/state-management'
import { WAsync } from '../../utils'
import WTabs from '../../w-tabs/w-tabs.vue'
import WIcon from '../../w-icon/w-icon.vue'
import WBadge from '../../w-badge/w-badge.vue'

type Props = {
  collection?: string
}

const props = defineProps<Props>()
const router = await useRouter()
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
  <div
    v-if="store && store.description.filtersPresets"
    class="topbar"
  >
    <w-tabs dropdown query="section">
      <template
        v-for="([presetName, preset]) in Object.entries(store.description.filtersPresets as Record<string, FiltersPreset<any>>)"
        v-slot:[presetName]
      >
        <div
          class="topbar__preset"
          @click="togglePreset(preset)"
        >
          <w-icon
            small
            v-if="preset.icon"
            :icon="preset.icon"
          >
            {{ preset.name || $tc(presetName, 2) }}
          </w-icon>
          <span v-else>{{ preset.name || $tc(presetName, 2) }}</span>

          <w-badge v-if="preset.badgeFunction">
            <w-async
              :initial-value="0"
              :promise="store.$functions[preset.badgeFunction]({ filters: preset.filters })"
            ></w-async>
          </w-badge>
        </div>
      </template>
    </w-tabs>
  </div>
</template>

<style scoped src="./w-crud-topbar.less"></style>
