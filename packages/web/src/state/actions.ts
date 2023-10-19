import type { CollectionProperty } from '@sonata-api/types'
import type { CollectionStore } from './collection'
import { formatValue, deepClone, request, isLeft, unwrapEither } from '@sonata-api/common'
import { useStore } from '@waltz-ui/state-management'
import { API_URL } from '../constants'
import { condenseItem } from './helpers'

export type CrudParameters = {
  filters: Record<string, any>
  limit: number
  offset: number
  project?: string[]|Record<string, 1|-1>
}

export type ActionFilter = Partial<CrudParameters>

export type CustomOptions = {
  method?:
    'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
  skipLoading?: boolean
  skipEffect?: boolean
  insert?: boolean
}

export const useStoreActions = (store: CollectionStore) => {
  const actions = {
    setItem(item: typeof store['item']) {
      Object.assign(store.item, deepClone(store.freshItem))
      Object.entries(item).forEach(([key, value]) => {
        store.item[key] = value
      })

      store.referenceItem = deepClone({
        ...store.freshItem,
        ...item
      })

      return item
    },

    setItems(items: typeof store['items']) {
      store.items.splice(0)
      store.items.push(...items)
      return items
    },

    insertItem(_item: typeof store['item'], options?: { merge?: boolean }) {
      const old = options?.merge
        ? Object.assign({}, store.item)
        : {}

      const item = Object.assign(old, _item)
      actions.setItem(item)

      const found = store.items.find(({ _id }) => _id === item._id)
      if( found ) {
        Object.assign(found, item)
        return item
      }

      store.items.unshift(item)
      return item
    },

    removeItem(subject: typeof store['item']) {
      store.items = store.items.filter(({ _id }) => {
        if( Array.isArray(subject) ) {
          return !subject.find(sub => sub._id === _id)
        }

        return subject._id !== _id
      })
      if( store.item._id === subject._id ) {
        store.item._id = null
      }

      return subject
    },

    clearItem() {
      Object.keys(store.item).forEach((key) => {
        delete store.item[key]
      })

      return actions.setItem({})
    },

    clearItems() {
      store.items = []
    },

    async custom(verb: string|null, payload?: any, options?: CustomOptions) {
      store.validationErrors = {}
      if( !options?.skipLoading ) {
        store.loading[verb || ''] = true
      }

      const route = verb
        ? `${store.$id}/${verb}`
        : store.$id

      const promise = request(`${API_URL}/${route}`, payload)
        .catch((err: any) => {
          if( err.validation ) {
            store.validationErrors = err.validation
          }

          throw err
        })
        .finally(() => {
          if( !options?.skipLoading ) {
          store.loading[verb || ''] = false
          }
        })

      const data = (await promise)?.data
      if( options?.insert ) {
        actions.insertItem(data.result)
      }

      return data
    },

    async customEffect(verb: string|null, payload: any, fn: (payload: any) => any, options?: CustomOptions) {
      const result = await actions.custom(verb, payload, options)
      if( options?.skipEffect ) {
        return result
      }

      return result
        ? fn(result)
        : {}
    },

    count(payload: Pick<CrudParameters, 'filters'>) {
      return actions.custom('count', payload)
    },

    get(payloadSource: ActionFilter|string, options?: CustomOptions) {
      const payload = typeof payloadSource === 'string'
        ? { filters: { _id: payloadSource } }
        : payloadSource

      return actions.customEffect(
        'get', payload,
        (result) => {
          if( result ) {
            actions.setItem(result)
          }

          return result
        },
        options
      )
    },

    getAll(_payload: ActionFilter, options?: CustomOptions)  {
      const payload = Object.assign({}, _payload)

      if( typeof payload.limit !== 'number' ) {
        payload.limit = store.pagination.limit
      }

      if( typeof payload.offset !== 'number' ) {
        payload.offset = store.pagination.offset
      }

      return actions.customEffect(
        'getAll', payload,
        ({ data, pagination }) => {
          actions.setItems(data)
          Object.assign(store.pagination, pagination)

          return data
        }, options)
    },

    insert(payload?: { what: Partial<typeof store['item']> }, options?: CustomOptions) {
      return actions.customEffect(
        'insert', { ...payload, what: payload?.what||store.item },
        (resultEither) => {
          if( isLeft(resultEither) ) {
            return resultEither
          }

          const result = unwrapEither(resultEither)
          return actions.insertItem(result)
        },
        options
      )
    },

    async deepInsert(payload?: { what: Partial<typeof store['item']> }, options?: CustomOptions) {
      const inlineReferences = store.inlineReferences
      const newItem = Object.assign({}, payload?.what || store.diffedItem)

      for( const [propertyName, property] of inlineReferences ) {
        const type = 'type' in property
          ? property.type
          : null

        const {
          s$referencedCollection: collection

        } = property

        if(
          newItem[propertyName]
          && typeof newItem[propertyName] === 'object'
          && Object.keys(newItem[propertyName]).length > 0
        ) {
          const helperStore = useStore(collection!)

          const getInsertedId = async (subject: any) => {
            if( type === 'array' && Array.isArray(subject) ) {
              const ids = []
              for( const item of subject ) {
                const result = await helperStore.$actions.deepInsert({ what: item })
                ids.push(result._id)
              }

              return ids
            }

            const result = await helperStore.$actions.deepInsert({
              what: subject
            })

            return result?._id
          }

          newItem[propertyName] = await getInsertedId(newItem[propertyName])
        }
      }

      return actions.insert({
        what: condenseItem(newItem)
      }, options)
    },

    async remove(payload: ActionFilter['filters'], options?: CustomOptions) {
      return actions.customEffect(
        'remove', {
          filters: {
            _id: payload?._id
          }
        },
        actions.removeItem,
        options
      )
    },

    async removeAll(payload: ActionFilter['filters'], options?: CustomOptions) {
      return actions.customEffect(
        'removeAll', {
          filters: {
            _id: payload?._id
          }
        },
        actions.removeItem,
        options
      )
    },

    filter(props?: ActionFilter, options?: CustomOptions) {
      store.activeFilters = props?.filters || store.$filters

      return actions.getAll({
        filters: {
          ...store.activeFilters,
          ...store.filtersPreset
        },
        limit: store.pagination.limit,
        ...props||{}
      }, options)
    },

    updateItems() {
      return actions.filter()
    },

    clearFilters() {
      const filters = store.filters = deepClone(store.freshFilters)
      store.pagination.offset = 0
      return filters
    },

    async ask(props: {
      action: (params: any) => unknown,
      params: any
      title?: string
      body?: string
    }) {
      const answer = await (await import('../stores/meta')).meta()().$actions.spawnPrompt({
        body: I18N.global.tc(props.body || 'prompt.default'),
        actions: [
          {
            name: 'cancel',
            title: I18N.global.tc('action.cancel'),
            variant: 'danger',
          },
          {
            name: 'confirm',
            title: I18N.global.tc('action.confirm'),
            variant: 'normal',
          },
        ]
      })

      if( answer.name === 'confirm' ) {
        const { action, params } = props
        return action(params)
      }
    },

    useProperties(properties: Array<keyof typeof store['properties']>) {
      return properties.reduce((a, property) => {
        if( !(property in store.properties) ) {
          return a
        }

        return {
          ...a,
          [property]: store.properties[property]
        }

      }, {})
    },

    usePropertiesExcept(properties: Array<keyof typeof store['properties']>) {
      return Object.fromEntries(Object.entries(store.properties)
        .filter(([key]) => !properties.includes(key as Lowercase<string>)))
    },

    formatValue(args: {
      value: string|object|Array<object>,
      key: Lowercase<string>,
      form?: boolean,
      property: CollectionProperty,
      index?: string
    }) {
      const value = args.property.s$translate
        ? I18N.global.tc(args.value||'')
        : args.value

      if( args.key in store.transformers ) {
        return store.transformers[args.key](value)
      }

      if( args.property?.s$isReference ) {
        const index = args.index || args.property.s$indexes?.[0]

        const helperStore = useStore(args.property.s$referencedCollection!)
        const property = helperStore.description.properties![index!]

        if( property?.s$isReference ) {
          return helperStore.formatValue({
            property,
            key: args.key,
            index,
            value: Array.isArray(args.value)
              ? args.value.map((value) => value[index!])
              : (args.value as Record<string, any>)?.[index!]
          })
        }
      }

      return formatValue(
        value,
        args.key,
        args.property,
        args.index
      )
    },

    select(properties: keyof typeof store['properties'], item: typeof store['items']) {
      return Object.entries(item || store.item).reduce((a, [key, value]) => {
        if( !properties.includes(key) ) {
          return a
        }

        return {
          ...a,
          [key]: value
        }
      }, {})
    },

    selectManyItems(items: typeof store['items'], value?: boolean) {
      if( value ) {
        store.selected = items
      }

      return items
    },

    selectAllItems(state?: boolean) {
      store.selected = state
        ? store.items.map((item) => item._id!)
        : []
      
      return store.items
    },
  }

  return actions
}
