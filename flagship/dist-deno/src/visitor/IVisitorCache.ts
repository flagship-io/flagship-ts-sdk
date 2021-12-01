export interface IVisitorCache {
    cacheVisitor:(visitorId: string, Data: string)=>void
    lookupVisitor(visitorId: string): string
    flushVisitor(visitorId: string):void
}
