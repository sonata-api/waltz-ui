import { defineComponent, h, ref } from 'vue'

export const WAsync = defineComponent({
  props: {
    promise: Promise
  },
  setup(props) {
    const result = ref<any>()
    if( props.promise instanceof Promise ) {
      props.promise.then((value) => {
        result.value = value
      })
    }

    return () => h('div', result.value)
  }
})
