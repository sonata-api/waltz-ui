import {
  capitalize,
  formatDateTime,
  formatToString,
  daysAgo,
  getRelativeTimeFromNow
  
} from '@sonata-api/common'

export const templateFunctions = {
  capitalize,
  formatDateTime,
  formatToString,
  daysAgo,
  getRelativeTimeFromNow
}

export type TemplateFunctions = typeof templateFunctions
