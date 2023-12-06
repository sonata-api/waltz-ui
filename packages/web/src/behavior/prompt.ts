export type PromptAction = {
  name: string
  title: string
  variant?:
    | 'primary'
    | 'transparent'
  click?: (answer: PromptAction) => void
}
