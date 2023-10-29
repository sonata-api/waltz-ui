<template>
  <div class="container">
    <div v-if="$slots.default" class="container__content">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="container__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped src="./w-search-container.less"></style>
