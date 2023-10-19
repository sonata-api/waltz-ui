import type { CollectionActions, Description } from '@sonata-api/types'
import { freshItem as _freshItem } from '@sonata-api/common'

const isObject = (property: any) =>
  property.$ref
    || property.type === 'object'
    || property.items?.$ref
    || property.items?.type === 'object'

export const condenseItem = (item?: Record<string, any>): any => {
  if( !item || typeof item !== 'object' ) {
    return item
  }

  return Object.entries(item).reduce((a, [key, value]) => {
    if( Array.isArray(value) ) {
      return {
        ...a,
        [key]: value.map(v => v?._id || condenseItem(v))
      }
    }

    if(
      value instanceof Object
        && !(value instanceof Date)
        && !Object.keys(value).length
    ) {
      return a
    }

    return {
      ...a,
      [key]: value?._id || condenseItem(value)
    }
  }, {})
}

export const isNull = (value: any) => [undefined, null, ''].includes(value)

export const removeEmpty = (item: any) => {
  const entries = Object.entries(item)
    .filter(([_, value]: [unknown, any]) => !isNull(value))

  return Object.fromEntries(entries)
}


export const normalizeActions = <const TActions extends CollectionActions<any>>(actions?: CollectionActions<any>) => {
  if( !actions ) {
    return [] as Array<TActions>
  }

  return Object.entries(actions)
    .reduce((a: Array<object>, [key, value]) => {
      if( !value || key.startsWith('_') ) {
        return a
      }

      return [
        ...a,
        {
          action: key,
          ...value
        }
    ]
  }, []) as Array<TActions>
}
export const normalizeFilters = (filters: Description['filters']) => {
  return filters?.reduce((a, b) => {
    const filter = typeof b === 'object'
      ? { [b.property]: b.default||'' }
      : { [b]: '' }

      return {
        ...a,
        ...filter
      }
  }, {}) || {}
}

export const freshItem = (description: Description) => _freshItem(description)

export const freshFilters = (description: Description) => {
  return Object.entries(description.properties||{})
    .reduce((a, [key, property]) => {
      if( isObject(property) ) {
        return {
          ...a,
          [key]: 'items' in property ? [] : {}
        }
      }

      if( 'format' in property ) {
        if( ['date', 'date-time'].includes(property.format!) ) {
          return {
            ...a,
            [key]: {
              $gte: '',
              $lte: ''
            }
          }
        }
      }

      return a
    }, {})
}

