export type Store<TContent extends object=Record<string, any>> = TContent & {
  $id: string
}
