import { Visitor } from 'flagship'

export {
  DecisionMode,
  Flagship,
  FlagshipStatus,
  LogLevel,
  HitType,
  EventCategory,
  Visitor, Modification
} from 'flagship'

export { Request, Response, NextFunction } from 'express'

export { SessionData } from 'express-session'

export type { IFlagshipLogManager } from 'flagship'

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
    flagValue?:{
      flagKey:string
      defaultValue:unknown
      activate:boolean
    }
  }
}
