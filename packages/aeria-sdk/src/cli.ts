import path from 'path'
import { mirror } from './mirror'

const main = async () => {
  const { aeriaSdk } = require(path.join(process.cwd(), 'package.json'))
  if( typeof aeriaSdk !== 'object' || !aeriaSdk ) {
    console.log('aeriaSdk is absent in package.json')
    return
  }

  mirror(aeriaSdk)
}

main()
