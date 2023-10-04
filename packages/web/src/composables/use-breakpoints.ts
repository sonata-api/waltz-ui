import { ref, computed } from 'vue'

const widthMatches = (size: string) => window.matchMedia(`(min-width: ${size})`).matches

const viewport = ref({
  width: window.innerWidth,
  height: window.innerHeight,
})

const breakpoints = computed(() => ({
  width: viewport.value.width,
  height: viewport.value.height,
  md: widthMatches('768px'),
  lg: widthMatches('1024px'),
  xl: widthMatches('1280px'),
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
