import type { Description } from '@sonata-api/types'
import { registerStore } from '@waltz-ui/state-management'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { reactive, computed } from 'vue'
import { createCollectionStore } from '../state/collection'
import { STORAGE_NAMESPACE } from '../constants'
import { meta } from '.'

type User = {
  _id: string
  name: string
  roles: string[]
}

type AuthResult = {
  token: {
    type: 'bearer'
    content: string
  }
  user: User
}

type Credentials = {
  email: string
  password: string
}

export const user = () => registerStore(() => {
  const state = reactive({
    currentUser: {} as Partial<User>,
    credentials: {
      email: '',
      password: ''
    },
    description: {} as Omit<Description, 'properties'> & {
      properties: {
        roles: {
          items: {
            enum: string[]
          }
        }
      }
    }
  })

  const $currentUser = computed(() => {
    if( !('_id' in state.currentUser) ) {
      const auth = localStorage.getItem(`${STORAGE_NAMESPACE}:auth`)
      if( auth ) {
        setCurrentUser(JSON.parse(auth))
      }
    }

    return state.currentUser
  })

  function setCurrentUser(auth: AuthResult | {}) {
    for( const key in state.currentUser ) {
      delete state.currentUser[key as keyof typeof state.currentUser]
    }

    if( 'user' in auth ) {
      Object.assign(state.currentUser, auth.user)
    }

    localStorage.setItem(`${STORAGE_NAMESPACE}:auth`, JSON.stringify(auth))
  }

  function signout() {
    localStorage.removeItem(`${STORAGE_NAMESPACE}:auth`)
    setCurrentUser({})
  }

  return createCollectionStore<User>()({
    $id: 'user',
    state,
    getters: (state) => ({
      $currentUser,
      properties: computed(() => {
        const metaStore = meta()()
        const properties = state.description.properties!
        if( !properties ) {
          return {}
        }

        properties.roles.items.enum = metaStore.roles
        return properties
      }),
      signedIn: computed(() => !!$currentUser.value.roles?.length)
    }),
    actions: (state) => ({
      setCurrentUser,
      signout,

      async authenticate(this: any, payload: Credentials | { revalidate: true }) {
        const metaStore = meta()()

        try {
          const resultEither = await this.$functions.authenticate(payload)
          if( isLeft(resultEither) ) {
            const error = unwrapEither(resultEither)
            metaStore.$actions.spawnModal({
              title: 'Erro!',
              body: error as string
            })

            return left(error)
          }

          const auth = unwrapEither(resultEither) as any

          state.credentials = {
            email: '',
            password: ''
          }

          setCurrentUser(auth)
          await metaStore.$actions.describe({
            roles: true
          })

          return right('ok')

        } catch( err ) {
          signout()
          console.trace(err)

          return left(err)
        }
      },
    }),
  })

})
