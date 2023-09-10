import { reactive, computed } from 'vue'

const widthMatches = (px: string) => window.matchMedia(`(min-width: ${px}px)`).matches

export const useBreakpoints = () => {
  const breakpoints = reactive({
    md: computed(() => widthMatches('600'))
  })

  return breakpoints
}
