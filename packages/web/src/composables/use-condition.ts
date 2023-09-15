import type { Condition, Description } from '@sonata-api/types'

export const useCondition = <TDescription extends Description=any>(subject: any, condition: Condition<TDescription>) => {
  const {
    operator,
    term2
  } = condition

  const result = {
    satisfied: false,
    else: null
  }

  const term1 = subject[condition.term1] || null

  const satisfied = result.satisfied = (() => {
    switch( operator ) {
      case 'equal': return term1 === term2
      case 'unequal': return term1 !== term2
      case 'in': return term2.includes(term1)
      case 'notin': return !term2.includes(term1)
      default: return false;
    }
  })()

  if( !satisfied ) {
    result.else  = condition.else
  }

  return result
}
