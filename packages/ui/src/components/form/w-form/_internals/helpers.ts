import { CollectionProperty } from '@sonata-api/types'
import { deepClone } from '@sonata-api/common'
import { useStore } from '@waltz-ui/state-management'

import WInput from '../../w-input/w-input.vue'
import WOptions from '../../w-options/w-options.vue'
import WSwitch from '../../w-switch/w-switch.vue'
import WSelect from '../../w-select/w-select.vue'
import WFile from '../../w-file/w-file.vue'
import WSearch from '../../w-search/w-search.vue'
import WForm from '../../w-form/w-form.vue'

export const getComponent = (property: CollectionProperty, customComponents: Record<string, any>) => {
  const nestedProp = property.type === 'array'
    ? property.items
    : property

  // strangely enough this won't work if placed outside function
  const defaultComponents = {
    options: WOptions,
    select: WSelect,
    switch: WSwitch,
    file: WFile,
    search: WSearch,
    input: WInput,
    form: WForm
  }

  const mappedComponentType = (() => {
    if( !nestedProp ) {
      return 'input'
    }

    switch( true ) {
      case ['checkbox', 'radio'].includes(property.s$element!):
        return 'options'
      case property.s$element === 'select':
        return 'select'
      case nestedProp.type === 'boolean':
        return 'switch'
      case property.s$referencedCollection === 'file':
        return 'file'
      case property.s$isReference && property.s$inline:
        return 'form'
      case property.s$isReference:
        return 'search'
      case !!nestedProp.enum:
        return 'select'
      case nestedProp.type === 'object':
        return 'form'

      default:
        return 'input'
    }
  })()

  if( customComponents?.[mappedComponentType] ) {
    return customComponents[mappedComponentType]
  }

  return defaultComponents[mappedComponentType] || defaultComponents.input
}

export const pushToArray = (modelValue: Array<any>, property: CollectionProperty) => {
  modelValue ??= []
  const propType = property.items?.type || property.type
  if( property.s$isReference ) {
    const helperStore = useStore(property.s$referencedCollection!)
    const newVal = deepClone(helperStore.$freshItem)
    return modelValue.push(newVal)
  }

  if( propType === 'object' ) {
    return modelValue.push({})
  }

  return modelValue.push(null)
}

export const spliceFromArray = (modelValue: Array<any>, index: number) => {
  modelValue.splice(index, 1)
}
