# w-table

## Example

### Normal usage

```vue
<template>
  <w-table>
    <template #thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Description</th>
      </tr>
    </template>
    <template #tbody>
      <tr
        v-for="index in 10"
        :key="`row-${index}`"
      >
        <th>{{ index }}</th>
        <th>Example</th>
        <th>This is an example row</th>
      </tr>
    </template>
  </w-table>
</template>
```

### Declarative usage

```vue
<script setup lang="ts">
const userStore = useStore('user')
await userStore.getAll()
</script>

<template>
  <w-table
    v-bind="{
      columns: userStore.useProperties([
        'first_name',
        'last_name',
        'roles'
      ]),
      rows: userStore.items
    }"
  >
    <!-- You can still customize specified cells -->
    <template #row-name="{ row, column }">
      <strong>{{ row[column] }}</strong>
    </template>
  </w-table>
</template>
```
