<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PAGINATION_PER_PAGE_DEFAULTS } from '@waltz-ui/web'
import { useParentStore } from '@waltz-ui/state-management'

import AeriaBareButton from '../aeria-bare-button/aeria-bare-button.vue'
import AeriaIcon from '../aeria-icon/aeria-icon.vue'
import AeriaInput from '../form/aeria-input/aeria-input.vue'
import AeriaSelect from '../form/aeria-select/aeria-select.vue'

type Props = {
  collection: string
}

const props = defineProps<Props>()
const store = useParentStore(props.collection)

const page = computed<number>({
  get: () => Math.floor(store.pagination.offset / store.pagination.limit),
  set: (page: number) => {
    store.pagination.offset = page * store.pagination.limit
  }
})

const limit = computed<number>({
  get: () => store.pagination.limit,
  set: (value) => {
    store.pagination.limit = Number(value)
  }
})

const pageInput = ref(page.value ? page.value + 1 : 1)
const pageCount = computed(
  () => Math.ceil(store.pagination.recordsTotal / store.pagination.limit)
)

const paginate = (direction: 'previous'|'next') => {
  window.scrollTo(0, 0)
  page.value = direction === 'previous'
    ? page.value - 1
    : page.value + 1

  update()
}

const update = () => {
  return store.$actions.filter({
    project: [
      ...Object.keys(store.properties),
      ...store.description.tableMeta||[]
    ]
  })
}

watch([page, limit], ([newPage]: [number, number]) => {
  pageInput.value = newPage + 1
})
</script>

<template>
  <div class="pagination">
    <aeria-select
      v-model="limit"
      :property="{
        icon: 'list-ul'
      }"
      class="pagination__control"
      @change="update"
    >
      <option
        v-for="limit in PAGINATION_PER_PAGE_DEFAULTS"
        :key="`limit-${limit}`"
        :value="limit"
      >
        {{ limit }}
      </option>
    </aeria-select>

    <div class="pagination__control">
      <aeria-bare-button @click="page = 0; update()">
        <aeria-icon
          reactive
          icon="angle-double-left"
        ></aeria-icon>
      </aeria-bare-button>
      <aeria-bare-button
        :disabled="store.loading.getAll || page === 0"
        @click="paginate('previous')"
      >
        <aeria-icon
          reactive
          icon="angle-left"
        ></aeria-icon>
      </aeria-bare-button>
      <div class="pagination__page-input">
        <aeria-input
          v-model="pageInput"
          :key="page"
          :property="{
            type: 'number',
            minimum: 1
          }"

          @change="page = pageInput === 0 ? 0 : pageInput - 1; update()"
        ></aeria-input>
        <span>{{ $t('of') }} {{ pageCount }}</span>
      </div>
      <aeria-bare-button
        :disabled="store.loading.getAll || page >= pageCount - 1"
        @click="paginate('next')"
      >
        <aeria-icon
          reactive
          icon="angle-right"
        ></aeria-icon>
      </aeria-bare-button>
      <aeria-bare-button @click="page = pageCount - 1; update()">
        <aeria-icon
          reactive
          icon="angle-double-right"
        ></aeria-icon>
      </aeria-bare-button>
    </div>
  </div>
</template>

<style scoped src="./aeria-pagination.less"></style>
