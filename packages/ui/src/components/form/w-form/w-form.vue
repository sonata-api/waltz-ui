<script setup lang="ts">
import type { CollectionProperty, Condition } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { onBeforeMount, ref, computed, provide, inject, isRef, type Ref } from 'vue'
import { evaluateCondition } from '@sonata-api/common'
import { useBreakpoints, insertReady } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import WIcon from '../../w-icon/w-icon.vue'
import WButton from '../../w-button/w-button.vue'
import WSelect from '../w-select/w-select.vue'
import WInput from '../w-input/w-input.vue'

import { getComponent, pushToArray, spliceFromArray } from './_internals/helpers'

type LayoutConfig = {
  span?: string
  verticalSpacing?: string
  optionsColumns?: number
  if?: Condition<any>
  component?: {
    name: string
    props?: object
  }
}

type Props = FormFieldProps<any> & {
  form?: Record<string, CollectionProperty>
  modelValue: Record<string, any>
  collection?: string | Ref<string>
  isReadOnly?: boolean
  searchOnly?: boolean
  strict?: boolean
  layout?: {
    fields: Record<string, LayoutConfig>
  }
  required?: Array<string>
  formComponents?: Record<string, any>
  propertyComponents?: Record<string, any>
  omitFormHeader?: boolean
  omitInputLabels?: boolean
  innerInputLabel?: boolean
  validationErrors?: Record<string, any>|null
  highlightRequired?: boolean
  focus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isReadOnly: false,
  searchony: false,
  strict: true,
  validationErrors: null,
  highlightRequired: true
})

const emit = defineEmits<{
  (e: 'update:modelValue' | 'input' | 'change', value: any): void
}>()

onBeforeMount(() => {
  if( !props.modelValue ) {
    emit('update:modelValue', {})
  }
})

const collectionName = !props.property
    ? props.collection || inject('storeId', null)
    : props.property.s$referencedCollection

const store = collectionName
  ? useStore(isRef(collectionName)
    ? collectionName.value
    : collectionName!)
  : null

if( !collectionName && process.env.NODE_ENV !== 'production' ) {
  console.warn(
    `w-form was used without providing storeId or specifying
    collection prop, some features may not work as intended`
  )
}

const alreadyFocused = ref(false)

const form = computed((): Record<string, CollectionProperty> | undefined => {
  if( !props.form && props.property ) {
    if( 'properties' in props.property ) {
      return props.property.properties
    }

    return store?.properties
  }

  return props.form
})

const computedLayout = computed(() => {
  return props.layout || store?.description.formLayout
})

const passAhead = <T extends keyof Props, P extends Props[T]>(propName: T): P => {
  const value = inject<P>(propName, props[propName] as P)
  if( props[propName] ) {
    provide(propName, props[propName])
  }

  return value
}

const validationErrors = computed(() => props.validationErrors !== null
  ? props.validationErrors
  : store?.validationErrors)

const formComponents = passAhead('formComponents')||{}
const propertyComponents = passAhead('propertyComponents')||{}
const omitFormHeader = passAhead('omitFormHeader')
const omitInputLabels = passAhead('omitInputLabels')
const innerInputLabel = passAhead('innerInputLabel')

if( collectionName ) {
  provide('storeId', collectionName)
}

provide('searchOnly', props.searchOnly||false)
provide('inputBordered', inject('inputBordered', true))

const filterProperties = (condition: (f: [string, CollectionProperty]) => boolean) => {
  if( !form.value ) {
    return null
  }

  return Object.entries(form.value).filter(([key, property]) => {
    return property
      && !property.s$noForm
      && (!condition || condition([key, property]))
  })
}


const has = (propertyName: string) => {
  if(
    props.searchOnly
    || !props.strict
    || !collectionName
  ) {
    return true
  }

  const formProperties = store?.description?.form
  return !formProperties || formProperties.includes(propertyName)
}

const properties = filterProperties(([key]) => {
  return has(key)
})

const breakpoints = useBreakpoints()

const fieldStyle = (key: string, property: any) => {
  const style = []
  const layout = computedLayout.value?.fields?.[key] || computedLayout.value?.fields?.$default

  if( !property ) {
    return
  }

  if( layout?.if && !props.searchOnly ) {
    const result = evaluateCondition(
      props.modelValue,
      layout.if
    )

    if( !result.satisfied ) {
      props.modelValue[key] = store
        ? store.$freshItem[key]
        : ![undefined, null].includes(props.modelValue[key])
          ? props.modelValue[key].constructor()
          : null

      style.push(`display: none;`)
    }
  }

  style.push(`
    --field-span: ${breakpoints.value.md ? layout?.span || 6 : 6};
    grid-column: span var(--field-span) / span var(--field-span);
  `)

  if( !layout ) {
    return style.join('')
  }

  if( layout.verticalSpacing ) {
    style.push(`
      --vertical-spacing: ${layout.verticalSpacing};
      padding: var(--vertical-spacing) 0;
    `)
  }

  return style.join('')
}

const unfilled = (value: any) => {
  return value === null
    || (value instanceof Object && !Object.keys(value).length)
}

const required = computed(() => props.required || store?.description.required)

const isInsertReady = computed(() => {
  if( !props.form ) {
    return true
  }

  return insertReady(
    props.modelValue,
    props.form,
    required.value,
    store?.description
  )
})

const getNestedValidationError = (key: string, listIndex?: number) => {
  if( !validationErrors.value?.[key] ) {
    return null
  }

  return typeof validationErrors.value[key].index !== 'number' || validationErrors.value[key].index === listIndex
    ? validationErrors.value[key].errors
    : null
}
</script>

