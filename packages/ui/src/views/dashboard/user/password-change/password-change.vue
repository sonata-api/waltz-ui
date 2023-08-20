<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '@waltz-ui/web'
import { useStore } from '@waltz-ui/state-management'

import WButton from '../../../../components/w-button/w-button.vue'
import WPasswordForm from '../../../../components/dashboard/w-password-form/w-password-form.vue'

const router = await useRouter()
const userStore = useStore('user')
const metaStore = useStore('meta')

const password = ref({
  password: '',
  confirmation: ''
})

const insert = async () => {
  await userStore.$actions.insert({
    what: {
      _id: userStore.item._id,
      password: password.value.password
    }
  })

  await metaStore.$actions.spawnModal({
    title: 'Feito!',
    body: 'A senha foi atualizada'
  })

  router.back()
}
</script>

<template>
  <div style="
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 30rem;
  ">
    <w-password-form v-model="password" v-slot="{ passwordError }">
      <w-button
        class="passchange__save-button"
        :disabled="!!passwordError"
        @click="insert"
      >
        Salvar
      </w-button>
    </w-password-form>
  </div>
</template>
