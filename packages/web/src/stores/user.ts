import type { Description } from '@sonata-api/types'
import { registerStore } from '@waltz-ui/state-management'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { reactive, computed } from 'vue'
import { createCollectionStore, type CollectionStore } from '../state/collection'
import { meta } from '.'

type User = {
  _id: string
  full_name: string
  roles: Array<string>
}

type Credentials = {
  email: string
  password: string
}

export const user = () => registerStore(() => {
  const state = reactive({
    token: '',
    currentUser: {} as Partial<User> & {
      pinged?: boolean
    },
    credentials: {
      email: '',
      password: ''
    },
    description: {} as Description & {
      properties: {
        roles: {
          items: {
            enum: Array<string>
          }
        }
      }
    }
  })

  const $currentUser = computed(() => {
    if( !state.currentUser._id ) {
      state.token = localStorage.getItem('auth:token')!
      setCurrentUser(JSON.parse(localStorage.getItem('auth:currentUser')||'{}'))
    }

    return state.currentUser
  })

  function setCurrentUser(user: User | {}) {
    for( const key in state.currentUser ) {
      delete state.currentUser[key as keyof typeof state.currentUser]
    }
    Object.assign(state.currentUser, user)
    localStorage.setItem('auth:currentUser', JSON.stringify(state.currentUser))
  }

  function signout() {
    localStorage.removeItem('auth:token')
    localStorage.removeItem('auth:currentUser')
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

        properties.roles.items.enum = Object.keys(metaStore.roles)
        return properties
      }),
      signedIn: computed(() => !!$currentUser.value.roles?.length)
    }),
    actions: (state) => ({
      setCurrentUser,
      signout,

      async authenticate(this: CollectionStore, payload: Credentials | { revalidate: true }) {
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

          const {
            user,
            token: _token

          } = unwrapEither(resultEither) as any

          state.credentials = {
            email: '',
            password: ''
          }

          const {
            type: _tokenType,
            token
          } = _token

          setCurrentUser(user)
          localStorage.setItem('auth:token', token)

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
