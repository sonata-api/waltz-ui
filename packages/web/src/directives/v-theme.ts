import { type Directive } from 'vue'
import { useStore } from '@waltz-ui/state-management'

const theme: Directive = {
  mounted(_, binding) {
    useStore('meta').themeOverride = binding.arg
  },
  unmounted() {
    useStore('meta').themeOverride = ''
  },
}

export default theme
