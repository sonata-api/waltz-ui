<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@waltz-ui/state-management'

import AeriaPanel from '../../../../components/aeria-panel/aeria-panel.vue'
import AeriaForm from '../../../../components/form/aeria-form/aeria-form.vue'
import AeriaButton from '../../../../components/aeria-button/aeria-button.vue'
import AeriaPicture from '../../../../components/aeria-picture/aeria-picture.vue'
import AeriaIcon from '../../../../components/aeria-icon/aeria-icon.vue'
import AeriaMenu from '../../../../components/aeria-menu/aeria-menu.vue'

const userStore = useStore('user')
const metaStore = useStore('meta')

const editPanel = ref(false)

userStore.$actions.setItem(userStore.$currentUser)

const insert = async () => {
  await userStore.$actions.insert({ what: userStore.item })
  localStorage.setItem('auth:currentUser', JSON.stringify(userStore.item))

  await metaStore.$actions.spawnModal({
    title: 'Feito!',
    body: 'Suas informações foram salvas'
  })

  editPanel.value = false
}

const signout = async () => {
  await userStore.$actions.signout()
  const router = ROUTER
  router.push('/user/signin')
}
</script>

<template>
  <aeria-picture
    v-bind="{
      width: '14rem',
      height: '14rem'
    }"

    bordered
    :file-id="userStore.item.picture && typeof userStore.item.picture === 'object'
      ? userStore.item.picture._id
      : userStore.item.picture"
    style="
      display: flex;
      flex-direction: column;
      align-items: center;
    "
  >
    <template #caption>
      <div class="profile__user-name">
        {{ userStore.item.full_name }}
      </div>
    </template>
  </aeria-picture>

  <slot
    v-if="$slots['user-profile']"
    name="user-profile"
  ></slot>

  <aeria-menu>
    <template #edit-profile>
      <aeria-icon
        v-clickable
        icon="edit"
        @click="editPanel = true"
      >
        Editar perfil
      </aeria-icon>
    </template>

    <template #change-password>
      <aeria-icon
        v-clickable
        icon="key-skeleton"
        @click="$router.push('/dashboard/user/changepass')"
      >
        Mudar senha
      </aeria-icon>
    </template>

    <template #signout>
      <aeria-icon
        v-clickable
        icon="signout"
        @click="signout"
      >
        Sair
      </aeria-icon>
    </template>

  </aeria-menu>

  <aeria-panel
    float
    close-hint
    title="Editar perfil"
    v-model="editPanel"
    @overlay-click="editPanel = false"
  >
    <aeria-form
      v-model="userStore.item"
      v-bind="{
        collection: 'user',
        form: userStore.$actions.useProperties([
          'full_name',
          'email',
          'phone',
          'picture'
        ]),
        layout: userStore.formLayout
      }"
    ></aeria-form>

    <template #footer>
      <aeria-button
        large
        :loading="userStore.loading.insert"
        @click="insert"
      >
        Salvar
      </aeria-button>
    </template>
  </aeria-panel>
</template>

<style scoped src="./profile.less"></style>
