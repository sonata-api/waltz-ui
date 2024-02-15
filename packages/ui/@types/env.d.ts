declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    instanceVars: typeof import('waltz-build').InstanceConfig['site']
    currentUser: {
      _id: string
      name: string
    }
    formatDateTime: typeof import('@sonata-api/common').formatDateTime
  }
}

export {}
