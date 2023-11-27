declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    instanceVars: typeof import('waltz-build').InstanceConfig['site']
    currentUser: typeof import('@sonata-api/system/collections').User
    formatDateTime: typeof import('@sonata-api/common').formatDateTime
  }
}

export {}
