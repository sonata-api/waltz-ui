<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PAGINATION_PER_PAGE_DEFAULTS } from '@waltz-ui/web'
import { useParentStore } from '@waltz-ui/state-management'

import WBareButton from '../w-bare-button/w-bare-button.vue'
import WIcon from '../w-icon/w-icon.vue'
import WInput from '../form/w-input/w-input.vue'
import WSelect from '../form/w-select/w-select.vue'

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
    <w-select
      v-model="limit"
      :property="{
        s$icon: 'list-ul'
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
    </w-select>

    <div class="pagination__control">
      <w-bare-button @click="page = 0; update()">
        <w-icon
          reactive
          icon="angle-double-left"
        ></w-icon>
      </w-bare-button>
      <w-bare-button
        :disabled="store.loading.getAll || page === 0"
        @click="paginate('previous')"
      >
        <w-icon
          reactive
          icon="angle-left"
        ></w-icon>
      </w-bare-button>
      <div class="pagination__page-input">
        <w-input
          bordered
          v-model="pageInput"
          :key="page"
          :property="{
            type: 'number',
            minimum: 1
          }"

          @change="page = pageInput === 0 ? 0 : pageInput - 1; update()"
        ></w-input>
        <span>{{ $t('of') }} {{ pageCount }}</span>
      </div>
      <w-bare-button
        :disabled="store.loading.getAll || page >= pageCount - 1"
        @click="paginate('next')"
      >
        <w-icon
          reactive
          icon="angle-right"
        ></w-icon>
      </w-bare-button>
      <w-bare-button @click="page = pageCount - 1; update()">
        <w-icon
          reactive
          icon="angle-double-right"
        ></w-icon>
      </w-bare-button>
    </div>
  </div>
</template>

<style scoped src="./w-pagination.scss"></style>
