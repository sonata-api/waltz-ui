import type { LayoutName } from '@sonata-api/types'
import WTabular from './w-tabular/w-tabular.vue'
import WGrid from './w-grid/w-grid.vue'

export const getLayout = (layoutName: LayoutName) => {
  const defaultLayouts = {
    tabular: WTabular,
    grid: WGrid,
    list: WGrid,
  }

  return defaultLayouts[layoutName] || defaultLayouts.tabular
}
