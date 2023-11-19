<script setup lang="ts">
type Props = {
  inactive?: boolean
  horizontal?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="`
    card
    ${inactive && 'card--inactive'}
    ${horizontal && 'card--horizontal'}
  `">
    <div class="card__picture">
      <slot></slot>
    </div>

    <div class="card__footer">
      <div class="card__footer-upper">
        <div>
          <slot name="footer"></slot>
        </div>
        <slot v-if="$slots.actions" name="actions"></slot>
      </div>

      <div class="card__badge">
        <slot name="badge"></slot>
      </div>

    </div>
  </div>
</template>

<style scoped src="./aeria-card.less"></style>
