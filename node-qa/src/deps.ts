import { Visitor } from '@flagship.io/js-sdk'

export {
  DecisionMode,
  Flagship,
  FlagshipStatus,
  LogLevel,
  HitType,
  EventCategory,
  Visitor, Modification
} from '@flagship.io/js-sdk'

export { Request, Response, NextFunction } from 'express'

export { SessionData } from 'express-session'

export type { IFlagshipLogManager } from '@flagship.io/js-sdk'

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
