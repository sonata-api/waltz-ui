<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@waltz-ui/state-management'
import WBareButton from '../w-bare-button/w-bare-button.vue'
import WIcon from '../w-icon/w-icon.vue'

type Props = {
  actions?: any
  subject?: any
}

type Action = {
  click: (subject: any) => void
}

type Emits = {
  (e: 'actionClick', event: { action: Action, subject: any }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const userStore = useStore('user')
const contextmenu = ref<HTMLDivElement|null>(null)
const contextmenuVisible = ref(false)

const filterActions = (actions: Array<any>) => {
  return actions.filter((action: any) => {
    if( action.roles ) {
      return action.roles.include(userStore.$currentUser.role)
    }

    return !!action.click
  })
}

const onClick = (action: Action, subject: any) => {
  action.click(subject)
  emit('actionClick', { action, subject })

  contextmenuVisible.value = false
}

const position = computed(() => ({
  _: contextmenuVisible.value,
  x: Math.floor(contextmenu.value?.getBoundingClientRect().left||0 - window.scrollX) + 'px',
  y: Math.floor(contextmenu.value?.getBoundingClientRect().top||0 - window.scrollY) + 'px',
}))
</script>

<template>
  <div
    v-if="actions.length > 0"
    ref="contextmenu"
    class="contextmenu"
  >
    <a
      class="contextmenu__trigger"
      @click="contextmenuVisible = true"
    >
      <slot></slot>
    </a>
    <teleport to="#main">
      <div
        v-if="contextmenuVisible"
        v-overlay.invisible="{
          click: () => {
            contextmenuVisible = false
          }
        }"

        class="contextmenu__content"
      >
        <div>
          <div
            v-if="$slots.extra"
            class="contextmenu__section"
          >
            <div class="contextmenu__item">
              <slot
                v-if="$slots.extra"
                name="extra"
              ></slot>
            </div>
          </div>
          <div class="contextmenu__section">
            <w-bare-button
              v-for="(action, aindex) in filterActions(actions)"
              :key="`action-${aindex}`"
              class="
                contextmenu__item
                contextmenu__item--reactive
              "
              @click="onClick(action, subject)"
            >
              <w-icon
                small
                v-if="action.icon"
                :icon="action.icon"
              >
                {{
                  action.translate
                    ? $t(action.name)
                    : action.name
                }}
              </w-icon>
            </w-bare-button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped src="./w-context-menu.scss"></style>

<style scoped lang="scss">
.contextmenu__content {
  transform:
    translateX(min(v-bind('position.x'), calc(100vw - 100%)))
    translateY(min(v-bind('position.y'), calc(100vh - 100%))) !important;
}
</style>
