<script setup lang="ts">
import type { Layout } from '@sonata-api/types'
import { onUnmounted, computed, provide, inject, watch, isRef, type Ref } from 'vue'
import { deepClone } from '@sonata-api/common'
import { useAction, useDebounce, type ActionFilter, type ActionEvent } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import WPagination from '../w-pagination/w-pagination.vue'
import WButton from '../w-button/w-button.vue'
import WIcon from '../w-icon/w-icon.vue'
import WInput from '../form/w-input/w-input.vue'
import WContextMenu from '../w-context-menu/w-context-menu.vue'
import WBadge from '../w-badge/w-badge.vue'

import { getLayout } from './_internals/layouts'
import WFilterPanel from './_internals/components/w-filter-panel/w-filter-panel.vue'
import WInsertPanel from './_internals/components/w-insert-panel/w-insert-panel.vue'

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

const store = useStore(props.collection)
const action = props.action
  ? isRef(props.action)
    ? props.action.value
    : props.action
  : useAction(store, router)

call.value = action[0]
actionEventBus.value = action[1]

const fetchItems = async (optPayload?: ActionFilter) => {
  const payload: ActionFilter = {
    project: [
      ...(
        store.preferredTableProperties?.length > 0
          ? store.preferredTableProperties
          : store.description.table || Object.keys(store.properties)
      ),
      ...store.description.tableMeta||[]
    ],
  }

  if( optPayload ) {
    Object.assign(payload, optPayload)
  }

  return store.$actions.filter(payload)
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
})

watch(() => actionEventBus.value, async (event) => {
  let getPromise: ReturnType<typeof store.$actions.get>

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

    const newItem = Object.entries(store.item).reduce((a, [key, value]: [string, any]) => {
      const property = store.properties[key]||{}
      const unbound = (value: any) => {
        if( property.s$isFile ) {
          return {}
        }
        if( property.s$inline && value ) {
          const { _id, ...rest } = value
          return rest
        }
        return value
      }

      value = property.type === 'array'
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
  <w-filter-panel
    v-if="isFilterVisible"
    v-model="isFilterVisible"
    :key="store.$id"
  ></w-filter-panel>

  <w-insert-panel v-if="isInsertVisible">
    <template
      v-for="slotName in Object.keys($slots).filter(key => key.startsWith('field-'))"
      v-slot:[slotName]="slotProps"
    >
      <slot
        v-bind="slotProps"
        :name="slotName"
      ></slot>
    </template>
  </w-insert-panel>

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
      <w-input
        bordered
        v-model="store.textQuery"
        v-bind="{
          variant: 'bold',
          property: {
            type: 'text',
            s$placeholder: store.description.search.placeholder || 'Pesquise aqui',
            s$inputType: 'search'
          }
        }"
      ></w-input>
    </div>

    <div class="crud__actions">
      <w-context-menu v-if="
        actionButtons.length > 0
          || (!noLayoutToggle
            && store.description.layout
            && store.description.layout?.name !== 'tabular'
          )
      ">
        <w-button
          variant="transparent"
          icon="sliders-v"
        >
          <w-badge v-if="store.filtersCount">
            {{ store.filtersCount }}
          </w-badge>
        </w-button>

        <template
          #filter
          v-if="Object.keys(store.availableFilters).length > 0"
        >
          <w-icon
            v-clickable
            icon="filter"
            @click="isFilterVisible = true"
          >
            Filtros
          </w-icon>

          <div class="crud__context-badge">
            <w-badge v-if="store.filtersCount">
              {{ store.filtersCount }}
            </w-badge>
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
          <w-icon
            v-clickable
            icon="table"
            @click="toggleLayout(store)"
          >
            Alternar layout
          </w-icon>
        </template>

        <!-- <w-icon icon="setting"></w-icon> -->
        <template
          v-for="(actionProps, index) in actionButtons"
          v-slot:[`action-${index}`]
        >
          <w-icon
            :icon="actionProps.icon || 'setting'"
            :disabled="store.selected.length === 0 && actionProps.selection"

            @click="call(actionProps)({ _id: store.selected.map((_) => _._id) })"
            >
            {{ $t(actionProps.name) }}
          </w-icon>
        </template>

      </w-context-menu>

      <w-button
        v-else-if="Object.keys(store.availableFilters).length > 0"
        variant="transparent"
        icon="filter"
        @click="isFilterVisible = true"
      >
        <div>Filtros</div>
        <w-badge v-if="store.filtersCount">
          {{ store.filtersCount }}
        </w-badge>
      </w-button>

      <w-button
        v-for="(actionProps, index) in store.actions.filter((action: any) => action.button)"
        :key="`action-${index}`"

        :icon="actionProps.icon"
        :disabled="store.selected.length === 0 && actionProps.selection"

        @click="call(actionProps)({ _id: store.selected.map((_) => _._id) })"
      >
        {{ $t(actionProps.name) }}
      </w-button>

      <slot
        v-if="$slots.actions"
        name="actions"
      ></slot>
    </div>

  </div>

  <div v-loading="store.loading.getAll">
    <div v-if="
      store.itemsCount === 0
      && !store.loading.getAll
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
    <w-pagination :collection="collection"></w-pagination>
  </div>

</template>

<style scoped src="./w-crud.less"></style>
