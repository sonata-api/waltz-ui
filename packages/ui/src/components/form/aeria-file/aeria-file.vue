<script setup lang="ts">
import type { Property, FileProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { inject, provide, ref, computed } from 'vue'
import { useParentStore } from '@waltz-ui/state-management'
import AeriaPicture from '../../aeria-picture/aeria-picture.vue'
import AeriaButton from '../../aeria-button/aeria-button.vue'

type Props = FormFieldProps<any, Property & FileProperty> & {
  meta?: Record<string, any>
  modelValue?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', value: any): void
}>()

const parentStoreId = inject('storeId')
const store = parentStoreId
  ? useParentStore()
  : null

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

const changePreview = (event: Event) => {
  preview.value = (event.target as HTMLInputElement).files![0]
}

const clearPreview = () => {
  preview.value = null
}

const insert = async () => {
  const file = await readFile(preview.value)

  const result = store
    ? await store.$functions.upload({
      parentId: store.item._id,
      propertyName: props.propertyName,
      what: {
        _id: props.modelValue?._id,
        ...file
      },
      meta: props.meta
    })
    : file

  clearPreview()

  emit('update:modelValue', result)
  emit('change', result)
}

const remove = async () => {
  if( store ) {
    await store.$functions.removeFile({
      parentId: store.item._id,
      propertyName: props.propertyName,
      filters: {
        _id: props.modelValue._id
      }
    })
  }

  emit('update:modelValue', {})
}
</script>

<template>
  <div class="file">
    <div v-if="preview || modelValue?._id">
      <aeria-picture
        v-if="isImage"
        v-model="previewFile"
        :class="`
          file__image
          ${(!store || modelValue?._id) || 'file__image--unsent'}
        `"
      ></aeria-picture>
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
        :accept="property?.accept?.join(',')"
        @change="changePreview"
      />
      <div
        v-if="preview"
        class="file__buttons"
      >
        <aeria-button @click.prevent="insert">
          Enviar
        </aeria-button>
        <aeria-button @click.prevent="clearPreview">
          Limpar
        </aeria-button>
      </div>
      <div
        v-else-if="modelValue?._id"
        class="file__buttons"
      >
        <aeria-button @click.prevent="remove">
          Remover
        </aeria-button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./aeria-file.less"></style>
