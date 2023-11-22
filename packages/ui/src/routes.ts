import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export const userRoutes = (component: Component | (() => Promise<Component>)): RouteRecordRaw => ({
  path: '/user',
  name: '/user',
  component,
  children: [
    {
      path: 'invite/:id',
      redirect: (to) => {
        return {
          path: '/user/signup',
          params: {
            inviteId: to.params.id
          }
        }
      }
    },
    {
      path: 'signin',
      component: () => import('./views/user/signin.vue'),
      meta: {
        title: 'Autenticação'
      }
    },
    {
      path: 'signup',
      component: () => import('./views/user/signup.vue'),
      meta: {
        title: 'Registro'
      }
    },
    {
      path: 'activation',
      component: () => import('./views/user/activation.vue'),
      meta: {
        title: 'Ativação'
      }
    },
  ]
})

export const dashboardRoutes = (component: Component | (() => Promise<Component>)): RouteRecordRaw => ({
  path: '/dashboard',
  name: 'dashboard',
  component,
  redirect: {
    name: '/dashboard/'
  },
  meta: {
    title: 'Dashboard'
  },
  children: [
    {
      path: 'c/:collection?',
      name: 'dashboard-crud',
      props: true,
      components: {
        default: () => import('./views/dashboard/crud-view/crud-view.vue'),
        topbar: () => import('./components/dashboard/aeria-crud-topbar/aeria-crud-topbar.vue')
      },
      meta: {
        title: '%viewTitle%',
      }
    },
    {
      path: 'user',
      name: 'dashboard-user-group',
      meta: {
        title: 'user'
      },
      redirect: {
        name: 'dashboard-user'
      },
      children: [
        {
          path: 'profile',
          name: '/dashboard/user/profile',
          component: () => import('./views/dashboard/user/profile/profile.vue'),
          meta: {
            title: 'Meu perfil',
            icon: 'user-square'
          }
        },
        {
          path: 'changepass',
          name: '/dashboard/user/changepass',
          component: () => import('./views/dashboard/user/password-change/password-change.vue'),
          meta: {
            title: 'Mudar senha',
            icon: 'lock'
          }
        }
      ]
    }
  ]
})
