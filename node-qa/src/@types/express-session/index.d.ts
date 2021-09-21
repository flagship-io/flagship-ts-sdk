import 'express-session'
import { Visitor } from '../../deps'

declare module 'express-session' {
    interface SessionData {
      config?: {
        environmentId:string,
      apiKey: string,
      timeout: number,
      bucketing: boolean,
      pollingInterval:number,
      }
      logs?:string
      visitor?: Visitor
    }
}
