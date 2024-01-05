import {
  CacheStrategy,
  Flagship,
  EventCategory,
  FlagshipStatus,
  HitType,
  Transaction
} from '@flagship.io/js-sdk/dist/index.lite'
import { API_KEY, ENV_ID } from './config.js'
import { campaigns } from './campaigns.js'
import Redis from 'ioredis'

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const statusChangedCallback = (status) => {
  console.log('status', FlagshipStatus[status])
}

const check = {}

function hitCacheImplementation (host, port, dbIndex) {
  const redis = new Redis({
    host,
    port
  })

  redis.select(dbIndex)

  return {

    async cacheHit (hits) {
      const multi = redis.multi()
      Object.entries(hits).forEach(([key, value]) => {
        multi.set(key, JSON.stringify(value))
      })
      await multi.exec()
    },
    async lookupHits () {
      const keys = await redis.keys('*')
      if (!keys.length) {
        return null
      }
      const redisData = await redis.mget(keys)
      const hits = {}
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
      await redis.flushdb()
    }
  }
}

Flagship.start(ENV_ID, API_KEY, {
  // hitCacheImplementation: hitCacheImplementation('127.0.0.1', '6379', 2),
  trackingMangerConfig: {
    batchIntervals: 5,
    poolMaxSize: 10,
    cacheStrategy: CacheStrategy.PERIODIC_CACHING
  }
})

const start = async (visitor, index) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visitor.on('ready', async (err) => {
    if (err) {
      console.log('Flagship error:', err)
      return
    }
    console.log('Flagship Ready')

    // getFlag
    const flag = visitor.getFlag('js-qa-app', 'test')

    const value = flag.getValue()

    console.log('flag.value', value)

    // send hit

    // hit type Event
    await visitor.sendHit({
      type: HitType.EVENT,
      category: EventCategory.ACTION_TRACKING,
      action: 'KPI2',
      value: 10
    })

    console.log('hit type Event')

    // hit type Page
    await visitor.sendHit({ type: HitType.PAGE, documentLocation: 'https://www.sdk.com/abtastylab/js/151021-' + index })
    console.log('hit type Page')

    // hit type Screen
    await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'abtastylab-js-' + index })

    // hit type Transaction
    const transaction = new Transaction({ transactionId: visitor.visitorId, affiliation: 'KPI1' })
    await visitor.sendHit(transaction)

    console.log('hit type transaction')

    console.log('check', check)
  })

  await visitor.fetchFlags()
}

async function script () {
  await sleep(2000)
  for (let index = 0; index < 1; index++) {
    const visitor = Flagship.newVisitor({ visitorId: 'visitor_a', context: { qa_report: true } })
    await start(visitor, index)
  }
}

script()
