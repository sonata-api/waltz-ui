<script setup lang="ts">
import type { FormFieldProps } from '../types'
import { provide, ref, computed } from 'vue'
import { useParentStore } from '@waltz-ui/state-management'
import WPicture from '../../w-picture/w-picture.vue'
import WButton from '../../w-button/w-button.vue'

type Props = FormFieldProps<any> & {
  meta?: Record<string, any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', value: any): void
}>()

const store = useParentStore()
provide('buttonSize', 'small')

const preview = ref<({ type: string }&Blob)|null>(null)

const previewFile = computed(() =>
  preview.value
    ? URL.createObjectURL(preview.value)
    : props.modelValue?.link
)

const isImage = computed(() => 
  (/^image\//.test(props.modelValue?.mime) && !preview.value?.type)
    || /^image\//.test(preview.value?.type!)
)

const readFile = (file: any): Promise<any> => new Promise((resolve) => {
  const fr = new FileReader()

  fr.onload = () => resolve({
    filename: file.name,
    content: fr.result,
    last_modified: file.lastModified,
    mime: file.type,
    size: file.size,
  })

  fr.readAsDataURL(file)
})

const changePreview = (event: any) => {
  preview.value = event.target.files[0]
}

const clearPreview = () => {
  preview.value = null
}

const insert = async () => {
  const file = await readFile(preview.value)
  const { result } = await store.$functions.upload({
    parentId: store.item._id,
    propertyName: props.propertyName,
    what: {
      _id: props.modelValue?._id,
      ...file
    },
    meta: props.meta
  })

  clearPreview()
  emit('update:modelValue', result)
  emit('change', result)
}

const remove = async () => {
  await store.$functions.removeFile({
    parentId: store.item._id,
    propertyName: props.propertyName,
    filters: {
      _id: props.modelValue._id
    }
  })

  emit('update:modelValue', {})
}
</script>

<template>
  <div class="file">
    <div v-if="preview || modelValue?._id">
      <w-picture
        v-if="isImage"
        v-model="previewFile"
        class="file__image"
      ></w-picture>
      <a
        v-if="modelValue?._id"
        :href="modelValue.download_link"
      >
        {{ modelValue.filename }}
      </a>
    </div>
    <div class="file__actions">
      <input
        type="file"
        ref="file"
        :accept="property.s$accept?.join(',')"
        @change="changePreview"
      />
      <div
        v-if="preview"
        class="file__buttons"
      >
        <w-button @click.prevent="insert">
          Enviar
        </w-button>
        <w-button @click.prevent="clearPreview">
          Limpar
        </w-button>
      </div>
      <div
        v-else-if="modelValue?._id"
        class="file__buttons"
      >
        <w-button @click.prevent="remove">
          Remover
        </w-button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./w-file.scss"></style>
