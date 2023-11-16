<script setup lang="ts">
import { LayoutOptions } from '@sonata-api/types'
import { useParentStore } from '@waltz-ui/state-management'

import WContextMenu from '../../../../w-context-menu/w-context-menu.vue'
import WIcon from '../../../../w-icon/w-icon.vue'
import WCard from '../../../../w-card/w-card.vue'
import WGrid from '../../../../w-grid/w-grid.vue'
import WBadge from '../../../../w-badge/w-badge.vue'
import WPicture from '../../../../w-picture/w-picture.vue'

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
  <w-grid :list="componentName === 'list'">
    <w-card
      v-for="item in store.items"
      :key="item"

      :inactive="
        layoutOptions.active
        && !item[layoutOptions.active]
      "

      :horizontal="componentName === 'list'"
    >
      <w-picture
        expandable
        :url="firstIfArray(item[layoutOptions.picture!])?.link"
        :meta="firstIfArray(item[layoutOptions.picture!])"
      ></w-picture>

      <template #badge v-if="layoutOptions.badge && Array.isArray(item[layoutOptions.badge])">
        <w-badge
          v-for="badge in item[layoutOptions.badge]"
          :key="`${item._id}-${badge}`"
          large
        >
          {{
            layoutOptions.translateBadge
              ? $t(badge)
              : badge
          }}
        </w-badge>
      </template>

      <template #badge v-else="layoutOptions.badge">
        <w-badge>
          {{
            layoutOptions.translateBadge
              ? $t(item[layoutOptions.badge])
              : item[layoutOptions[badge]]
          }}
        </w-badge>
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
        <w-context-menu
          v-if="individualActions.length > 0"
          v-bind="{
            subject: item,
            actions: individualActions
        }">
          <w-icon
            v-clickable
            reactive
            icon="ellipsis-v"
          ></w-icon>
        </w-context-menu>
      </template>
    </w-card>

  </w-grid>
</template>

<style scoped src="./w-grid.less"></style>
