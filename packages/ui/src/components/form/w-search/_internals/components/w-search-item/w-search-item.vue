<script setup lang="ts">
type Props = {
  item: any
  indexes: Array<string>
}

const props = defineProps<Props>()
</script>

<template>
  <div
    v-clickable
    class="item"
  >
    <slot></slot>

    <div class="item__values">
      <div
        v-for="(index, idx) in indexes"
        :key="`index-${item._id}-${idx}`"
        class="item__value"
      >
        {{ item[index] }}
      </div>
    </div>

  </div>
</template>

<style scoped src="./w-search-item.scss"></style>
