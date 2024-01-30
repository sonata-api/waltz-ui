import { createServer, build as viteBuild } from 'vite'

const projectRoot = process.cwd()

export const serve = async () => {
  const server = await createServer({
    configFile: new URL(import.meta.resolve('./vite.js')).pathname,
    root: projectRoot,
    server: {
      port: 8080
    }
  })

  await server.listen()
  server.printUrls()
}

export const build = async () => {
  const { default: config } = await import(import.meta.resolve('./vite.js'))

  return viteBuild(
    typeof config === 'function'
      ? await config()
      : config
  )

}
