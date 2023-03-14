import { IVisitorCacheImplementation } from './IVisitorCacheImplementation'
import Redis, { RedisOptions } from 'ioredis'
import { VisitorCacheDTO } from '../types'

/**
 * Implementation of IVisitorCacheImplementation using Redis
 *
 * Note: Before using, you must install [**ioredis**](https://www.npmjs.com/package/ioredis)
 * @param args
 * @returns
 */
export function fsRedisVisitorCache(port: number, host: string, options: RedisOptions): IVisitorCacheImplementation;
export function fsRedisVisitorCache(path: string, options: RedisOptions): IVisitorCacheImplementation;
export function fsRedisVisitorCache(port: number, options: RedisOptions): IVisitorCacheImplementation;
export function fsRedisVisitorCache(port: number, host: string): IVisitorCacheImplementation;
export function fsRedisVisitorCache(options: RedisOptions): IVisitorCacheImplementation;
export function fsRedisVisitorCache(port: number): IVisitorCacheImplementation;
export function fsRedisVisitorCache(path: string): IVisitorCacheImplementation;
export function fsRedisVisitorCache(): IVisitorCacheImplementation;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fsRedisVisitorCache (arg1?:any, arg2?:any, arg3?:any):IVisitorCacheImplementation {
  const redis = new Redis(arg1, arg2, arg3)
  return {
    async cacheVisitor (visitorId: string, data:VisitorCacheDTO): Promise<void> {
      await redis.set(visitorId, JSON.stringify(data))
    },
    async  lookupVisitor (visitorId: string): Promise<VisitorCacheDTO> {
      const data = await redis.get(visitorId)
      return data ? JSON.parse(data) : null
    },
    async flushVisitor (visitorId: string): Promise<void> {
      await redis.del(visitorId)
    }
  }
}
