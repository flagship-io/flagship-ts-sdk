import 'express-session'

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
