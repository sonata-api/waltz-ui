import type { CollectionProperty } from '@sonata-api/types'
import type { CollectionStore, CollectionState } from '..//types/state'

type CrudParameters = {
  filters: Record<string, any>
  limit: number
  offset: number
  project?: string[]|Record<string, 1|-1>
}

type ActionFilter = Partial<CrudParameters>

type ActionOptions = {
  method?:
    'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
  unproxied?: boolean
  skipLoading?: boolean
  skipEffect?: boolean
  fullResponse?: boolean
  insert?: boolean
}

export type Item = Record<string, any> & {
  _id?: string
}

type ItemId = Pick<Item, '_id'>

interface ActionsAux {
  $functions: (payload: any, options?: ActionOptions) => Actions & Record<string, any>
  errorPopup(e: any): Promise<any>|void
  custom(verb: string|null, payload?: any, options?: ActionOptions): Promise<any>
  customEffect(verb: string|null, payload: any, fn: (payload: any) => any, options?: ActionOptions): Promise<any>
  $customEffect(verb: string|null, payload: any, fn: (payload: any) => any, options?: ActionOptions): Promise<any>

  count(payload?: { filters: Record<string, any> }): Promise<number>
  get(payload: ActionFilter|string, options?: ActionOptions): Promise<any>
  getAll(payload: ActionFilter, options?: ActionOptions): Promise<any>
  insert(payload?: { what: Item }, options?: ActionOptions): Promise<Item>
  deepInsert(payload?: { what: Item }, options?: ActionOptions): Promise<Item>
  remove(payload: { filters?: Record<string, any>, _id?: ItemId }, options?: ActionOptions): Promise<Item>
  removeAll(payload: { filters?: Record<string, any>, _id?: ItemId }, options?: ActionOptions): Promise<Item>
  filter(props?: ActionFilter, options?: ActionOptions): Promise<any>
  updateItems(): Promise<any>
  clearFilters(): CollectionState<any>['freshFilters']
  ask(props: {
    action: (params: any) => unknown,
    params: any
    title?: string
    body?: string
  }): Promise<any>

  useProperties(properties: Array<string>): Record<string, CollectionProperty>
  usePropertiesExcept(properties: Array<string>): Record<string, CollectionProperty>
  formatValue(args: {
      value: string|object|Array<object>,
      key: string,
      form?: boolean,
      property: CollectionProperty,
      index?: string
    }
  ): string

  select(properties: Array<string>, item?: Record<string, any>): Record<string, any>
  selectManyItems(items: Array<Item>, value?: boolean): Array<Item>
  selectAllItems(value?: boolean): Array<Item>
}

interface MutationsAux {
  setItem(item: Item): Item
  setItems(items: Array<any>): Array<any>
  insertItem(item: Item, merge?: boolean): Item
  removeItem(item: Item): Item
  clearItem(): Item
  clearItems(): void
}

export type StatefulFunction<
  T extends (...args: any) => any,
  This=CollectionStore
> = (this: This & ActionsAux & MutationsAux, ...args: Parameters<T>) => ReturnType<T>

export type Actions = { [P in keyof ActionsAux]: StatefulFunction<ActionsAux[P]> }
export type Mutations = { [P in keyof MutationsAux]: StatefulFunction<MutationsAux[P]> }
