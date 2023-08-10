<script setup lang="ts">
import type { CollectionProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import {
  onMounted,
  provide,
  inject,
  computed,
  ref,
  reactive,
  nextTick

} from 'vue'

import { useStore, useDebounce } from '@waltz-ui/web'
import WIcon from '../../w-icon/w-icon.vue'
import WForm from '../w-form/w-form.vue'

import WSearchSelected from './_internals/components/w-search-selected/w-search-selected.vue'
import WSearchItem from './_internals/components/w-search-item/w-search-item.vue'

type Props = Omit<FormFieldProps<any>, 'property'> & {
  property: CollectionProperty & NonNullable<{
    s$isReference: CollectionProperty['s$isReference']
    s$referencedCollection: CollectionProperty['s$referencedCollection']
  }>
  searchOnly?: boolean
}

const props = defineProps<Props>()
const property = props.property

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', event: any): void
}>()

provide('storeId', property.s$referencedCollection!)
provide('innerInputLabel', true)
provide('omitInputLabels', true)

const searchOnly = !property.s$inlineEditing || inject<boolean|null>('searchOnly', null)
const omitFormHeader = inject('omitFormHeader', false)

const store = useStore(property.s$referencedCollection!)
const indexes = props.property.s$indexes

const expanded = ref(false)
const selectClick = ref(false)

const searchResponse = ref<any>({
  result: []
})

const matchingItems = computed<Array<Record<string, any> & { _id: string }>>(() => searchResponse.value.result || [])
const pagination = computed(() => searchResponse.value.pagination)

const isExpanded = computed(() => expanded.value || property.s$inline)

const isTyping = ref(false)
const focus = ref<'in'|'out'|null>(null)
const inputValue = ref<Record<string, any>>({})

const select = (item: any, itemIndex: number) => {
  const filterEmpties = (array: Array<any>) => array.filter(e => typeof e !== 'object' || Object.keys(e||{}).length > 0)
  const modelValue = property.type === 'array'
    ? filterEmpties(Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue])
    : props.modelValue

  if( property.uniqueItems || (property.type === 'array' && searchOnly) ) {
    matchingItems.value.splice(itemIndex, 1)
  }

  emit('update:modelValue', property.type === 'array'
    ? [ ...modelValue, item ]
    : item
  )

  emit('change', item)
  selectClick.value = false

  // necessary: we want to trigger a rerender everytime
  nextTick(() => {
    selectClick.value = true
  })
}

const pushBack = (item: any) => {
  searchResponse.value.result.push(item)
}

const search = async (empty?: boolean) => {
  if( Object.values(inputValue.value).every((v) => !(String(v).length > 0)) ) {
    if( empty && matchingItems.value.length === 0 ) {
      searchResponse.value = await store.custom('getAll', { limit: 100 }, { fullResponse: true })
    }

    return
  }

  if( store.loading.getAll ) {
    return
  }

  searchResponse.value = await store.custom('getAll', {
    limit: 100,
    filters: {
      $or: indexes?.filter((i: string) => inputValue.value[i]?.length > 0)
      .map((i: string) => ({
        [i]: {
          $regex: inputValue.value[i].trim(),
          $options: 'i'
        }
      }))
    }
  }, { fullResponse: true })
}

onMounted(async () => {
  if( property.s$prefetch ) {
    searchResponse.value = await store.custom('getAll', {}, { fullResponse: true })
  }
})

const [doLazySearch] = useDebounce({ delay: 800 })(() => {
  search()
  isTyping.value = false
})

const lazySearch = () => {
  isTyping.value = true
  doLazySearch()
}

let cancelClearResponse: () => void
const clearResponse = () => {
  selectClick.value = false
  searchResponse.value = {
    result: []
  }
}

const handleFocusin = () => {
  cancelClearResponse()
  search(true)
  focus.value = 'in'
}

const handleFocusout = () => {
  lazyClearResponse()
  focus.value = 'out'
}

const [lazyClearResponse, cancel_] = useDebounce({ delay: 200 })(clearResponse)
cancelClearResponse = cancel_
</script>

<template>
  <div class="search">
    <w-form
      v-if="isExpanded"
      v-bind="{
        collection: property.$ref,
        modelValue,
        form: property.s$form
          ? store.useProperties(property.s$form)
          : store.properties,
        layout: store.formLayout
      }"

      @update:model-value="emit('update:modelValue', $event)"
    ></w-form>

    <w-form
      v-else
      v-model="inputValue"
      v-bind="{
        collection: property.$ref,
        form: store.useProperties(indexes),
        layout: store.formLayout,
        searchOnly: true,
        focus: selectClick
      }"

      @focusin="handleFocusin"
      @focusout="handleFocusout"
      @input="lazySearch"
    ></w-form>

    <div
      v-if="!isExpanded"
      class="
        search__container
        search__container--selected
      "
    >
      <w-search-selected
        v-bind="{
          searchOnly,
          indexes,
          property,
          modelValue
        }"

        @update:model-value="emit('update:modelValue', $event)"
        @push-back="pushBack"
      ></w-search-selected>
    </div>

    <div v-if="!isExpanded">
      <div
        v-if="matchingItems.length"
        class="
          search__container
          search__container--results
        "
      >
        <w-search-item
          v-for="(item, index) in matchingItems"
          v-bind="{
            item,
            indexes
          }"

          :key="`matching-${item._id}`"
          @click="select(item, +index)"
        >
          <w-icon name="plus"></w-icon>
        </w-search-item>

        <div v-if="pagination.recordsTotal > pagination.recordsCount">
          +{{ pagination.recordsTotal - pagination.recordsCount }} resultados
        </div>
      </div>

      <div v-else>
        <div v-if="isTyping">
          Pesquisando...
        </div>
        <div v-else-if="
          !store.loading.getAll
            && focus === 'in'
            && Object.values(inputValue).filter((v) => !!v).length > 0
            && !((property.type === 'array' && modelValue?.length) || modelValue?._id)
        ">
          Não há resultados
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./w-search.scss"></style>
