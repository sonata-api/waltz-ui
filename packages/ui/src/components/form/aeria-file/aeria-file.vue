<script setup lang="ts">
import type { Property, FileProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { inject, provide, ref, computed } from 'vue'
import { request, API_URL } from '@waltz-ui/web'
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

const fileRef = ref<File | null>(null)

const preview = computed(() =>
  fileRef.value
    ? URL.createObjectURL(fileRef.value)
    : props.modelValue?.link
)

const isImage = computed(() => 
  (/^image\//.test(props.modelValue?.mime) && !fileRef.value?.type)
    || /^image\//.test(fileRef.value?.type!)
)

const readFile = (file: File) => new Promise<string | ArrayBuffer | null>((resolve) => {
  const fr = new FileReader()
  fr.onload = () => resolve(fr.result)
  fr.readAsArrayBuffer(file)
})

const changePreview = (event: Event) => {
  fileRef.value = (event.target as HTMLInputElement).files![0]
}

const clearPreview = () => {
  fileRef.value = null
}

const insert = async () => {
  if( !fileRef.value ) {
    return
  }

  const file = fileRef.value
  const content = await readFile(file)

  if( store ) {
    await request(`${API_URL}/${store.$id}/upload?ref=${props.propertyName}&filename=${file.name}`, content, {
      params: {
        method: 'POST',
        headers: {
          'content-type': file.type,
          'x-stream-request': '1',
        }
      }
    })
  }

  emit('update:modelValue', content)
  emit('change', content)
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
    <div v-if="fileRef || modelValue?._id">
      <aeria-picture
        v-if="isImage"
        v-model="preview"
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
        v-if="fileRef"
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
