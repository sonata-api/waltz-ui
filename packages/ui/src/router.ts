import { RouteRecordRaw } from 'vue-router'

const getUserComponent = async (name: `/${string}`) => {
  const target = ROUTER.getRoutes().find(route => route.name === name)?.components?.default
  const component = target instanceof Function
    ? await (<Function>target)()
    : target

  return component
}

const publicRoutes: Array<RouteRecordRaw> = [
  {
    path: '/user',
    name: '/user',
    component: () => getUserComponent('/auth-wall'),
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
        name: '/user/signin',
        component: () => import('./views/user/signin.vue'),
        meta: {
          title: 'Autenticação'
        }
      },
      {
        path: 'signup',
        name: '/user/signup',
        component: () => import('./views/user/signup.vue'),
        meta: {
          title: 'Registro'
        }
      },
      {
        path: 'activation',
        name: '/user/activation',
        component: () => import('./views/user/activation.vue'),
        meta: {
          title: 'Ativação'
        }
      },
    ]
  },
]

const privateRoutes: Array<RouteRecordRaw> = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => getUserComponent('/dashboard'),
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
          topbar: () => import('./components/dashboard/w-crud-topbar/w-crud-topbar.vue')
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
            path: '/dashboard/user/profile',
            name: 'dashboard-user-profile',
            component: () => import('./views/dashboard/user/profile/profile.vue'),
            meta: {
              title: 'Meu perfil',
              icon: 'user-square'
            }
          },
          {
            path: '/dashboard/user/changepass',
            name: 'dashboard-user-changepass',
            component: () => import('./views/dashboard/user/password-change/password-change.vue'),
            meta: {
              title: 'Mudar senha',
              icon: 'lock'
            }
          }
        ]
      }
    ]
  }
]

export default [
  ...publicRoutes,
  ...privateRoutes
]
