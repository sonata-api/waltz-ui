<script setup lang="ts">
import {
  onUnmounted,
  ref,
  computed,
  provide,
  inject,
  watch,
  isRef,
  type Ref

} from 'vue'

import type { Layout } from '@sonata-api/types'
import { deepClone } from '@sonata-api/common'
import { useRouter, useAction, useDebounce } from '@waltz-ui/web'
import { useStore, useParentStore } from '@waltz-ui/state-management'

import WPagination from '../w-pagination/w-pagination.vue'
import WBareButton from '../w-bare-button/w-bare-button.vue'
import WButton from '../w-button/w-button.vue'
import WInfo from '../w-info/w-info.vue'
import WIcon from '../w-icon/w-icon.vue'
import WInput from '../form/w-input/w-input.vue'

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
  noRefresh?: boolean
  noLayoutToggle?: boolean
  parentCollection?: string
  parentField?: string
  layout?: Layout
  action?: Ref<ReturnType<typeof useAction>> | ReturnType<typeof useAction>
  componentProps?: Record<string, any>
}

type Emits = {
  (e: 'uiEvent', event: any): void
}

const props = withDefaults(defineProps<Props>(), {
  noRefresh: true
})

const emit = defineEmits<Emits>()
const router = await useRouter()

const debounce = useDebounce({
  delay: 600
})

const queryString = ref('')

const metaStore = useStore('meta')

const store = useStore(props.collection)
const parentStore = props.parentField
  ? useParentStore(props.parentCollection)
  : null

const action = props.action
  ? isRef(props.action)
    ? props.action.value
    : props.action
  : useAction(store, router)

call.value = action[0]
actionEventBus.value = action[1]

const fetchItems = async () => {
  return store.$actions.filter({
    project: [
      ...(store.description.table || Object.keys(store.properties)),
      ...store.description.tableMeta||[]
    ]
  })
}

const emptyComponent = inject('emptyComponent')

watch(router.currentRoute, async () => {
  metaStore.view.title = props.collection
  metaStore.view.collection = props.collection
  isInsertReadonly.value = false

  if( !props.noFetch /*&& (props.parentField || store.itemsCount === 0)*/ ) {
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

  return fetchItems()
})

watch(queryString, (value) => {
  performLazySearch(value)
})

const toggleLayout = (store: any) => {
  store.currentLayout = store.currentLayout === 'tabular'
    ? store.description.layout!.name
    : 'tabular'
}

onUnmounted(() => {
  const getFilters = () => store.filters
  const oldFilters = getFilters()
  store.$actions.clearFilters()
  store.filtersPreset = {}
  store.preferredTableProperties = []

  if( Object.keys(oldFilters).length > 0 ) {
    const filters = getFilters()
    const changed = Object.entries(oldFilters)
      .some(([key, value]: [string, any]) => filters[key] !== value)

    if( changed ) {
      store.$actions.clearItems()
    }
  }
})

watch(() => actionEventBus.value, async (event) => {
  if (
    [
      'spawnEdit',
      'spawnView',
      'duplicate',
    ].includes(event.name)
  ) {
    await store.$actions.get({
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
    isInsertVisible.value = 'edit'
  }

  else if( event.name === 'spawnView' ) {
    isInsertReadonly.value = true
    isInsertVisible.value = 'view'
  }

  else if( event.name === 'duplicate' ) {
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
    }, {})

    store.$actions.setItem({
      ...newItem,
      _id: undefined,
      id: undefined
    })

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


provide('storeId', computed(() => props.collection))
provide('individualActions', individualActions)
provide('parentStore', parentStore)
</script>

<template>
  <w-filter-panel
    v-if="isFilterVisible"
    v-model="isFilterVisible"
    :key="store.$id"
  ></w-filter-panel>

  <w-insert-panel
    v-if="isInsertVisible"
    v-bind="{
      parentCollection,
      parentField
    }"
  >
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


  <div class="crud__main">
    <div
      v-if="!noActions && (
        store.description.search?.active
        || !noRefresh
        || (store && Object.keys(store.availableFilters).length > 0)
        || (store?.actions.length > 0 || $slots.actions)
        || (
          !noLayoutToggle && store
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
          v-model="queryString"
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

      <div class="crud__controls-icons">
        <w-info v-if="!noRefresh" where="bottom">
          <template #text>
            Atualizar
          </template>
          <w-icon
            v-clickable
            reactive
            icon="refresh"
            @click="fetchItems"
          ></w-icon>
        </w-info>

        <w-icon
          v-if="store && Object.keys(store.availableFilters).length > 0"
          v-clickable
          reactive
          icon="filter"
          @click="isFilterVisible = true"
        >
          Filtros
        </w-icon>

        <w-info
          v-if="store && Object.keys(store.availableFilters).length > 0"
          where="bottom"
        >
          <template #text>
            Limpar filtros
          </template>
          <w-bare-button :disabled="store.filtersCount === 0">
            <w-icon
              v-if="store && Object.keys(store.availableFilters).length > 0"
              reactive
              icon="trash"
              @click="() => (store.$actions.clearFilters() && store.$actions.filter(undefined))"
            ></w-icon>
          </w-bare-button>
        </w-info>
        <w-info
          v-if="
            !noLayoutToggle && store
              && store.description.layout
              && store.description.layout?.name !== 'tabular'
          "
          where="bottom"
        >
          <template #text>
            Alternar layout
          </template>
          <w-icon
            v-clickable
            reactive
            icon="table"
            @click="toggleLayout(store)"
          ></w-icon>
        </w-info>

        <div
          v-if="store?.actions.length > 0 || $slots.actions"
          :key="collection"
          class="crud__actions"
        >
          <w-button
            v-for="(actionProps, index) in store.actions"
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
          layoutOptions: layout?.options || store?.layout.options,
          componentProps
        }"
        :is="getLayout(layout?.name || store.$currentLayout)"
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
      v-if="!noControls && !store.loading.getAll && store.itemsCount > 0"
      class="crud__controls"
    >
      <w-pagination :collection="collection"></w-pagination>
    </div>
  </div>

</template>

<style scoped src="./w-crud.scss"></style>
