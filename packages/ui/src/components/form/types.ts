import type { CollectionProperty } from '@sonata-api/types'

export type FormFieldProps<TType> = {
  modelValue: TType
  property?: CollectionProperty
  propertyName?: string
  parentPropertyName?: string
  parentCollection?: string
}
