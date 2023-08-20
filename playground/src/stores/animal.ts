import { registerStore, useCollectionStore } from 'waltz-ui'
import { reactive, computed } from 'vue'

export const registerAnimalStore = () => registerStore(() => {
  const initialState = reactive({
    num: 0,
    specie: '',
    deep: {
      dog: {
        name: 'thor',
      }
    }
  })

  const getters = {
    computedName: computed(() => `doguinho: ${initialState.deep.dog.name}`)
  }

  return useCollectionStore()({
    $id: 'animal',
    state: initialState,
    getters,
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

