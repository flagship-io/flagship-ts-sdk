export {
  DecisionMode,
  Flagship,
  FlagshipStatus,
  LogLevel,
  HitType,
  EventCategory,
  Visitor
} from '../../flagship'

export { Request, Response, NextFunction } from 'express'

export { SessionData } from 'express-session'

export type { IFlagshipLogManager } from '../../flagship/dist'

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
  }
}
