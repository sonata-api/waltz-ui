<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '@waltz-ui/state-management'

import WBox from '../../../../components/w-box/w-box.vue'
import WForm from '../../../../components/form/w-form/w-form.vue'
import WButton from '../../../../components/w-button/w-button.vue'
import WPicture from '../../../../components/w-picture/w-picture.vue'
import WIcon from '../../../../components/w-icon/w-icon.vue'
import WMenu from '../../../../components/w-menu/w-menu.vue'

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
  <w-picture
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
  </w-picture>

  <slot
    v-if="$slots['user-profile']"
    name="user-profile"
  ></slot>

  <w-menu>
    <template #edit-profile>
      <w-icon
        v-clickable
        icon="edit"
        @click="editPanel = true"
      >
        Editar perfil
      </w-icon>
    </template>

    <template #change-password>
      <w-icon
        v-clickable
        icon="key-skeleton"
        @click="$router.push('/dashboard/user/changepass')"
      >
        Mudar senha
      </w-icon>
    </template>

    <template #signout>
      <w-icon
        v-clickable
        icon="signout"
        @click="signout"
      >
        Sair
      </w-icon>
    </template>

  </w-menu>

  <w-box
    float
    close-hint
    title="Editar perfil"
    v-model="editPanel"
    @overlay-click="editPanel = false"
  >
    <w-form
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
    ></w-form>

    <template #footer>
      <w-button
        large
        :loading="userStore.loading.insert"
        @click="insert"
      >
        Salvar
      </w-button>
    </template>
  </w-box>
</template>

<style scoped src="./profile.less"></style>
