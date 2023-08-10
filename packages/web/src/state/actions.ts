import { formatValue, deepClone } from '@sonata-api/common'

import { useHttp } from '../http'
import type { Actions, Mutations, Item } from './actions.types'
import { useStore } from './use'
import { condenseItem } from './helpers'
import useMetaStore from '../stores/meta'

const { http, unproxiedHttp } = useHttp()

const mutations: Mutations = {
  setItem(item) {
    Object.assign(this.item, deepClone(this.freshItem))
    Object.entries(item).forEach(([key, value]) => {
      this.item[key] = value
    })

    this.referenceItem = deepClone({
      ...this.freshItem,
      ...item
    })

    return item
  },

  setItems(items) {
    this.items = items
    return items
  },

  insertItem(_item, merge) {
    const old = merge
      ? Object.assign({}, this.item)
      : {}

    const item = Object.assign(old, _item)
    this.setItem(item)

    const found = this.items.find(({ _id }) => _id === item._id)
    if( found ) {
      Object.assign(found, item)
      return item
    }

    this.items = [
      item,
      ...this.items
    ]

    return item
  },

  removeItem(subject) {
    this.items = this.items.filter(({ _id }) => {
      if( Array.isArray(subject) ) {
        return !subject.find(sub => sub._id === _id)
      }

      return subject._id !== _id
    })
    if( this.item._id === subject._id ) {
      this.item._id = null
    }

    return subject
  },

  clearItem() {
    Object.keys(this.item).forEach((key) => {
      delete this.item[key]
    })

    return this.setItem({})
  },

  clearItems() {
    this.items = []
  },
}

const actionsAndMutations: Actions & Mutations = {
  ...mutations,

  $functions() {
    return new Proxy(this, {
      get: (target, verb: string) => {
        return async (...args: any[]) => target.custom(verb, ...args)
      }
    })
  },

  errorPopup(e) {
    if( !e.validation ) {
      return
    }

    const formattedErrors = Object.entries(e.validation)
      .map(([key, value]: [string, any]) => `- ${key}: ${value.type}`)
      .join('\n')

    return useMetaStore().spawnModal({
      title: 'Erro',
      body: `There were some problems with your submission:\n${formattedErrors}`
    })
  },

  async custom(verb,  payload?, options?) {
    this.validationErrors = {}
    if( !options?.skipLoading ) {
      this.loading[verb || ''] = true
    }

    const method = options?.method || 'POST'
    const route = verb
      ? `${this.$id}/${verb}`
      : this.$id

    const requester = options?.unproxied
      ? unproxiedHttp
      : http

    const promise = requester(route, payload, {
      method,
      headers: {
        'content-type': 'application/json'
      }
    })
      .catch((err: any) => {
        if( err.validation ) {
          this.validationErrors = err.validation
        }

        throw err
      })
      .finally(() => {
        if( !options?.skipLoading ) {
        this.loading[verb || ''] = false
        }
      })

    const data = (await promise)?.data
    if( options?.insert ) {
      this.insertItem(data.result)
    }

    return data
  },

  async customEffect(verb, payload, fn, options?) {
    const { result: response } = await this.custom(verb, payload, options)
    if( options?.skipEffect ) {
      return response
    }

    return response
      ? fn(response)
      : {}
  },

  async $customEffect(verb, payload, fn, options?) {
    const response = await this.custom(verb, payload, options)

    return fn(response)
  },

  count(payload) {
    return this.custom('count', payload)
  },

  async get(payloadSource, options?) {
    const payload = typeof payloadSource === 'string'
      ? { filters: { _id: payloadSource } }
      : payloadSource

    return this.customEffect(
      'get', payload,
      this.setItem,
      options
    )
  },

  getAll(_payload, options?)  {
    const payload = Object.assign({}, _payload)

    if( typeof payload.limit !== 'number' ) {
      payload.limit = this.pagination.limit
    }

    if( typeof payload.offset !== 'number' ) {
      payload.offset = this.pagination.offset
    }

    return this.$customEffect(
      'getAll', payload,
      ({ result, pagination }) => {
        this.$patch({
          items: result,
          pagination
        })

        return result
      }, options
    )
  },

  insert(payload?, options?) {
    return this.customEffect(
      null, { ...payload, what: payload?.what||this.item },
      this.insertItem,
      options
    )
  },

  async deepInsert(payload?, options?) {
    const inlineReferences = this.inlineReferences
    const newItem = Object.assign({}, payload?.what || this.diffedItem) as Item

    for( const [k, { s$referencedCollection: collection, type }] of inlineReferences ) {
      if(
        newItem[k]
        && typeof newItem[k] === 'object'
        && Object.keys(newItem[k]).length > 0
      ) {
        const helperStore = useStore(collection!)

        const getInsertedId = async (subject: any) => {
          if( type === 'array' && Array.isArray(subject) ) {
            const ids = []
            for( const item of subject ) {
              const result = await helperStore.deepInsert({ what: item })
              ids.push(result._id)
            }

            return ids
          }

          const result = await helperStore.deepInsert({
            what: subject
          })

          return result?._id
        }

        newItem[k] = await getInsertedId(newItem[k])
      }
    }

    return this.insert({
      what: condenseItem(newItem)
    }, options)
  },

  async remove(payload, options?) {
    return this.customEffect(
      'remove', {
        filters: {
          _id: payload.filters?._id || payload._id
        }
      },
      this.removeItem,
      options
    )
  },

  async removeAll(payload, options?) {
    return this.customEffect(
      'removeAll', {
        filters: {
          _id: payload.filters?._id || payload._id
        }
      },
      this.removeItem,
      options
    )
  },

  filter(props?, options?) {
    this.activeFilters = props?.filters || this.$filters

    return this.getAll({
      filters: {
        ...this.activeFilters,
        ...this.filtersPreset
      },
      limit: this.pagination.limit,
      ...props||{}
    }, options)
  },

  updateItems() {
    return this.filter()
  },

  clearFilters() {
    const filters = this.filters = deepClone(this.freshFilters)
    this.pagination.offset = 0

    return filters
  },

  async ask(props) {
    const answer = await useMetaStore().spawnPrompt({
      body: I18N.global.tc(props.body || 'prompt.default'),
      actions: [
        {
          name: 'cancel',
          title: I18N.global.tc('action.cancel'),
          variant: 'transparent',
          size: 'small'
        },
        {
          name: 'confirm',
          title: I18N.global.tc('action.confirm'),
        },
      ]
    })

    if( answer.name === 'confirm' ) {
      const { action, params } = props
      return action(params)
    }
  },

  useProperties(properties) {
    return properties.reduce((a, property) => {
      if( !(property in this.properties) ) {
        return a
      }

      return {
        ...a,
        [property]: this.properties[property]
      }

    }, {})
  },

  usePropertiesExcept(properties) {
    return Object.fromEntries(Object.entries(this.properties)
      .filter(([key]: [string, unknown]) => !properties.includes(key)))
  },

  formatValue(args) {
    const value = args.property.s$translate
      ? I18N.global.tc(args.value||'')
      : args.value

    if( args.key in this.transformers ) {
      return this.transformers[args.key](value)
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

  select(properties, item) {
    return Object.entries(item || this.item).reduce((a, [key, value]) => {
      if( !properties.includes(key) ) {
        return a
      }

      return {
        ...a,
        [key]: value
      }
    }, {})
  },

  selectManyItems(items, value) {
    if( value ) {
      this.selected = items
    }

    return items
  },

  selectAllItems(value) {
    this.selected = value
      ? this.items.map((item) => item._id)
      : []
    
    return this.items
  }
}

export default actionsAndMutations
