<script setup lang="ts">
import { LayoutOptions } from '@sonata-api/types'
import { useParentStore } from '@waltz-ui/web'

import WContextMenu from '../../../../w-context-menu/w-context-menu.vue'
import WIcon from '../../../../w-icon/w-icon.vue'
import WCard from '../../../../w-card/w-card.vue'
import WGrid from '../../../../w-grid/w-grid.vue'
import WPicture from '../../../../w-picture/w-picture.vue'

type Props = {
  individualActions: any
  hasSelectionActions: boolean
  layoutOptions: LayoutOptions
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
  <w-grid>
    <w-card
      v-for="item in store.items"
      :key="item"
    >
      <w-picture
        expandable
        :url="firstIfArray(item[layoutOptions.picture])?.link"
        :meta="firstIfArray(item[layoutOptions.picture])"
      ></w-picture>

      <template #footer>
        <div>
          {{ item[layoutOptions.title!] }}
        </div>
        <w-context-menu
          v-if="individualActions.length > 0"
          v-bind="{
            subject: item,
            actions: individualActions
        }">
          <w-icon
            v-clickable
            reactive
            name="ellipsis-h"
            ></w-icon>
        </w-context-menu>
      </template>
    </w-card>

  </w-grid>
</template>
