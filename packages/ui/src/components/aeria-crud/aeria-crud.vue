<script setup lang="ts">
import type { Layout } from '@sonata-api/types'
import { onUnmounted, ref, computed, provide, inject, watch, isRef, type Ref } from 'vue'
import { deepClone, getReferenceProperty } from '@sonata-api/common'
import { useAction, useBreakpoints, useDebounce, useScrollObserver, type ActionFilter, type ActionEvent } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'

import AeriaPagination from '../aeria-pagination/aeria-pagination.vue'
import AeriaButton from '../aeria-button/aeria-button.vue'
import AeriaIcon from '../aeria-icon/aeria-icon.vue'
import AeriaInput from '../form/aeria-input/aeria-input.vue'
import AeriaContextMenu from '../aeria-context-menu/aeria-context-menu.vue'
import AeriaBadge from '../aeria-badge/aeria-badge.vue'

import { getLayout } from './_internals/layouts'
import AeriaFilterPanel from './_internals/components/aeria-filter-panel/aeria-filter-panel.vue'
import AeriaInsertPanel from './_internals/components/aeria-insert-panel/aeria-insert-panel.vue'

import {
  isInsertVisible,
  isInsertReadonly,
  isFilterVisible,
  call,
  actionEventBus

} from './_internals/store'

type Props = {
  collection: string
  noControls?: boolean
  noActions?: boolean
  noFetch?: boolean
  noLayoutToggle?: boolean
  layout?: Layout
  action?: Ref<ReturnType<typeof useAction>> | ReturnType<typeof useAction>
  componentProps?: Record<string, any>
  scrollPagination?: boolean
}

