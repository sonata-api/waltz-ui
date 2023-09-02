<script setup lang="ts">
import { bootstrapRoutes } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'
import WModal from '../dashboard/w-modal/w-modal.vue'
import WPrompt from '../dashboard/w-prompt/w-prompt.vue'
import WToast from '../dashboard/w-toast/w-toast.vue'
import '../../scss/main.scss'

const metaStore = useStore('meta')
bootstrapRoutes()
</script>

<template>
  <main
    id="main"
    :class="`
      main
      main--${metaStore.$theme}
      ${metaStore.$theme === 'dark' && 'tw-dark'}
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

    <w-modal
      v-model="metaStore.modal.visible"
      v-bind="metaStore.modal"
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
    </w-modal>

    <w-prompt
      v-if="metaStore.prompt.visible"
      v-bind="metaStore.prompt"
    >
      {{ metaStore.prompt.body }}
    </w-prompt>

    <div class="main__toasts">
      <w-toast
        v-for="toast in metaStore.toasts"
        v-bind="toast"
        :key="`toast-${toast.itr}`"
      >
        <div v-html="
        Array.isArray(toast.text)
          ? $t(...toast.text)
          : toast.text
        "></div>
      </w-toast>
    </div>
  </main>
</template>

<style scoped src="./w-main.scss"></style>
