<script setup lang="ts">
import { useStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'
import AeriaPanel from '../aeria-panel/aeria-panel.vue'
import AeriaPrompt from '../dashboard/aeria-prompt/aeria-prompt.vue'
import AeriaToast from '../dashboard/aeria-toast/aeria-toast.vue'

const metaStore = useStore('meta')
</script>

<template>
  <main
    id="main"
    :class="`
      main
      main--${metaStore.theme}
      ${metaStore.theme === 'dark' && 'tw-dark'}
  `">
    <Suspense>
      <router-view v-slot="{ Component }">
        <component :is="Component">
          <template
            v-for="slotName in Object.keys($slots)"
            v-slot:[slotName]
          >
            <slot :name="slotName"></slot>
          </template>
        </component>
      </router-view>
    </Suspense>

    <slot></slot>

    <aeria-panel
      float
      close-hint
      v-model="metaStore.modal.visible"
      v-bind="metaStore.modal"
      :overlay-layer="70"
      @overlay-click="metaStore.modal.visible = false"
    >
      <div
        v-if="metaStore.modal.body"
        v-html="metaStore.modal.body"
        style="white-space: pre-wrap"
      ></div>

      <component
        v-if="metaStore.modal.component"
        :is="metaStore.modal.component"
      ></component>
    </aeria-panel>

    <aeria-prompt
      v-if="metaStore.prompt.visible"
      v-bind="metaStore.prompt"
    >
      {{ metaStore.prompt.body }}
    </aeria-prompt>

    <div class="main__toasts">
      <aeria-toast
        v-for="toast in metaStore.toasts"
        v-bind="toast"
        :key="`toast-${toast.itr}`"
      >
        <div v-html="t(toast.text)"></div>
      </aeria-toast>
    </div>
  </main>
</template>

<style scoped src="./aeria-main.less"></style>
<style src="../../less/main.less"></style>
