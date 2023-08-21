<script setup lang="ts">
import { inject, watch } from 'vue'
import { CollectionStore } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import WBox from '../../../../w-box/w-box.vue'
import WForm from '../../../../form/w-form/w-form.vue'
import WButton from '../../../../w-button/w-button.vue'
import WContextMenu from '../../../../w-context-menu/w-context-menu.vue'
import WIcon from '../../../../w-icon/w-icon.vue'

import { isInsertVisible } from '../../store'

const props = defineProps<{
  parentCollection?: string
  parentField?: string
}>()

const metaStore = useStore('meta')
const store = useStore(metaStore.view.collection)
const individualActions = inject('individualActions', [])

// unused
const isInsertReadOnly = false

const parentStore = inject<CollectionStore>('parentStore')

const insert = async () => {
  const result = await store.$actions.deepInsert()

  if( props.parentField ) {
    const newSet = parentStore!.item[props.parentField] ||= []
    if( newSet.findIndex(({ _id }:{ _id: string }) => _id === result._id) === -1 ) {
      newSet.push(result._id)
    }

    await parentStore!.$actions.insert({
      what: {
        _id: parentStore!.item._id,
        [props.parentField]: newSet
      }
    })
  }

  isInsertVisible.value = false
}

const cancel = () => {
  store.$actions.ask({
    action: () => {
      store.$actions.clearItem()
      store.validationErrors = {}
      isInsertVisible.value = false
    },
    body: I18N.global.tc('prompt.close_panel')
  })
}

watch(() => store.item._id, (_id) => {
  if( _id === null ) {
    isInsertVisible.value = false
  }
})
</script>

<template>
  <w-box
    fixed-right
    v-model="isInsertVisible"
    @overlay-click="cancel"
  >
    <template #header>
      <span>{{
        (() => {
          switch( isInsertVisible ) {
            case 'add':
              return $t('action.add')
            case 'duplicate':
              return $t('action.duplicate')
            case 'edit':
            default:
              return $t('action.edit')
          }
        })() }}
      </span>
      <span>&nbsp;{{ $t(metaStore.view.collection) }}</span>
    </template>

    <w-form
      v-model="store.item"
      v-bind="{
        collection: metaStore.view.collection,
        form: store.properties,
        isReadOnly: isInsertReadOnly,
        layout: store.description.formLayout || {}
      }"

      @add="$event.preventDefault()"
    >
      <template
        v-for="slotName in Object.keys($slots).filter(key => key.startsWith('field-'))"
        v-slot:[slotName]="slotProps"
      >
        <slot
          v-bind="slotProps"
          :name="slotName"
        ></slot>
      </template>
    </w-form>
    <template #extra>
      <w-context-menu
        v-bind="{
          subject: store.item,
          actions: individualActions
            .filter(({ action }) => action !== 'ui/spawnEdit')
        }"
        @action-click="isInsertVisible = false"
      >
        <w-icon
          v-clickable
          v-if="store.item._id"
          reactive
          icon="ellipsis-h"
        ></w-icon>
      </w-context-menu>
    </template>
    <template #footer>
      <w-button
        small
        variant="transparent"
        @click="cancel"
      >
        {{ $t('action.cancel') }}
      </w-button>
      <w-button
        :disabled="!store.isInsertReady || isInsertReadOnly"
        :loading="store.loading.insert"
        @click="insert"
      >
      {{ $t('action.insert') }}
      </w-button>
    </template>
  </w-box>
</template>

