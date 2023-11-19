<script setup lang="ts">
import { inject, watch } from 'vue'
import { isLeft } from '@sonata-api/common'
import { useStore } from '@waltz-ui/state-management'

import AeriaPanel from '../../../../aeria-panel/aeria-panel.vue'
import AeriaForm from '../../../../form/aeria-form/aeria-form.vue'
import AeriaButton from '../../../../aeria-button/aeria-button.vue'
import AeriaContextMenu from '../../../../aeria-context-menu/aeria-context-menu.vue'
import AeriaIcon from '../../../../aeria-icon/aeria-icon.vue'

import { isInsertVisible } from '../../store'

const metaStore = useStore('meta')
const store = useStore(metaStore.view.collection)
const individualActions = inject('individualActions', [])

// unused
const isInsertReadOnly = false

const insert = async () => {
  const resultEither = await store.$actions.deepInsert()
  if( !isLeft(resultEither) ) {
    isInsertVisible.value = false
  }
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
  <aeria-panel
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

    <aeria-form
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
    </aeria-form>
    <template #extra>
      <aeria-context-menu
        v-bind="{
          subject: store.item,
          actions: individualActions
            .filter(({ action }) => action !== 'ui/spawnEdit')
        }"
        @action-click="isInsertVisible = false"
      >
        <aeria-icon
          v-clickable
          v-if="store.item._id"
          reactive
          icon="ellipsis-h"
        ></aeria-icon>
      </aeria-context-menu>
    </template>
    <template #footer>
      <aeria-button
        variant="transparent"
        @click="cancel"
      >
        {{ $t('action.cancel') }}
      </aeria-button>
      <aeria-button
        large
        :disabled="!store.isInsertReady || isInsertReadOnly"
        :loading="store.loading.insert"
        @click="insert"
      >
        {{ $t('action.insert') }}
      </aeria-button>
    </template>
  </aeria-panel>
</template>

