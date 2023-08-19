import type { CollectionStoreActions } from '../state/actions'
import { registerStore } from '@waltz-ui/state-management'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { ref, reactive, computed } from 'vue'
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
  const token = ref('')
  const credentials = ref({
    email: '',
    password: ''
  })

  const currentUser = reactive({} as Partial<User> & {
    pinged?: boolean
  })

  const properties = computed(function(this: any) {
    const metaStore = useMetaStore()
    const properties = this.description.properties!
    properties.roles.items.enum = Object.keys(metaStore.roles)

    return properties

  })

  const $currentUser = computed(() => {
    if( !currentUser._id ) {
      token.value = userStorage.getItem('auth:token')!
      setCurrentUser(JSON.parse(userStorage.getItem('auth:currentUser')||'{}'))
    }

    return currentUser
  })

  const signedIn = computed(() => $currentUser.value.roles)

  function setCurrentUser(user: User | {}) {
    for( const key in currentUser ) {
      delete currentUser[key as keyof typeof currentUser]
    }
    Object.assign(currentUser, user)
    userStorage.setItem('auth:currentUser', JSON.stringify(currentUser))
  }

  function signout() {
    userStorage.removeItem('auth:token')
    userStorage.removeItem('auth:currentUser')
    setCurrentUser({})
  }

  return useCollectionStore<User>()({
    $id: 'user',
    state: {
      token: '',
      currentUser,
      $currentUser,
      signedIn,

      credentials,
      properties
    },
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

          credentials.value = {
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
