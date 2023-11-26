/// <reference types="vue/macros-global" />

/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    instanceVars: typeof import('waltz-build').InstanceConfig['site']
    currentUser: typeof import('@sonata-api/system/collections').User
    formatDateTime: typeof import('@sonata-api/common').formatDateTime
  }
}

export {}
