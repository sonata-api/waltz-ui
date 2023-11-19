<script setup lang="ts">
import { user, meta } from '@waltz-ui/web'
import { isRight } from '@sonata-api/common'
import AeriaForm from '../../components/form/aeria-form/aeria-form.vue'
import AeriaButton from '../../components/aeria-button/aeria-button.vue'

const router = ROUTER
const userStore = user()()
const metaStore = meta()()

localStorage.clear()

const authenticate = async () => {
  const resultEither = await userStore.$actions.authenticate(userStore.credentials)
  if( isRight(resultEither) ) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div style="text-align: center">
    <h1
      v-if="instanceVars.signinText"
      v-html="instanceVars.signinText"
      style="font-size: 2.4rem; margin-bottom: .8rem"
    ></h1>
    <div
      v-if="instanceVars.signupForm"
    >
      <span>Não possui uma conta?</span>
      <span 
        v-clickable
        style="color: #2d96fa"
        @click="router.push('/user/signup')"
      >
        Criar uma conta
      </span>
    </div>
  </div>

  <aeria-form
    v-model="userStore.credentials"
    :form="{
      email: {
        type: 'string',
        s$icon: 'user',
      },
      password: {
        type: 'string',
        s$icon: 'key-skeleton',
        s$inputType: 'password'
      }
    }"
  ></aeria-form>

  <div style="
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  ">
    <aeria-button
      :loading="userStore.loading.authenticate"

      :disabled="
        !userStore.credentials.email
        || !userStore.credentials.password"
      @click="authenticate"
    >
      Entrar
    </aeria-button>

    <aeria-button
      v-if="userStore.$currentUser._id && !metaStore.isLoading"
      :disabled="userStore.loading.authenticate || metaStore.isLoading"
      @click="router.push('/dashboard')"
    >
      Continuar como {{ userStore.$currentUser.first_name }}
    </aeria-button>
  </div>
</template>
