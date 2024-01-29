<script setup lang="ts">
import type { Property, Condition, BooleanProperty } from '@sonata-api/types'
import type { FormFieldProps } from '../types'
import { onBeforeMount, ref, computed, provide, inject, isRef, type Ref } from 'vue'
import { evaluateCondition, deepClone, isRequired, getReferenceProperty } from '@sonata-api/common'
import { useBreakpoints, isDocumentComplete } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'

import AeriaIcon from '../../aeria-icon/aeria-icon.vue'
import AeriaButton from '../../aeria-button/aeria-button.vue'
import AeriaSelect from '../aeria-select/aeria-select.vue'
import AeriaInput from '../aeria-input/aeria-input.vue'

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
  form?: Record<string, Property>
  modelValue: Record<string, any>
  collection?: string | Ref<string>
  isReadOnly?: boolean
  searchOnly?: boolean
  layout?: {
    fields: Record<string, LayoutConfig>
  }
  required?: string[]
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
  validationErrors: null,
  highlightRequired: true
})

const emit = defineEmits<{
  (e: 
    | 'update:modelValue'
    | 'input'
    | 'change',
  value: any
  ): void
}>()

onBeforeMount(() => {
  if( !props.modelValue ) {
    emit('update:modelValue', props.property && 'items' in props.property
      ? []
      : {}
    )
  }
})

const refProperty = props.property && getReferenceProperty(props.property)
const collectionName = refProperty
    ? refProperty.$ref
    : props.collection || inject('storeId', null)

const store = collectionName
  ? useStore(isRef(collectionName)
    ? collectionName.value
    : collectionName!)
  : null

if( !collectionName && process.env.NODE_ENV !== 'production' ) {
  console.warn(
    `aeria-form was used without providing storeId or specifying
    collection prop, some features may not work as intended`
  )
}

const alreadyFocused = ref(false)

