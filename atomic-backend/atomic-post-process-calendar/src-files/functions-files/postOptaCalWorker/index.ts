
import { handlerPath } from '../../libs/handler-resolver'

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  memorySize: 1800,
}
