import { Property } from '@sonata-api/types'
import { deepClone, isReference, getReferenceProperty, freshItem } from '@sonata-api/common'
import { useStore } from '@waltz-ui/state-management'

import AeriaInput from '../../aeria-input/aeria-input.vue'
import AeriaOptions from '../../aeria-options/aeria-options.vue'
import AeriaSwitch from '../../aeria-switch/aeria-switch.vue'
import AeriaSelect from '../../aeria-select/aeria-select.vue'
import AeriaFile from '../../aeria-file/aeria-file.vue'
import AeriaSearch from '../../aeria-search/aeria-search.vue'
import AeriaForm from '../../aeria-form/aeria-form.vue'

export const getComponent = (property: Property, customComponents: Record<string, any>) => {
  const nestedProp = 'items' in property
    ? property.items
    : property

  // strangely enough this won't work if placed outside function
  const defaultComponents = {
    options: AeriaOptions,
    select: AeriaSelect,
    switch: AeriaSwitch,
    file: AeriaFile,
    search: AeriaSearch,
    input: AeriaInput,
    form: AeriaForm
  }

  const mappedComponentType = (() => {
    if( !nestedProp ) {
      return 'input'
    }

    if( 'type' in nestedProp ) {
      if( nestedProp.type === 'object' ) {
        return 'form'
      }
      if( nestedProp.type === 'boolean' ) {
        return 'switch'
      }
    }

    if( 'element' in property ) {
      if( property.element === 'checkbox' || property.element === 'radio' ) {
        return 'options'
      }
      if( property.element === 'select' ) {
        return 'select'
      }
    }

    switch( true ) {
      case nestedProp.referencedCollection === 'file':
        return 'file'
      case getReferenceProperty(property)?.inline:
        return 'form'
      case isReference(nestedProp):
        return 'search'
      case 'enum' in nestedProp:
        return 'select'

      default:
        return 'input'
    }

  })()

  if( customComponents?.[mappedComponentType] ) {
    return customComponents[mappedComponentType]
  }

  return defaultComponents[mappedComponentType] || defaultComponents.input
}

export const pushToArray = (modelValue: any[], property: Property) => {
  modelValue ??= []
  const nestedProp = 'items' in property
    ? property.items
    : property

  if( property.isReference ) {
    const helperStore = useStore(property.referencedCollection!)
    const newVal = deepClone(helperStore.$freshItem)
    return modelValue.push(newVal)
  }

  if( 'properties' in nestedProp ) {
    return modelValue.push(freshItem(nestedProp))
  }

  if( 'type' in nestedProp && nestedProp.type === 'boolean' ) {
    return modelValue.push({})
  }

  return modelValue.push(null)
}

export const spliceFromArray = (modelValue: any[], index: number) => {
  modelValue.splice(index, 1)
}
