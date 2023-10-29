<script setup lang="ts">
import type { PromptAction } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'
import WBox from '../../w-box/w-box.vue'
import WBareButton from '../../w-bare-button/w-bare-button.vue'


type Props = {
  title?: string
  actions: Array<PromptAction>
}

const props = defineProps<Props>()
const metaStore = useStore('meta')

const onClick = (answer: PromptAction) => {
  metaStore.$actions.fulfillPrompt(answer)
}
</script>

<template>
  <w-box
    float
    fill-footer
    :close-hint="false"
  >
    <div class="prompt">
      <slot></slot>
    </div>

    <template #title v-if="title">
      {{ title }}
    </template>

    <template #footer>
      <div
        class="prompt__actions"
        :style="`grid-template-columns: repeat(${actions.length}, 1fr)`"
      >
        <w-bare-button
          v-for="(action, index) in actions"
          :key="`action-${index}`"

          :class="`
            prompt__action
            prompt__action--${action.variant || 'normal'}
          `"
          @click="action.click
            ? action.click(action)
            : onClick(action)
          "
        >
          {{ action.title || action.name }}
        </w-bare-button>
      </div>
    </template>
  </w-box>
</template>

<style scoped src="./w-prompt.less"></style>
