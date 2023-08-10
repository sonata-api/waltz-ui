<script setup lang="ts">
import { ref } from 'vue'

type Props = {
  where?:
    'top'
    | 'topleft'
    | 'left'
    | 'bottom'
    | 'right'
}

const props = defineProps<Props>()

const visible = ref(false)
const where = props.where || 'top'
</script>

<template>
  <div
    class="info"
    @mouseleave="visible = false
  ">
    <div
      v-if="visible"
      :class="`
        info__bubble
        info__bubble--${where}
    `">
      <div class="info__content">
        <slot name="text"></slot>
      </div>
    </div>
    <div @mouseover="visible = true">
      <slot v-if="$slots.default" name="default"></slot>
      <slot v-else></slot>
    </div>
  </div>
</template>

<style scoped src="./w-info.scss"></style>
