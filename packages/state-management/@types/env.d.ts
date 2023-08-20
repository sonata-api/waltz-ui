import type { Store } from '../src'

declare global {
  var STORES: Record<string, Store>
}
