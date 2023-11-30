<script setup lang="ts">
import type { FormFieldProps, SearchProperty } from '../types'
import { getReferenceProperty, convertConditionToQuery } from '@sonata-api/common'
import { provide, inject, computed, ref, watch, onMounted } from 'vue'
import { useDebounce } from '@waltz-ui/web'
import { useStore, useParentStore } from '@waltz-ui/state-management'

import AeriaPanel from '../../aeria-panel/aeria-panel.vue'
import AeriaButton from '../../aeria-button/aeria-button.vue'
import AeriaIcon from '../../aeria-icon/aeria-icon.vue'
import AeriaSelect from '../aeria-select/aeria-select.vue'
import AeriaInput from '../aeria-input/aeria-input.vue'
import AeriaSearchContainer from './_internals/components/aeria-search-container/aeria-search-container.vue'
import AeriaSearchItem from './_internals/components/aeria-search-item/aeria-search-item.vue'

type Props = Omit<FormFieldProps<any>, 'property' | 'propertyName'> & {
  property: SearchProperty
  propertyName: string
  selectOnly?: boolean
}

const props = defineProps<Props>()
const refProperty = getReferenceProperty(props.property)!

const DEFAULT_LIMIT = 10

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', event: any): void
  (e: 'panelClose'): void
}>()

const store = useStore(props.property.referencedCollection!)
const parentStore = useParentStore()
const indexes = refProperty.indexes!

const parentStoreId = inject<string>('storeId')!
provide('storeId', props.property.referencedCollection!)
provide('innerInputLabel', true)
provide('omitInputLabels', true)


const selectPanel = ref(!!props.selectOnly)
const selected = ref(props.modelValue)

const searchResponse = ref({
  data: [] as any[],
  pagination: {}
})

const matchingItems = computed(() => searchResponse.value.data || [])
const pagination = computed(() => searchResponse.value.pagination)

const searchField = ref(indexes[0])
const isTyping = ref(false)
const inputValue = ref<Record<NonNullable<typeof indexes>[number], any>>({})

const defaultFilters = () => refProperty.constraints
  ? convertConditionToQuery(refProperty.constraints, {
    [parentStoreId]: parentStore
  })
  : {}

const search = async (options?: { empty?: true }) => {
  if( Object.values(inputValue.value).every((v) => !(String(v).length > 0)) ) {
    if( options?.empty ) {
      searchResponse.value = await store.$actions.custom(
        'getAll',
        { limit: DEFAULT_LIMIT, filters: defaultFilters() },
        { fullResponse: true }
      )
    }

    return
  }

  if( store.loading.getAll ) {
    return
  }

  searchResponse.value = await store.$actions.custom('getAll', {
    limit: DEFAULT_LIMIT,
    filters: {
      ...defaultFilters(),
      $or: indexes?.filter((i) => inputValue.value[i]?.length > 0).map((i) => ({
        [i]: {
          $regex: inputValue.value[i].trim()
            .replace('(', '\\(')
            .replace(')', '\\)'),
          $options: 'i'
        }
      }))
    }
  }, { fullResponse: true })
}

const [doLazySearch] = useDebounce({ delay: 800 })(() => {
  search()
  isTyping.value = false
})

const lazySearch = () => {
  isTyping.value = true
  doLazySearch()
}

const openSelectPanel = () => {
  selectPanel.value = true
  search({ empty: true })
}

const isInputEmpty = computed(() => !Object.values(inputValue.value).some((value) => !!value))

watch(isInputEmpty, (val, oldVal) => {
  if( val && !oldVal ) {
    search({ empty: true })
  }
})

onMounted(() => {
  if( props.selectOnly ) {
    search({ empty: true })
  }
})

const save = () => {
  emit('update:modelValue', selected.value)
  selectPanel.value = false
}
</script>

<template>
  <teleport to="main">
    <aeria-panel
      float
      close-hint
      :title="`Selecionar ${$t(propertyName)}`"
      v-model="selectPanel"
      @close="emit('panelClose')"
      @overlay-click="selectPanel = false; emit('panelClose')"
    >
      <div class="search__panel">
        <div class="search__input">
          <aeria-select
            v-if="indexes.length > 1"
            v-model="searchField"
            @change="inputValue = {}"
          >
            <option
              v-for="field in indexes"
              :key="`searchfield-${field}`"
              :value="field"
            >
              {{ $t(field) }}
            </option>
          </aeria-select>

          <div style="flex: 1">
            <aeria-input
              v-model="inputValue[searchField]"
              :property="{
                ...store.properties[searchField],
                inputType: 'search'
              }"

              :key="searchField"
              @input="lazySearch"
            ></aeria-input>
          </div>
        </div>

        <aeria-search-container v-if="matchingItems.length">
          <aeria-search-item
            v-model="selected"
            v-for="item in matchingItems"
            v-bind="{
              item,
              indexes,
              property,
            }"

            :key="`matching-${item._id}`"
          ></aeria-search-item>
        </aeria-search-container>

        <div v-else>
          <div v-if="isTyping">
            Pesquisando...
          </div>
          <div v-else-if="
            !store.loading.getAll
              && Object.values(inputValue).filter((v) => !!v).length > 0
              && !(('items' in property && modelValue?.length) || (!Array.isArray(modelValue) && modelValue?._id))
          ">
            Não há resultados
          </div>
        </div>
      </div>

      <template #footer>
        <aeria-button
          large
          @click="save"
        >
          Salvar
        </aeria-button>
      </template>

    </aeria-panel>
  </teleport>

  <div
    v-if="!selectOnly"
    class="search"
  >
    <aeria-search-container>
      <div v-if="'items' in property">
        <aeria-search-item
          v-for="item in modelValue"
          v-bind="{
            item,
            indexes,
            property,
            modelValue
          }"

          :key="`selected-${item._id}`"
          @update:model-value="emit('update:modelValue', $event)"
        ></aeria-search-item>
      </div>

      <aeria-search-item
        v-else-if="modelValue?._id"
        v-bind="{
          item: modelValue,
          indexes,
          property: refProperty,
          modelValue
        }"
        @update:model-value="emit('update:modelValue', $event)"
      ></aeria-search-item>

      <template #footer>
        <aeria-icon
          v-clickable
          icon="plus"
          @click="openSelectPanel"
        >
          Selecionar
        </aeria-icon>
      </template>
    </aeria-search-container>

  </div>
</template>

<style scoped src="./aeria-search.less"></style>
