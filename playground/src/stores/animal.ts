import { registerStore, useCollectionStore } from 'waltz-ui'
import { reactive, computed, type ComputedRef } from 'vue'

export const registerAnimalStore = () => registerStore(() => {
  const state = reactive({
    num: 0,
    specie: '',
    deep: {
      dog: {
        name: 'thor',
        computedName: {} as ComputedRef<ComputedRef<string>>
      }
    }
  })

  state.deep.dog.computedName = computed(() => `doguinho: ${state.deep.dog.name}`)

  return useCollectionStore()({
    $id: 'animal',
    state,
    actions: {
      inc() {
        state.num += 1
      },
      bobby() {
        state.deep.dog.name = 'thor bobby'
      }
    }
  })
})

