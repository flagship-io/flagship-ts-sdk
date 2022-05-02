import { VisitorCacheDTO } from '../types.ts'

export interface IVisitorCacheImplementation {
    /**
     * This method is called when the SDK needs to cache visitor information in your database.
     * @param {string} visitorId visitor ID
     * @param {string} data visitor data JSON
     */
    cacheVisitor:(visitorId: string, Data: VisitorCacheDTO)=>Promise<void>

    /**
     * This method is called when the SDK needs to get the visitor information corresponding to visitor ID from your database.
     * @param visitorId visitor ID
     */
    lookupVisitor(visitorId: string): VisitorCacheDTO

    /**
     * This method is called when the SDK needs to erase the visitor information corresponding to visitor ID in your database.
     * @param visitorId
     */
    flushVisitor(visitorId: string): Promise<void>
}
