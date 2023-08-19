import type { User } from '@sonata-api/system'
import { registerStore } from '@waltz-ui/state-management'
import { left, right, isLeft, unwrapEither } from '@sonata-api/common'
import { useCollectionStore } from '../state/collection'
import { useMetaStore } from './meta'

type Credentials = {
  email: string
  password: string
}

type UserState = {
  token: string
  credentials: Credentials|object
  currentUser: Partial<User>
}

export const useUserStore = () => registerStore(() => useCollectionStore({
  $id: 'user'
  // state: (): UserState => ({
  //   token: '',
  //   currentUser: {},
  //   credentials: {
  //     email: '',
  //     password: ''
  //   }
  // }),
  // actions: {
  //   async authenticate(payload: Credentials | { revalidate: true }) {
  //     const metaStore = useMetaStore()

  //     try {
  //       const resultEither = await this.functions.authenticate(payload)
  //       if( isLeft(resultEither) ) {
  //         const error = unwrapEither(resultEither)
  //         metaStore.spawnModal({
  //           title: 'Erro!',
  //           body: error as string
  //         })

  //         return left(error)
  //       }

  //       const {
  //         user,
  //         token: _token

  //       } = unwrapEither(resultEither) as any

  //       this.credentials = {}

  //       const {
  //         type: _tokenType,
  //         token
  //       } = _token

  //       this.setCurrentUser(user)
  //       userStorage.setItem('auth:token', token)

  //       await metaStore.describe({
  //         roles: true
  //       })

  //       return right('ok')

  //     } catch( err ) {
  //       this.signout()
  //       console.trace(err)

  //       return left(err)
  //     }
  //   },

  //   setCurrentUser(user: User) {
  //     this.currentUser = user
  //     userStorage.setItem('auth:currentUser', JSON.stringify(this.currentUser))
  //   },

  //   signout() {
  //     userStorage.removeItem('auth:token')
  //     userStorage.removeItem('auth:currentUser')
  //     this.currentUser = {}
  //   }
  // },
  // getters: {
  //   properties() {
  //     const metaStore = useMetaStore()
  //     const properties = this.description.properties!
  //     properties.roles.items.enum = Object.keys(metaStore.roles)

  //     return properties
  //   },
  //   $currentUser(): User {
  //     if( !this.currentUser?._id ) {
  //       this.token = userStorage.getItem('auth:token')
  //       this.currentUser = JSON.parse(userStorage.getItem('auth:currentUser')||'{}')
  //     }

  //     return this.currentUser
  //   },
  //   signedIn() {
  //     return !!this.$currentUser.roles
  //   }
  // }
}))
