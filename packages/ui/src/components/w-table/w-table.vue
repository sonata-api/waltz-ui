<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import { useCondition, useBreakpoints } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'
import type { CollectionProperty, CollectionAction } from '@sonata-api/types'

import WBareButton from '../w-bare-button/w-bare-button.vue'
import WButton from '../w-button/w-button.vue'
import WIcon from '../w-icon/w-icon.vue'
import WPicture from '../w-picture/w-picture.vue'
import WContextMenu from '../w-context-menu/w-context-menu.vue'

type Props = {
  columns?: Record<string, CollectionProperty>
  rows?: any
  collection?: string | Ref<string>
  checkbox?: boolean
  actions?: Array<CollectionAction<any> & {
    action: string
    click: (...args: any[]) => void
  }>
  layout?: any
}

const props = defineProps<Props>()
const breakpoints = useBreakpoints()

const collectionName = props.collection || inject<Ref<string>|string>('storeId', '')
const store = collectionName
  ? useStore(typeof collectionName === 'string' ? collectionName : collectionName.value)
  : null

const selected = computed({
  get: () => store?.selected,
  set: (items: Array<any>) => store?.$actions.selectManyItems(items, true)
})

const buttonActions = computed(() => (
  props.actions?.filter((action) => props.layout?.actions?.[action.action]?.button) || []
))

const dropdownActions = computed(() => (
  props.actions?.filter((action) => !props.layout?.actions?.[action.action]?.button) || []
))

const buttonStyle = (subject: any, action: any) => {
  const style = []
  const layout = props.layout?.actions?.[action.action]

  if( layout?.if ) {
    const result = useCondition(
      subject,
      layout.if
    )

    if( !result.satisfied ) {
      style.push(`display: none;`)
    }
  }

  return style.join('')
}
</script>

<template>
  <table
    v-if="(columns && Object.keys(columns).length > 0) || $slots.thead"
    class="table"
  >
    <thead v-if=$slots.thead>
      <slot name="thead"></slot>
    </thead>

    <thead v-else>
      <tr>
        <th v-if="checkbox && store && breakpoints.md">
          <input
            type="checkbox"
            :checked="store.selected.length > 0 && store.selected.length === store.itemsCount"
            @change="store.$actions.selectAllItems($event.target.checked)"
          />
        </th>
        <th
          v-for="([propertyName, property], index) in Object.entries(columns)"
          :key="`header-${index}`"
          class="table__header"
        >
          {{ property.description || $t(propertyName) }}
        </th>
        <th
          v-if="actions?.length"
          style="text-align: right;"
         ></th>
      </tr>
    </thead>

    <tbody v-if="$slots.tbody">
      <slot name="tbody"></slot>
    </tbody>

    <tbody v-else>
      <tr
        v-for="row in rows"
        :key="row._id"
        @click="$emit('itemClick', row)"
      >
        <td v-if="store && checkbox && breakpoints.md">
          <input
            type="checkbox"
            v-model="selected"
            :value="row._id"
          />
        </td>
        <td
          v-for="([column, property], cindex) in Object.entries(columns)"
          :key="`column-${row._id}-${cindex}`"
        >
          <div class="table__cell-mobile-label">
            {{ property.description || $t(column) }}
          </div>

          <div
            v-if="`row-${column}` in $slots"
            class="table__cell-container"
          >
            <slot
              v-bind="{
                store,
                column,
                property,
                row
              }"

              :name="`row-${column}`"
            >
            </slot>
          </div>
          <div
            v-else
            class="table__cell-container"
          >
            <div class="table__cell-grid">
              <div v-if="property.type === 'boolean'">
                <w-icon
                  v-if="row[column]"
                  small
                  icon="check"
                  fill="green"
                >
                  {{ $t('yes') }}
                </w-icon>
                <w-icon
                  v-else
                  small
                  icon="times"
                  fill="red"
                >
                  {{ $t('no') }}
                </w-icon>
              </div>

              <div v-else>
                <div v-if="property.$ref === 'file' && row[column]">
                  <w-picture
                    expandable
                    v-if="/^image/.test(row[column].mime)" 
                    v-model="row[column].link"
                    :meta="row[column]"
                    class="table__picture"
                  ></w-picture>
                  <a
                    v-else-if="row[column].link"
                    :href="row[column].link"
                    style="font-size: 10pt"
                  >
                    {{ row[column].filename }}
                  </a>
                  <div v-else>
                    -
                  </div>
                </div>
                <span v-else-if="store">
                  {{
                    store.$actions.formatValue({
                      value: row[column],
                      key: column,
                      property
                    })
                  }}
                </span>
                <span v-else>
                  {{
                    Array.isArray(row[column])
                      ? row[column].filter(_ => !!_).join(', ')
                      : ![undefined, null].includes(row[column])
                        ? row[column]
                        : '-'
                  }}
                </span>
              </div>
              <div v-if="
                property.s$indexes?.length! > 1
                  && property.s$referencedCollection !== 'file'
              ">
                <div
                  v-for="(subvalue, index) in property.s$indexes!.slice(1, 2)"
                  :key="`subvalue-${index}`"
                >
                  {{
                    store!.$actions.formatValue({
                      value: row[column],
                      key: column,
                      property,
                      index: subvalue
                    })
                  }}
                </div>
              </div>
            </div>
          </div>

        </td>
        <td
          v-if="actions?.length && breakpoints.md"
          class="no-print"
        >
          <div class="table__cell-actions">
            <w-button
              small
              v-for="action in buttonActions"
              :key="`action-${action.action}`"
              variant="transparent"
              :icon="action.icon"

              :style="buttonStyle(row, action)"
              @click="action.click(row)"
            >
              {{ $t(action.name) }}
            </w-button>

            <w-context-menu
              v-if="dropdownActions.length > 0"
              v-bind="{
                subject: row,
                actions: dropdownActions
            }">
              <w-icon
                v-clickable
                reactive
                icon="ellipsis-h"
              ></w-icon>
            </w-context-menu>

          </div>
        </td>

        <td
          v-else="actions?.length"
          class="
            no-print
            table__mobile-actions
          "
        >
          <div
            class="table__mobile-actions-grid"
            :style="`grid-template-columns: repeat(${buttonActions.length + (dropdownActions.length ? 1 : 0)}, 1fr);`"
          >
            <w-bare-button
              v-for="action in buttonActions"
              :key="`action-${action.action}`"

              class="table__mobile-actions-button"
              @click="action.click(row)"
            >
              <w-icon
                small
                :icon="action.icon || 'setting'"
              >
                {{ $t(action.name) }}
              </w-icon>
            </w-bare-button>

            <w-context-menu
              v-if="dropdownActions.length > 0"
              v-bind="{
                subject: row,
                actions: dropdownActions
            }">
              <w-icon
                icon="ellipsis-h"
                class="table__mobile-actions-button"
              ></w-icon>
            </w-context-menu>

          </div>
        </td>


        <div :id="`dropdown-${row._id}`"></div>
      </tr>
    </tbody>
    <tfoot>
      <slot
        name="tfoot"
        v-if="$slots.tfoot"
      ></slot>

      <tr v-else-if="columns && !rows?.length && !store?.loading.getAll">
        <td :colspan="Object.keys(columns).length">
          <div class="table__empty">
            Não foram encontrados resultados.
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<style scoped src="./w-table.scss"></style>
