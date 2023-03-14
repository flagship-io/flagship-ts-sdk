import { HitCacheDTO } from '../types'
import { IHitCacheImplementation } from './IHitCacheImplementation'
import Redis, { RedisOptions } from 'ioredis'

/**
 * Implementation of IHitCacheImplementation using Redis
 *
 * Note: Before using, you must install [**ioredis**](https://www.npmjs.com/package/ioredis)
 * @param args
 * @returns
 */
export function fsRedisHitCache(port: number, host: string, options: RedisOptions): IHitCacheImplementation;
export function fsRedisHitCache(path: string, options: RedisOptions): IHitCacheImplementation;
export function fsRedisHitCache(port: number, options: RedisOptions): IHitCacheImplementation;
export function fsRedisHitCache(port: number, host: string): IHitCacheImplementation;
export function fsRedisHitCache(options: RedisOptions): IHitCacheImplementation;
export function fsRedisHitCache(port: number): IHitCacheImplementation;
export function fsRedisHitCache(path: string): IHitCacheImplementation;
export function fsRedisHitCache(): IHitCacheImplementation;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fsRedisHitCache (arg1?:any, arg2?:any, arg3?:any): IHitCacheImplementation {
  const redis = new Redis(arg1, arg2, arg3)

  return {

    async cacheHit (hits) {
      const multi = redis.multi()
      Object.entries(hits).forEach(([key, value]) => {
        multi.set(key, JSON.stringify(value))
      })
      await multi.exec()
    },
    async lookupHits () {
      const hits:Record<string, HitCacheDTO> = {}
      const keys = await redis.keys('*')
      if (!keys.length) {
        return hits
      }
      const redisData = await redis.mget(keys)

      redisData.forEach((value, index) => {
        if (!value) {
          return
        }
        hits[keys[index]] = JSON.parse(value)
      })
      return hits
    },
    async flushHits (hitKeys) {
      await redis.del(hitKeys)
    },

    async flushAllHits () {
      const keys = await redis.keys('*')
      if (!keys.length) {
        return
      }
      await redis.del(keys)
    }
  }
}
