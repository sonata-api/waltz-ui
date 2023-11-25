<script setup lang="ts">
import type { Property, CollectionAction, TableLayout } from '@sonata-api/types'
import { inject, computed, type Ref } from 'vue'
import { evaluateCondition } from '@sonata-api/common'
import { useBreakpoints } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import AeriaBareButton from '../aeria-bare-button/aeria-bare-button.vue'
import AeriaButton from '../aeria-button/aeria-button.vue'
import AeriaIcon from '../aeria-icon/aeria-icon.vue'
import AeriaPicture from '../aeria-picture/aeria-picture.vue'
import AeriaContextMenu from '../aeria-context-menu/aeria-context-menu.vue'

type Props = {
  columns?: Record<string, Property>
  rows?: any
  collection?: string | Ref<string>
  checkbox?: boolean
  actions?: (CollectionAction<any> & {
    action: string
    click: (...args: any[]) => void
  })[]
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
  set: (items: any[]) => store?.$actions.selectManyItems(items, true)
})

const isActionButton = (layout: TableLayout<any>['actions'][string], subject: any) => {
  if( !layout?.button ) {
    return false
  }

  if( typeof layout.button === 'object' ) {
    const result = evaluateCondition(subject, layout.button)
    return result.satisfied
  }

  return layout.button
}

const buttonActions = (subject: any) => {
  if( !breakpoints.value.xl || !props.layout?.actions || !props.actions ) {
    return []
  }

  return props.actions.filter((action) => {
    const layout = props.layout.actions[action.action]
    return isActionButton(layout, subject)
  })
}

const dropdownActions = (subject: any) => {
  if( !props.actions ) {
    return []
  }

  if( !breakpoints.value.xl || !props.layout?.actions ) {
    return props.actions
  }

  return props.actions.filter((action) => {
    const layout = props.layout.actions[action.action]
    return !isActionButton(layout, subject)
  })
}

const buttonStyle = (subject: any, action: any) => {
  const style = []
  const layout = props.layout?.actions?.[action.action]

  if( layout?.if ) {
    const result = evaluateCondition(
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
    class="
      table
      aeria-surface
    "
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
                <aeria-icon
                  v-if="row[column]"
                  icon="check"
                  icon-classes="aeria-blueish"
                >
                  {{ $t('yes') }}
                </aeria-icon>
                <aeria-icon
                  v-else
                  icon="times"
                  icon-classes="aeria-redish"
                >
                  {{ $t('no') }}
                </aeria-icon>
              </div>

              <div v-else>
                <div v-if="property.isFile && row[column]">
                  <aeria-picture
                    expandable
                    v-if="/^image/.test(row[column].mime)" 
                    v-model="row[column].link"
                    :meta="row[column]"
                    class="table__picture"
                  ></aeria-picture>
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
                property.indexes?.length! > 1
                  && property.referencedCollection !== 'file'
              ">
                <div
                  v-for="(subvalue, index) in property.indexes!.slice(1, 2)"
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
            <aeria-button
              v-for="action in buttonActions(row)"
              :key="`action-${action.action}`"

              small
              variant="transparent"
              :icon="action.icon"

              :style="buttonStyle(row, action)"
              @click="action.click(row)"
            >
              {{ $t(action.name) }}
            </aeria-button>

            <aeria-context-menu
              v-if="dropdownActions(row).length > 0"
              v-bind="{
                subject: row,
                actions: dropdownActions(row)
            }">
              <aeria-icon
                v-clickable
                reactive
                icon="ellipsis-h"
              ></aeria-icon>
            </aeria-context-menu>

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
            :style="`grid-template-columns: repeat(${buttonActions(row).length + (dropdownActions(row).length ? 1 : 0)}, 1fr);`"
          >
            <aeria-bare-button
              v-for="action in buttonActions(row)"
              :key="`action-${action.action}`"

              class="table__mobile-actions-button"
              @click="action.click(row)"
            >
              <aeria-icon :icon="action.icon || 'setting'">
                {{ $t(action.name) }}
              </aeria-icon>
            </aeria-bare-button>

            <aeria-context-menu
              v-if="dropdownActions(row).length > 0"
              v-bind="{
                subject: row,
                actions: dropdownActions(row)
            }">
              <aeria-icon
                icon="ellipsis-h"
                class="table__mobile-actions-button"
              ></aeria-icon>
            </aeria-context-menu>

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
        <td :colspan="Object.keys(columns).length + (actions?.length ? 1 : 0)">
          <div class="table__empty">
            Não foram encontrados resultados.
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<style scoped src="./aeria-table.less"></style>
