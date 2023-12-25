import {
  capitalize,
  formatDateTime,
  getRelativeTimeFromNow,
  arraysIntersects
  
} from '@sonata-api/common'

import { useStore } from '@waltz-ui/state-management'
import { t } from '@waltz-ui/i18n'

const hasRoles = (roles: string | string[]) => {
  const userStore = useStore('user')
  return arraysIntersects(roles, userStore.$currentUser.roles)
}

export const templateFunctions = {
  capitalize,
  formatDateTime,
  getRelativeTimeFromNow,
  hasRoles,
  t
}

export type TemplateFunctions = typeof templateFunctions
