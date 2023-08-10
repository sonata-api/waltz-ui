# w-button

## Example

```vue
<script setup lang="ts">
const userStore = useStore('user')
</script>

<template>
  <w-button :loading="userStore.loading.getAll" @click="userStore.getAll">
    Click here
  </w-button>
</template>
```
