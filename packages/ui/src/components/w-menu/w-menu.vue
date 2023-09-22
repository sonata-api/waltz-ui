<template>
  <menu class="menu">
    <div
      v-for="slotName in Object.keys($slots)"
      :key="slotName"
      class="menu__entry"
    >
      <slot
        :name="slotName"
      ></slot>
    </div>
  </menu>
</template>

<style scoped src="./w-menu.scss"></style>