const form = computed((): Record<string, Property> | undefined => {
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

const formComponents = passAhead('formComponents') || {}
const propertyComponents = passAhead('propertyComponents') || {}
const omitFormHeader = passAhead('omitFormHeader')
const omitInputLabels = passAhead('omitInputLabels')
const innerInputLabel = passAhead('innerInputLabel')

if( collectionName ) {
  provide('storeId', collectionName)
}

provide('searchOnly', props.searchOnly)

const filterProperties = (condition: (f: [string, Property]) => boolean) => {
  if( !form.value ) {
    return null
  }

  return Object.entries(form.value).filter(([key, property]) => {
    return property
      && !property.noForm
      && (!condition || condition([key, property]))
  })
}


const has = (propertyName: string) => {
  if( props.searchOnly || !collectionName ) {
    return true
  }

  const formProperties = store?.description?.form
  return !formProperties || formProperties.includes(propertyName)
}

const properties = filterProperties(([key]) => {
  return has(key)
})

const breakpoints = useBreakpoints()
const conditionMemo: Record<string, boolean> = {}

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
      if( conditionMemo[key] ) {
        if( store ) {
          props.modelValue[key] = typeof store.$freshItem[key] === 'object'
            ? deepClone(store.$freshItem[key])
            : store.$freshItem[key]
        } else {
          props.modelValue[key] = ![undefined, null].includes(props.modelValue[key])
            ? props.modelValue[key].constructor()
            : null
        }
      }

      style.push(`display: none;`)
    }

    conditionMemo[key] = result.satisfied
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

const required = computed(() => {
  return props.required
    ? props.required
    : props.property && 'required' in props.property
      ? props.property.required
      : store?.description.required
})

const isInsertReady = computed(() => {
  if( !props.form ) {
    return true
  }

  return isDocumentComplete(
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
    :style="`row-gap: ${omitFormHeader ? '.8rem' : 'var(--form-internal-gap, 1.6rem);'};`"
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
        v-for="([propertyName, property]) in properties"
        :key="`field-${propertyName}`"
        :style="fieldStyle(propertyName, property)"
        class="form__field"
      >
        <label v-if="
          (!('type' in property) || property.type !== 'boolean' || searchOnly)
            && !property.noLabel
            && !omitInputLabels
            && !innerInputLabel
        ">
          <div :class="{
            'form__field-label': true,
            'form__field-required-hint':
              highlightRequired
                && !searchOnly
                && (!required || isRequired(propertyName, required, modelValue))
          }">
            {{ property.description || t(propertyName) }}
          </div>
          <div
            v-if="property.hint"
            v-html="property.hint"
          ></div>
        </label>

        <slot
          v-if="$slots[`field-${propertyName}`]"
          v-bind="{
            property,
            propertyName,
            modelValue,
          }"
          :name="`field-${propertyName}`"
        ></slot>

        <component
          v-else-if="layout?.fields?.[propertyName]?.component && propertyComponents[layout.fields[propertyName].component!.name]"
          :is="propertyComponents[layout.fields[propertyName].component!.name]"
          v-model="modelValue[propertyName]"
          v-bind="{
            property,
            propertyName,
            ...layout.fields[propertyName].component!.props||{},
          }"

          @input="emit('input', propertyName)"
          @change="emit('change', $event)"
        />

        <div
          v-else-if="
            'format' in property
              && ['date', 'date-time'].includes(property.format!)
              && searchOnly
          "
          style="
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            column-gap: 1rem;
          "
          @input="emit('input', propertyName)"
          @change="emit('change', $event)"
        >
          <aeria-input
            v-model="modelValue[propertyName].$gte"
            v-bind="{
              property,
              propertyName 
            }"
          ></aeria-input>
          <aeria-input
            v-model="modelValue[propertyName].$lte"
            v-bind="{
              property,
              propertyName 
            }"
          ></aeria-input>
        </div>

        <div v-else-if="
          'type' in property
            && property.type === 'boolean'
            && searchOnly
        ">
          <aeria-select
            v-bind="{
              property: property as BooleanProperty,
              propertyName
            }"
            boolean-ref
            :model-value="modelValue[propertyName]"

            @change="emit('change', $event)"
            @update:model-value="(value) => {
              modelValue[propertyName] = value == 'true'
                ? true : value == 'false'
                ? false : null
          }">
            <option value="true">{{ t('yes') }}</option>
            <option value="false">{{ t('no') }}</option>
          </aeria-select>
        </div>

        <div
          v-else-if="
            'items' in property && !property.uniqueItems && (
              !('$ref' in property.items)
              || (property.items.inline || property.items.$ref === 'file')
            )
          "
          style="display: grid; row-gap: .4rem"
        >
          <div
            v-for="(_, listIndex) in modelValue[propertyName]"
            :key="`rep-${propertyName}-${listIndex}`"
            style="display: flex; column-gap: .6rem; align-items: center"
          >
            <div style="flex-grow: 1">
              <component
                :is="getComponent(property, formComponents)"
                v-model="modelValue[propertyName][listIndex]"
                v-bind="{
                  property: property.items,
                  propertyName,
                  parentCollection: collectionName,
                  parentPropertyName,
                  columns: layout?.fields?.[propertyName]?.optionsColumns
                    || layout?.fields?.$default?.optionsColumns,
                  validationErrors: getNestedValidationError(propertyName, listIndex),
                  ...(property.componentProps || {})
                }"

                @input="emit('input', propertyName)"
                @change="emit('change', $event)"
              ></component>
            </div>

            <aeria-icon
              v-clickable
              reactive
              icon="trash"
              @click="spliceFromArray(modelValue[propertyName], listIndex)"
            ></aeria-icon>
          </div>

          <div>
            <aeria-button
              small
              variant="alt"
              icon="plus"
              :disabled="
                !('inline' in property.items && property.items.inline) && (
                  modelValue[propertyName]?.length >= property.maxItems!
                  || unfilled(modelValue[propertyName]?.[modelValue[propertyName]?.length - 1])
                )
              "
              @click.prevent="
                if(!modelValue[propertyName]) modelValue[propertyName] = [];
                pushToArray(modelValue[propertyName], property)
              "
            >
              Adicionar
            </aeria-button>
          </div>
        </div>

        <component
          v-else
          :is="getComponent(property, formComponents)"
          v-model="modelValue[propertyName]"
          v-bind="{
            property,
            propertyName,
            parentPropertyName,
            parentCollection: collectionName,
            columns: layout?.fields?.[propertyName]?.optionsColumns
              || layout?.fields?.$default?.optionsColumns,
            ...(property.componentProps || {}),
            validationErrors: getNestedValidationError(propertyName)
          }"

          v-focus="!alreadyFocused && (alreadyFocused = !!focus)"

          @input="emit('input', propertyName)"
          @change="emit('change', $event)"
        ></component>

        <div
          v-if="validationErrors?.[propertyName]"
          class="form__validation-error"
        >
          <span v-if="validationErrors[propertyName].type">
            {{ t(`validation_error.${validationErrors[propertyName].type}`) }}
          </span>
          <span v-if="validationErrors[propertyName].detail">
            {{ t(validationErrors[propertyName].detail) }}
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

<style scoped src="./aeria-form.less"></style>
