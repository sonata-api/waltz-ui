import { createApp } from 'vue'
import { animal as registerAnimalStore } from './stores'
import Main from './main.vue'

registerAnimalStore()

const app = createApp(Main)
app.mount('#app')

type UserStores = typeof import('./stores')
type Stores = {
  [P in keyof UserStores]: ReturnType<ReturnType<UserStores[P]>>
}

declare const useStore: <TStoreId extends keyof Stores>(storeId: TStoreId) => Stores[TStoreId]

useStore('animal')
