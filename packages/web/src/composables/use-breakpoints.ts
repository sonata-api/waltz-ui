import { ref, computed } from 'vue'

const widthMatches = (px: string) => window.matchMedia(`(min-width: ${px}px)`).matches

const viewport = ref({
  width: window.innerWidth,
  height: window.innerHeight,
})

const breakpoints = computed(() => ({
  width: viewport.value.width,
  height: viewport.value.height,
  md: widthMatches('600'),
  xl: widthMatches('1400'),
}))

let __listenerAttached = false

export const useBreakpoints = () => {
  if( !__listenerAttached ) {
    window.addEventListener('resize', () => {
      viewport.value.width = window.innerWidth
      viewport.value.height = window.innerHeight
    })

    __listenerAttached = true
  }

  return breakpoints
}
