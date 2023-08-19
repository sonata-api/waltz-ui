import type { CollectionStoreActions } from '../state/actions'
import { registerStore } from '@waltz-ui/state-management'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { reactive, computed } from 'vue'
import { useCollectionStore } from '../state/collection'
import { useMetaStore } from './meta'

type User = {
  _id: string
  full_name: string
  roles: Array<string>
}

type Credentials = {
  email: string
  password: string
}

export const useUserStore = () => registerStore(() => {
  const state = reactive({
    token: '',
    currentUser: {} as Partial<User> & {
      pinged?: boolean
    },
    credentials: {
      email: '',
      password: ''
    },
  })

  const $currentUser = computed(() => {
    if( !state.currentUser._id ) {
      state.token = userStorage.getItem('auth:token')!
      setCurrentUser(JSON.parse(userStorage.getItem('auth:currentUser')||'{}'))
    }

    return state.currentUser
  })

  const getters = {
    $currentUser,
    properties: computed(function(this: any) {
      const metaStore = useMetaStore()
      const properties = this.description.properties!
      properties.roles.items.enum = Object.keys(metaStore.roles)

      return properties
    }),
    signedIn: computed(() => !!$currentUser.value.roles?.length)
  }

  Object.assign(state, getters)

  function setCurrentUser(user: User | {}) {
    for( const key in state.currentUser ) {
      delete state.currentUser[key as keyof typeof state.currentUser]
    }
    Object.assign(state.currentUser, user)
    userStorage.setItem('auth:currentUser', JSON.stringify(state.currentUser))
  }

  function signout() {
    userStorage.removeItem('auth:token')
    userStorage.removeItem('auth:currentUser')
    setCurrentUser({})
  }

  return useCollectionStore<User>()({
    $id: 'user',
    state,
    getters,
    actions: {
      setCurrentUser,
      signout,

      async authenticate(this: CollectionStoreActions, payload: Credentials | { revalidate: true }) {
        const metaStore = useMetaStore()

        try {
          const resultEither = await this.functions.authenticate(payload)
          if( isLeft(resultEither) ) {
            const error = unwrapEither(resultEither)
            metaStore.actions.spawnModal({
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
          userStorage.setItem('auth:token', token)

          await metaStore.actions.describe({
            roles: true
          })

          return right('ok')

        } catch( err ) {
          signout()
          console.trace(err)

          return left(err)
        }
      },
    },
  })

})
