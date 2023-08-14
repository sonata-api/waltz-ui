import type { CollectionProperty, Description } from '@sonata-api/types'

export const insertReady = <
  const TItem extends Record<string, any>,
  TProperties extends Record<Lowercase<string>, CollectionProperty>
>(
  item: TItem,
  properties: TProperties,
  required?: Array<keyof TProperties>,
  description?: Description

) => {
  const formIncludes = (key: string) => {
    const form = description?.form!
    return Array.isArray(form)
      ? form.includes(key)
      : key in form
  }

  const ensureFulfillment = () => {
    const keys = required as Array<Lowercase<string>> || Object.keys(properties||{})

    return keys.every((k) => {
      const property = description?.properties?.[k]! || {}
      if( property.s$meta ) {
        return true
      }

      return !(k in properties)
        || (description?.form && !formIncludes(k))
        || property.type === 'boolean'
        || (
          !!item[k]
            && (
              !property.s$isReference
              || property.type === 'array'
              || item[k]._id
            )
        )
    })
  }
  
  return ensureFulfillment()
}

