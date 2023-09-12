export type PromptAction = {
  name: string
  title: string
  variant?:
    | 'normal'
    | 'danger'
  click?: (answer: PromptAction) => void
}
