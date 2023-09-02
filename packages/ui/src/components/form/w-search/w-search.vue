<script setup lang="ts">
import type { CollectionProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { onMounted, provide, computed, ref, watch } from 'vue'
import { useDebounce } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import WBox from '../../w-box/w-box.vue'
import WForm from '../w-form/w-form.vue'
import WSearchContainer from './_internals/components/w-search-container/w-search-container.vue'
import WSearchItem from './_internals/components/w-search-item/w-search-item.vue'

type Props = Omit<FormFieldProps<Record<string, any> | Array<Record<string, any>>>, 'property'> & {
  property: CollectionProperty & NonNullable<{
    s$isReference: CollectionProperty['s$isReference']
    s$referencedCollection: CollectionProperty['s$referencedCollection']
  }>
  searchOnly?: boolean
}

const props = defineProps<Props>()
const property = props.property

const DEFAULT_LIMIT = 10

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', event: any): void
}>()

provide('storeId', property.s$referencedCollection!)
provide('innerInputLabel', true)
provide('omitInputLabels', true)

const store = useStore(property.s$referencedCollection!)
const indexes = props.property.s$indexes

const selectPanel = ref(false)

const selected = ref(props.modelValue)

const searchResponse = ref({
  result: [] as Array<any>,
  pagination: {}
})

const matchingItems = computed(() => searchResponse.value.result || [])
const pagination = computed(() => searchResponse.value.pagination)

const isTyping = ref(false)
const inputValue = ref<Record<string, any>>({})

const search = async (options?: { empty?: true }) => {
  if( Object.values(inputValue.value).every((v) => !(String(v).length > 0)) ) {
    if( options?.empty ) {
      searchResponse.value = await store.$actions.custom(
        'getAll',
        { limit: DEFAULT_LIMIT },
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
      $or: indexes?.filter((i) => inputValue.value[i]?.length > 0).map((i) => ({
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
    searchResponse.value = await store.$actions.custom('getAll', {}, { fullResponse: true })
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

const save = () => {
  emit('update:modelValue', selected.value)
  selectPanel.value = false
}
</script>

<template>
  <teleport to="main">
    <w-box
      float
      close-hint
      :title="`Selecionar ${$t(props.propertyName!)}`"
      v-model="selectPanel"
      @overlay-click="selectPanel = false"
    >
      <w-form
        focus
        v-model="inputValue"
        v-bind="{
          collection: property.$ref,
          form: store.$actions.useProperties(indexes),
          layout: store.formLayout,
          searchOnly: true
        }"

        @input="lazySearch"
      ></w-form>

      <w-search-container v-if="matchingItems.length">
        <w-search-item
          v-model="selected"
          v-for="item in matchingItems"
          v-bind="{
            item,
            indexes,
            property,
          }"

          :key="`matching-${item._id}`"
        ></w-search-item>
      </w-search-container>

      <div v-else>
        <div v-if="isTyping">
          Pesquisando...
        </div>
        <div v-else-if="
          !store.loading.getAll
            && Object.values(inputValue).filter((v) => !!v).length > 0
            && !((property.type === 'array' && modelValue?.length) || modelValue?._id)
        ">
          Não há resultados
        </div>
      </div>

      <template #footer>
        <w-button @click="save">Salvar</w-button>
      </template>

    </w-box>
  </teleport>

  <div class="search">
    <w-search-container>
      <div v-if="property.type === 'array'">
        <w-search-item
          v-for="item in modelValue"
          v-bind="{
            item,
            indexes,
            property,
            modelValue
          }"

          :key="`selected-${item._id}`"
          @update:model-value="emit('update:modelValue', $event)"
        ></w-search-item>
      </div>

      <w-search-item
        v-else-if="modelValue?._id"
        v-bind="{
          item: modelValue,
          indexes,
          property,
          modelValue
        }"
        @update:model-value="emit('update:modelValue', $event)"
      ></w-search-item>

      <template #footer>
        <div
          v-clickable
          @click="openSelectPanel"
        >
          Selecionar
        </div>
      </template>
    </w-search-container>

  </div>
</template>

<style scoped src="./w-search.scss"></style>
