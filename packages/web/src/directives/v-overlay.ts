import type { Directive } from 'vue'

const overlay: Directive = {
  mounted: (el, binding) => {
    if( binding.value?.condition === false ) {
      return
    }

    if( !el.parentNode ) {
      throw new Error('make sure a parent node exists when casting v-overlay')
    }

    const overlayElem = document.createElement('div')

    const visible = !binding.modifiers?.invisible
      && (
        !binding.modifiers?.invisibleOnLarge
          || window.matchMedia('(max-width: 600px)').matches
      )

    const layer = binding.value?.layer || 50

    overlayElem.setAttribute('style', `
      position: fixed;
      display: block;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${layer};

      width: 100vw;
      height: 100vh;

      ${visible && `
        background: rgba(65, 82, 105, .25);
        backdrop-filter: blur(2px);
      `}
    `)

    if( binding.value?.click ) {
      overlayElem.onclick = binding.value.click
    }

    el.style.zIndex = `${layer+10}`
    el.parentNode.insertBefore(overlayElem, el)
  },

  beforeUnmount: (el, binding) => {
    if( binding.value?.condition === false ) {
      return
    }

    el.previousElementSibling?.remove()
  }
}

export default overlay