type Emits = {
  (e: 'uiEvent', event: ActionEvent): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()
const router = ROUTER

const debounce = useDebounce({
  delay: 600
})

const metaStore = useStore('meta')
const breakpoints = useBreakpoints()
const { reachedEnd, detach: detachScrollListener } = useScrollObserver(null, {
  antecipate: 600
})

const scrollPagination = !breakpoints.value.md || props.scrollPagination

if( scrollPagination ) {
  watch(reachedEnd, (value) => {
    if( value && store.pagination.recordsTotal > store.items.length && batch.value < MAX_BATCHES ) {
      batch.value += 1
      fetchItems()
    }
  })
}

const store = useStore(props.collection)

const action = props.action
  ? isRef(props.action)
    ? props.action.value
    : props.action
  : useAction(store, router)

call.value = action[0]
actionEventBus.value = action[1]

const batch = ref(0)
const MAX_BATCHES = 30

const firstFetch = ref(false)

const fetchItems = async (optPayload?: ActionFilter) => {
  const payload: ActionFilter = {
    limit: store.pagination.limit,
    project: store.preferredTableProperties?.length > 0
      ? store.preferredTableProperties
      : store.description.table || Object.keys(store.properties)
  }

  if( batch.value > 0 ) {
    payload.limit = 15
    payload.offset = batch.value * payload.limit
  }

  if( store.description.tableMeta ) {
    payload.project = payload.project!.concat(store.description.tableMeta)
  }

  if( optPayload ) {
    Object.assign(payload, optPayload)
  }

  store.loading.getAll = true
  store.activeFilters = payload.filters
  const { data, pagination } = await store.$functions.getAll(payload)

  store.pagination = pagination

  if( batch.value === 0 ) {
    store.items.splice(0)
  }

  store.items.push(...data)
  store.loading.getAll = false
  firstFetch.value = true
}

const emptyComponent = inject('emptyComponent')

watch(router.currentRoute, async (route) => {
  metaStore.view.title = props.collection
  metaStore.view.collection = props.collection
  isInsertReadonly.value = false

  if( !props.noFetch && !route.query._popstate ) {
    store.textQuery = ''
    await fetchItems()
  }
}, {
  immediate: true,
  flush: 'post'
})

const [performLazySearch] = debounce((value: string) => {
  if( !value ) {
    store.filters = deepClone(store.freshFilters)
    batch.value = 0
    return fetchItems()
  }

  store.filters = Object.assign(deepClone(store.freshFilters), {
    $text: {
      $search: `"${value}"`,
      $caseSensitive: false
    }
  })

  return fetchItems({
    offset: 0
  })
})

watch(() => store.textQuery, (value) => {
  performLazySearch(value)
})

const toggleLayout = (store: any) => {
  store.currentLayout = store.currentLayout === 'tabular'
    ? store.description.layout!.name
    : 'tabular'
}

onUnmounted(() => {
  store.$actions.clearFilters()
  detachScrollListener()
})

watch(() => actionEventBus.value, async (_event) => {
  const event = deepClone(_event!)
  let getPromise: ReturnType<typeof store.$actions.get>
  if( !event ) {
    return
  }

  if (
    [
      'spawnEdit',
      'spawnView',
      'duplicate',
    ].includes(event.name)
  ) {
    getPromise = store.$actions.get({
      filters: {
        _id: event.params._id
      }
    })
  }

  if( event.name === 'spawnAdd' ) {
    store.$actions.clearItem()
    if( event.params?.item ) {
      store.$actions.setItem(event.params.item)
      Object.keys(event.params.item).forEach((key) => {
        delete store.referenceItem[key]
      })
    }
    isInsertVisible.value = 'add'
  }

  else if( event.name === 'spawnEdit' ) {
    store.$actions.setItem(event.params)
    isInsertVisible.value = 'edit'
  }

  else if( event.name === 'spawnView' ) {
    isInsertReadonly.value = true
    isInsertVisible.value = 'view'
  }

  else if( event.name === 'duplicate' ) {
    await getPromise

    const newItem = Object.entries(store.item).reduce((a, [key, value]) => {
      const property = store.properties[key]||{}
      if( property.readOnly ) {
        return a
      }

      const unbound = (value: any) => {
        if( getReferenceProperty(property)?.$ref === 'file' ) {
          return {}
        }
        if( property.inline && value ) {
          const { _id, ...rest } = value
          return rest
        }
        return value
      }

      value = Array.isArray(value)
        ? value.map(unbound)
        : unbound(value)

      return {
        ...a,
        [key]: value
      }
    }, {} as Record<string, any>)

    store.$actions.setItem(newItem)
    delete store.item._id

    store.referenceItem = {}
    isInsertVisible.value = 'duplicate'
  }

  else {
    emit('uiEvent', event)
  }

}, { deep: true })


watch(() => isInsertVisible, (value) => {
  if( value.value === false ) {
    metaStore.view.collection = props.collection
    store.$actions.clearItem()
  }
})

const individualActions = computed(() => {
  return store.individualActions.map((action: any) => ({
    click: call.value!(action),
    ...action
  }))
})

const actionButtons = computed(() => {
  return store.actions.filter((action: any) => !action.button)
})

provide('storeId', computed(() => props.collection))
provide('individualActions', individualActions)
</script>

<template>
  <aeria-filter-panel
    v-if="isFilterVisible"
    v-model="isFilterVisible"
    :key="store.$id"
  ></aeria-filter-panel>

  <aeria-insert-panel v-if="isInsertVisible">
    <template
      v-for="slotName in Object.keys($slots).filter(key => key.startsWith('field-'))"
      v-slot:[slotName]="slotProps"
    >
      <slot
        v-bind="slotProps"
        :name="slotName"
      ></slot>
    </template>
  </aeria-insert-panel>

  <div
    v-if="!noActions && (
      store.description.search?.active
      || Object.keys(store.availableFilters).length > 0
      || (store?.actions.length > 0 || $slots.actions)
      || (
        !noLayoutToggle
        && store.description.layout
        && store.description.layout?.name !== 'tabular'
    )
    )"
    class="crud__controls"
  >
    <div
      v-if="store.description.search?.active"
      class="crud__search"
    >
      <aeria-input
        v-model="store.textQuery"
        v-bind="{
          property: {
            type: 'string',
            placeholder: store.description.search.placeholder || 'Pesquise aqui',
            inputType: 'search'
          }
        }"
      ></aeria-input>
    </div>

    <div class="crud__actions">
      <aeria-context-menu v-if="
        actionButtons.length > 0
          || (!noLayoutToggle
            && store.description.layout
            && store.description.layout?.name !== 'tabular'
          )
      ">
        <aeria-button
          variant="transparent"
          icon="sliders-v"
        >
          <aeria-badge v-if="store.filtersCount">
            {{ store.filtersCount }}
          </aeria-badge>
        </aeria-button>

        <template
          #filter
          v-if="Object.keys(store.availableFilters).length > 0"
        >
          <aeria-icon
            v-clickable
            icon="filter"
            @click="isFilterVisible = true"
          >
            Filtros
          </aeria-icon>

          <div class="crud__context-badge">
            <aeria-badge v-if="store.filtersCount">
              {{ store.filtersCount }}
            </aeria-badge>
          </div>
        </template>

        <template
          #layout-toggle
          v-if="
            !noLayoutToggle
              && store.description.layout
              && store.description.layout?.name !== 'tabular'
          "
        >
          <aeria-icon
            v-clickable
            icon="table"
            @click="toggleLayout(store)"
          >
            Alternar layout
          </aeria-icon>
        </template>

        <!-- <aeria-icon icon="setting"></aeria-icon> -->
        <template
          v-for="(actionProps, index) in actionButtons"
          v-slot:[`action-${index}`]
        >
          <aeria-icon
            :icon="actionProps.icon || 'setting'"
            :disabled="store.selected.length === 0 && actionProps.selection"

            @click="call!(actionProps)({ _id: store.selected.map((item: any) => item._id) })"
          >
            {{ t(actionProps.name) }}
          </aeria-icon>
        </template>

      </aeria-context-menu>

      <aeria-button
        v-else-if="Object.keys(store.availableFilters).length > 0"
        variant="transparent"
        icon="filter"
        @click="isFilterVisible = true"
      >
        <div>Filtros</div>
        <aeria-badge v-if="store.filtersCount">
          {{ store.filtersCount }}
        </aeria-badge>
      </aeria-button>

      <aeria-button
        v-for="(actionProps, index) in store.actions.filter((action: any) => action.button)"
        :key="`action-${index}`"

        :icon="actionProps.icon"
        :disabled="store.selected.length === 0 && actionProps.selection"

        @click="call!(actionProps)({ _id: store.selected.map((item: any) => item._id) })"
      >
        {{ t(actionProps.name) }}
      </aeria-button>

      <slot
        v-if="$slots.actions"
        name="actions"
      ></slot>
    </div>

  </div>

  <div v-loading="(!scrollPagination || batch === MAX_BATCHES) && store.loading.getAll">
    <div v-if="
      store.itemsCount === 0
      && !store.loading.getAll
      && firstFetch
      && (emptyComponent || $slots.empty)
    ">
      <component
        v-if="emptyComponent"
        :is="emptyComponent"
        v-bind="{
          collection: store.$id
        }"
      >
      </component>

      <slot
        v-else
        v-bind="{
          collection: store.$id
        }"
        name="empty"
      ></slot>
    </div>

    <slot
      v-else-if="$slots.component"
      v-bind="{
        store
      }"
      name="component"
    ></slot>

    <component
      v-else
      v-bind="{
        individualActions,
        layoutOptions: layout?.options || store.layout.options,
        componentProps
      }"
      :is="getLayout(layout?.name || store.$currentLayout)"
      :component-name="layout?.name || store.$currentLayout"
    >
      <template
        v-for="slotName in Object.keys($slots).filter(key => key.startsWith('row-'))"
        v-slot:[slotName]="slotProps"
      >
        <slot
          v-bind="slotProps"
          :name="slotName"
        ></slot>
      </template>

      <template #tfoot v-if="$slots.tfoot">
        <slot name="tfoot"></slot>
      </template>
    </component>
  </div>

  <div
    v-if="!store.loading.getAll && store.itemsCount > 0"
    class="crud__pagination"
  >
    <aeria-pagination :pagination="store.pagination"></aeria-pagination>
  </div>

</template>

<style scoped src="./aeria-crud.less"></style>
