# w-grid

Used to create a grid with standardized gap and responsiveness breakpoints.

## Slots

- default (required): the contents of the grid.

## Example

```vue
<template>
  <w-grid>
    <w-card
      v-for="index in 12"
      :key="`card-${index}`"
    >
      <w-picture link="/static/card.svg"></w-picture>
      <template #footer>
        Card #{{ index }}
      </template>
    </w-card>

  </w-grid>
</template>
```
