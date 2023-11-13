import type { Condition, Description } from '@sonata-api/types'

const evaluatesToTrue = (subject: any, condition: Condition<any>): boolean => {
  const {
    operator,
    term2,
  } = condition

  const term1 = subject[condition.term1]

  let satisfied = false
  if( operator ) {
    satisfied = (() => {
      switch( operator ) {
        case 'equal': return term1 === term2
        case 'unequal': return term1 !== term2
        case 'in': return term2.includes(term1)
        case 'notin': return !term2.includes(term1)
        default: return false
      }
    })()
  }

  if( condition.and ) {
    satisfied = satisfied && condition.and.every((condition: any) => evaluatesToTrue(subject, condition))
  }

  if( condition.or ) {
    satisfied = satisfied || condition.or.some((condition: any) => evaluatesToTrue(subject, condition))
  }

  return satisfied
}

export const useCondition = <TDescription extends Description=any>(subject: any, condition: Condition<TDescription>) => {
  const result = {
    satisfied: false,
    else: null
  }

  const satisfied = result.satisfied = evaluatesToTrue(subject, condition)
  if( !satisfied ) {
    result.else = condition.else
  }

  return result
}
