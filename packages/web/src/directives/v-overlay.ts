import type { Directive } from 'vue'

const __layer = {
  last: 50,
  lastIndex: ''
}

const overlay: Directive = {
  mounted: (el, binding) => {
    if( binding.value?.condition === false ) {
      return
    }

    if( !el.parentNode ) {
      throw new Error('make sure a parent node exists when casting v-overlay')
    }

    const overlayElem = document.createElement('div')
    const zIndex = __layer.last

    __layer.last += 10

    overlayElem.setAttribute('style', `
      position: fixed;
      display: block;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${zIndex};

      width: 100vw;
      height: 100vh;

      ${!binding.modifiers?.invisible && `
        background: rgba(65, 82, 105, .25);
        backdrop-filter: blur(2px);
      `}
    `)

    if( binding.value?.click ) {
      overlayElem.onclick = binding.value.click
    }

    __layer.lastIndex = el.style.zIndex
    el.style.zIndex = `${zIndex+10}`
    el.parentNode.insertBefore(overlayElem, el)
  },

  beforeUnmount: (el, binding) => {
    if( binding.value?.condition === false ) {
      return
    }

    el.style.zIndex = __layer.lastIndex
    el.previousElementSibling?.remove()
    __layer.last -= 10
  }
}

export default overlay
