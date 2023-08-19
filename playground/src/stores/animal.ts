import { registerStore, useCollectionStore } from 'waltz-ui'

export const registerAnimalStore = () => registerStore(() => useCollectionStore({
  $id: 'animal',
  specie: ''
}))

