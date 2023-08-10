# w-tabs

## Example

```vue
<script setup lang="ts">
const router = await useRouter()
const section = computed<'home'|'about'|'contact'>(() => router.currentRoute.value.query.section || 'home')
</script>

<template>
  <w-tabs query="section">
    <template #home>Home</template>
    <template #about>About</template>
    <template #contact>Contato</template>
  </w-tabs>

  <div v-if="section === 'home'">
    Welcome!
  </div>
  
  <div v-if="section === 'about'">
    About us...
  </div>

  <div v-if="section === 'contact'">
    Contact us...
  </div>
</template>
```
