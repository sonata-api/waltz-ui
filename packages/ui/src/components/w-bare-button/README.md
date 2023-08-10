# w-bare-button

## Example

```vue
<script setup lang="ts">
const count = ref(0)
</script>

<template>
  <w-bare-button
    disabled
    @click="count += 1"
  >
    {{ count }}
  </w-bare-button>
</template>
```
