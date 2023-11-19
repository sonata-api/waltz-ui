<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@waltz-ui/state-management'
import { isLeft, unwrapEither } from '@sonata-api/common'
import WForm from '../../components/form/w-form/w-form.vue'
import WIcon from '../../components/w-icon/w-icon.vue'
import WButton from '../../components/w-button/w-button.vue'
import WCheckbox from '../../components/form/w-checkbox/w-checkbox.vue'
import WPasswordForm from '../../components/dashboard/w-password-form/w-password-form.vue'

const router = ROUTER
const userStore = useStore('user')
const metaStore = useStore('meta')

if( !metaStore.descriptions.user ) {
  await metaStore.$actions.describe({
    collections: ['user'],
    roles: true
  })
}

const tosAccepted = ref(false)

const newUser = ref({})
const password = ref({
  password: '',
  confirmation: ''
})

const insert = async () => {
  userStore.item.password = password.value.password
  const userEither = await userStore.$functions.createAccount({
    ...newUser.value,
    password: password.value.password
  })

  if( isLeft(userEither) ) {
    const error = unwrapEither(userEither)
    await metaStore.$actions.spawnModal({
      title: 'Erro',
      body: error
    })
    return
  }

  await metaStore.$actions.spawnModal({
    title: 'Conta registrada',
    body: 'Verifique o link de confirmação no seu email'
  })

 router.push({ path: '/user/signin' })
}
</script>

<template>
  <div>
    <h1>Criar conta</h1>
    <w-icon
      v-clickable
      icon="arrow-left"
      @click="router.push({ path: '/user/signin' })"
    >
      Efetuar login
    </w-icon>
  </div>

  <w-form
    v-model="newUser"
    v-bind="{
      collection: 'user',
      form: userStore.$actions.useProperties([
        'full_name',
        'email',
        'phone'
      ])
    }"
  >
    <template #after>
      <w-password-form
        v-model="password"
        v-slot="{ passwordError }"
      >
        <div style="
          display: flex;
          flex-direction: column;
          align-items: start;
          gap: 2rem
        ">
          <w-checkbox
            v-model="tosAccepted"
            :property="{
              type: 'boolean',
              s$element: 'checkbox'
            }"
          >
            Declaro que li e aceito os termos de uso
          </w-checkbox>

        </div>

        <w-button
          :disabled="!!passwordError || !tosAccepted"
          @click.prevent="insert"
        >
          Criar conta
        </w-button>
      </w-password-form>
    </template>
  </w-form>


</template>
