<script setup lang="ts">
import type { CollectionProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { provide, computed, ref, watch, onMounted } from 'vue'
import { useDebounce } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import WBox from '../../w-box/w-box.vue'
import WButton from '../../w-button/w-button.vue'
import WIcon from '../../w-icon/w-icon.vue'
import WSelect from '../w-select/w-select.vue'
import WInput from '../w-input/w-input.vue'
import WSearchContainer from './_internals/components/w-search-container/w-search-container.vue'
import WSearchItem from './_internals/components/w-search-item/w-search-item.vue'

type Props = Omit<FormFieldProps<Record<string, any> | Array<Record<string, any>>>, 'property'> & {
  property: CollectionProperty & NonNullable<Pick<CollectionProperty,
    | 's$isReference'
    | 's$referencedCollection'
  >>
  selectOnly?: boolean
}

const props = defineProps<Props>()
const property = props.property

const DEFAULT_LIMIT = 10

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', event: any): void
  (e: 'panelClose'): void
}>()

provide('storeId', property.s$referencedCollection!)
provide('innerInputLabel', true)
provide('omitInputLabels', true)

const store = useStore(property.s$referencedCollection!)
const indexes = props.property.s$indexes!

const selectPanel = ref(!!props.selectOnly)

const selected = ref(props.modelValue)

const searchResponse = ref({
  data: [] as Array<any>,
  pagination: {}
})

const matchingItems = computed(() => searchResponse.value.data || [])
const pagination = computed(() => searchResponse.value.pagination)

const searchField = ref(indexes[0])
const isTyping = ref(false)
const inputValue = ref<Record<NonNullable<typeof indexes>[number], any>>({})

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
    <w-box
      float
      close-hint
      :title="`Selecionar ${$t(props.propertyName)}`"
      v-model="selectPanel"
      @close="emit('panelClose')"
      @overlay-click="selectPanel = false; emit('panelClose')"
    >
      <div class="search">
        <div class="search__input">
          <w-select
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
          </w-select>

          <div style="flex: 1">
            <w-input
              v-model="inputValue[searchField]"
              :property="{
                ...store.properties[searchField],
                s$inputType: 'search'
              }"

              :key="searchField"
              @input="lazySearch"
            ></w-input>
          </div>
        </div>

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
              && !((property.type === 'array' && modelValue?.length) || (!Array.isArray(modelValue) && modelValue?._id))
          ">
            Não há resultados
          </div>
        </div>
      </div>

      <template #footer>
        <w-button
          large
          @click="save"
        >
          Salvar
        </w-button>
      </template>

    </w-box>
  </teleport>

  <div
    v-if="!selectOnly"
    class="search"
  >
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
        <w-icon
          v-clickable
          small
          icon="plus"
          @click="openSelectPanel"
        >
          Selecionar
        </w-icon>
      </template>
    </w-search-container>

  </div>
</template>

<style scoped src="./w-search.less"></style>
