<script setup lang="ts">
import { LayoutOptions } from '@sonata-api/types'
import { useParentStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'

import AeriaContextMenu from '../../../../aeria-context-menu/aeria-context-menu.vue'
import AeriaIcon from '../../../../aeria-icon/aeria-icon.vue'
import AeriaCard from '../../../../aeria-card/aeria-card.vue'
import AeriaGrid from '../../../../aeria-grid/aeria-grid.vue'
import AeriaBadge from '../../../../aeria-badge/aeria-badge.vue'
import AeriaPicture from '../../../../aeria-picture/aeria-picture.vue'

type Props = {
  individualActions: any
  hasSelectionActions: boolean
  layoutOptions: LayoutOptions
  componentName: string
}

const props = defineProps<Props>()
const layoutOptions = props.layoutOptions

const store = useParentStore()

const firstIfArray = (what: any) => {
  return Array.isArray(what)
    ? what[0]
    : what
}
</script>

<template>
  <aeria-grid :list="componentName === 'list'">
    <aeria-card
      v-for="item in store.items"
      :key="item"
      :inactive="!!(layoutOptions.active && !item[layoutOptions.active])"
      :horizontal="componentName === 'list'"
    >
      <aeria-picture
        expandable
        :url="firstIfArray(item[layoutOptions.picture!])?.link"
        :meta="firstIfArray(item[layoutOptions.picture!])"
      ></aeria-picture>

      <template #badge v-if="layoutOptions.badge && Array.isArray(item[layoutOptions.badge])">
        <aeria-badge
          v-for="badge in item[layoutOptions.badge]"
          :key="`${item._id}-${badge}`"
          large
        >
          {{
            layoutOptions.translateBadge
              ? t(badge)
              : badge
          }}
        </aeria-badge>
      </template>

      <template #badge v-else="layoutOptions.badge">
        <aeria-badge>
          {{
            layoutOptions.translateBadge
              ? t(item[layoutOptions.badge])
              : item[layoutOptions[badge]]
          }}
        </aeria-badge>
      </template>

      <template #footer>
        <div v-if="layoutOptions.title">
          {{ item[layoutOptions.title] }}
        </div>

        <div
          v-if="layoutOptions.information"
          class="card__information"
        >
          {{ item[layoutOptions.information] }}
        </div>
      </template>

      <template #actions>
        <aeria-context-menu
          v-if="individualActions.length > 0"
          v-bind="{
            subject: item,
            actions: individualActions
        }">
          <aeria-icon
            v-clickable
            reactive
            icon="ellipsis-v"
          ></aeria-icon>
        </aeria-context-menu>
      </template>
    </aeria-card>

  </aeria-grid>
</template>

<style scoped src="./aeria-grid.less"></style>
