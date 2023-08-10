const useCustomRouter = async () => {
  await ROUTER.isReady()
  return ROUTER
}

export {
  useCustomRouter as useRouter
}
