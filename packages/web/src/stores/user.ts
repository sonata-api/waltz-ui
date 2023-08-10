import { defineStore } from 'pinia'
import type { User } from '@sonata-api/system'
import { useCollection } from '../state/collection'
import useMetaStore from './meta'

type Credentials = {
  email: string
  password: string
}

type UserState = {
  token: string
  credentials: Credentials|object
  currentUser: Partial<User>
}

const collection = useCollection({
  state: (): UserState => ({
    token: '',
    currentUser: {},
    credentials: {
      email: '',
      password: ''
    }
  }),
  actions: {
    authenticate(payload: Credentials | { revalidate: true }) {
      try {
        return this.customEffect(
          'authenticate', payload,
          async ({ user, token: _token }: {
            user: User
            token: { 
              type: 'Bearer'
              token: string
            }
          }) => {
            this.credentials = {}
            this.currentUser = user

            const {
              type: _tokenType,
              token
            } = _token

            userStorage.setItem('auth:token', token)
            userStorage.setItem('auth:currentUser', JSON.stringify(this.currentUser))

            const metaStore = useMetaStore()
            await metaStore.describe({
              roles: true
            })
          }
        )
      } catch( err ) {
        this.signout()
        throw err
      }
    },

    signout() {
      userStorage.clear()
      this.currentUser = {}
    }
  },
  getters: {
    properties() {
      const metaStore = useMetaStore()
      const properties = this.description.properties!
      properties.roles.items.enum = Object.keys(metaStore.roles)

      return properties
    },
    $currentUser(): User {
      if( !this.currentUser?._id ) {
        this.token = userStorage.getItem('auth:token')
        this.currentUser = JSON.parse(userStorage.getItem('auth:currentUser')||'{}')
      }

      return this.currentUser
    },
    signedIn() {
      return !!this.$currentUser.roles
    }
  }
})

export default defineStore('user', collection)
