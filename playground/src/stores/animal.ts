import { registerStore, useCollectionStore } from 'waltz-ui'
import { reactive, computed } from 'vue'

export const registerAnimalStore = () => registerStore(() => {
  const state = reactive({
    num: 0,
    specie: '',
    deep: {
      dog: {
        name: 'thor',
      }
    }
  })

  return useCollectionStore()({
    $id: 'animal',
    state,
    getters: (state) => ({
      computedName: computed(() => `doguinho: ${state.deep.dog.name}`)
    }),
    actions: (state) => ({
      inc() {
        state.num += 1
      },
      bobby() {
        state.deep.dog.name = 'thor bobby'
      }
    })
  })
})

