import type { Property, RefProperty, ArrayOfRefs } from '@sonata-api/types'

export type FormFieldProps<TType> = {
  modelValue: TType
  property?: Property
  propertyName?: string
  parentPropertyName?: string
  parentCollection?: string
}

export type SearchProperty = (RefProperty | ArrayOfRefs) & NonNullable<Pick<Property,
  | 'isReference'
  | 'referencedCollection'
>>
