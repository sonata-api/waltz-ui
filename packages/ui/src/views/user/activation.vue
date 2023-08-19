<script setup lang="ts">
import { useRouter } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'
import { unsafe } from '@sonata-api/common'
import { ref } from 'vue'

import WForm from '../../components/form/w-form/w-form.vue'
import WButton from '../../components/w-button/w-button.vue'
import WPasswordForm from '../../components/dashboard/w-password-form/w-password-form.vue'

type Step = 
  | 'success'
  | 'password'

const router = await useRouter()
const userStore = useStore('user')
const metaStore = useStore('meta')

const step: Step = router.currentRoute.value.query.step || 'success'
const userId = router.currentRoute.value.query.u
const token = router.currentRoute.value.query.t

const userInfo: any = unsafe(await userStore.functions.getInfo({
  userId,
  token
}))

const password = ref({
  full_name: userInfo.full_name,
  email: userInfo.email,
  password: '',
  confirmation: ''
})

const confirm = async () => {
  await userStore.custom(`activate?u=${userId}&t=${token}`, {
    password: password.value.password
  })

  userStore.credentials.email = password.value.email

  await metaStore.spawnModal({
    title: 'Sucesso!',
    body: 'Sua conta foi ativada com sucesso. Experimente fazer login com o seu email e senha.'
  })

  router.push('/user/signin')
}
</script>

<template>
  <div v-if="step === 'password'" style="display: grid; gap: 1rem;">
    <h1>Cadastre uma senha</h1>
    <w-form
      v-model="password"
      :form="{
        full_name: {
          type: 'string',
          readOnly: true
        },
        email: {
          type: 'string',
          readOnly: true
        },
      }"
    ></w-form>

    <w-password-form v-model="password" v-slot="{ passwordError }">
      <w-button
        :disabled="!!passwordError"
        @click="confirm"
      >
        Cadastrar senha
      </w-button>
    </w-password-form>
  </div>

  <div v-else style="display: grid; gap: 1rem;">
    <h1>Conta ativada com sucesso!</h1>

    <w-button @click="router.push('/user/signin')">
      Ir para a página de login
    </w-button>
  </div>
</template>