<template>
  <form
    class="form"
    :style="`row-gap: ${omitFormHeader ? '.8rem' : '2rem'};`"
  >
    <header v-if="$slots.header && !omitFormHeader" class="form__header">
      <slot name="header"></slot>
    </header>

    <slot></slot>

    <fieldset
      v-if="!isReadOnly"
      class="form__fieldset"
    >
      <div
        v-for="([key, property]) in properties"
        :key="`field-${key}`"
        :style="fieldStyle(key, property)"
        class="form__field"
      >
        <label v-if="
          (!('type' in property) || property.type !== 'boolean' || searchOnly)
            && !property.s$noLabel
            && !omitInputLabels
            && !innerInputLabel
        ">
          <div :class="{
            'form__field-label': true,
            'form__field-required-hint':
              highlightRequired
                && !searchOnly
                && (!required || required.includes(key))
          }">
            {{ property.description || $t(key) }}
          </div>
          <div
            v-if="property.s$hint"
            v-html="property.s$hint"
          ></div>
        </label>

        <slot
          v-if="$slots[`field-${key}`]"
          v-bind="{
            property,
            modelValue,
            key
          }"
          :name="`field-${key}`"
        ></slot>

        <component
          v-else-if="layout?.fields?.[key]?.component && propertyComponents[layout.fields[key].component!.name]"
          :is="propertyComponents[layout.fields[key].component!.name]"
          v-model="modelValue[key]"
          v-bind="{
            property,
            propertyName: key,
            ...layout.fields[key].component!.props||{},
          }"

          @input="emit('input', key)"
          @change="emit('change', $event)"
        />

        <div
          v-else-if="'format' in property && ['date', 'date-time'].includes(property.format!) && searchOnly"
          style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            column-gap: 1rem;
          "
          @input="emit('input', key)"
          @change="emit('change', $event)"
        >
          <w-input
            v-model="modelValue[key].$gte"
            v-bind="{
              property,
              propertyName: key
            }"
          ></w-input>
          <w-input
            v-model="modelValue[key].$lte"
            v-bind="{
              property,
              propertyName: key
            }"
          ></w-input>
        </div>

        <div v-else-if="'type' in property && property.type === 'boolean' && searchOnly">
          <w-select
            v-bind="{
              property,
              propertyName: key
            }"
            boolean-ref
            :model-value="modelValue[key]"

            @change="emit('change', $event)"
            @update:model-value="(value) => {
              modelValue[key] = value == 'true'
                ? true : value == 'false'
                ? false : null
          }">
            <option value="true">{{ $t('yes') }}</option>
            <option value="false">{{ $t('no') }}</option>
          </w-select>
        </div>

        <div
          v-else-if="
            'type' in property && property.type === 'array'
              && (!(property.s$isReference && !property.s$inline) || property.s$isFile)
          "
          style="display: grid; row-gap: .4rem"
        >
          <div
            v-for="(value, listIndex) in modelValue[key]"
            :key="`rep-${key}-${listIndex}`"
            style="display: flex; column-gap: .6rem; align-items: center"
          >
            <div style="flex-grow: 1">
              <component
                :is="getComponent(property, formComponents)"
                v-model="modelValue[key][listIndex]"
                v-bind="{
                  property: {
                    ...property,
                    ...property.items
                  },
                  value,
                  propertyName: key,
                  parentCollection: collectionName,
                  parentPropertyName: key,
                  columns: layout?.fields?.[key]?.optionsColumns
                    || layout?.fields?.$default?.optionsColumns,
                  validationErrors: getNestedValidationError(key, listIndex),
                  ...(property.s$componentProps || {})
                }"

                @input="emit('input', key)"
                @change="emit('change', $event)"
              ></component>
            </div>

            <w-icon
              v-clickable
              reactive
              icon="trash"
              @click="spliceFromArray(modelValue[key], listIndex)"
            ></w-icon>
          </div>

          <div>
            <w-button
              small
              variant="transparent"
              icon="plus"
              :disabled="
                modelValue[key]?.length >= property.maxItems!
                  || unfilled(modelValue[key]?.[modelValue[key]?.length-1])
                  || (
                    property.s$isFile
                      && modelValue[key]?.length > 0
                      && !modelValue[key]?.[modelValue[key]?.length-1]?._id
                  )
              "
              @click.prevent="
                if(!modelValue[key]) modelValue[key] = [];
                pushToArray(modelValue[key], property)
              "
            >
              Adicionar
            </w-button>
          </div>
        </div>

        <component
          v-else-if="modelValue"
          :is="getComponent(property, formComponents)"
          v-model="modelValue[key]"
          v-bind="{
            property,
            propertyName: key,
            parentPropertyName: key,
            parentCollection: collectionName,
            columns: layout?.fields?.[key]?.optionsColumns
              || layout?.fields?.$default?.optionsColumns,
            ...(property.s$componentProps || {}),
            validationErrors: getNestedValidationError(key)
          }"

          v-focus="!alreadyFocused && (alreadyFocused = !!focus)"

          @input="emit('input', key)"
          @change="emit('change', $event)"
        ></component>

        <div
          v-if="validationErrors?.[key]"
          class="form__validation-error"
        >
          <span v-if="validationErrors[key].type">
            {{ $t(`validation_error.${validationErrors[key].type}`) }}
          </span>
          <span v-if="validationErrors[key].detail">
            {{ $t(validationErrors[key].detail) }}
          </span>
        </div>
      </div>
    </fieldset>

    <slot v-if="$slots.after" name="after"></slot>

    <div v-if="$slots.footer" class="form__footer">
      <slot
        name="footer"
        v-bind="{
          isInsertReady
        }"
      ></slot>
    </div>
  </form>
</template>

<style scoped src="./w-form.less"></style>
