import Flagship, {
  CacheStrategy,
  DecisionMode,
  EventCategory,
  FlagshipStatus,
  HitType,
  Item,
  LogLevel,
  Transaction
} from '../..'
import { API_KEY, ENV_ID } from './config.js'
import { campaigns } from './campaigns'
import Redis from 'ioredis'

const redis = new Redis({
  host: '127.0.0.1',
  port: '6379'
})

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const statusChangedCallback = (status) => {
  console.log('status', FlagshipStatus[status])
}

const check = {}

const FS_HIT_PREFIX = 'FS_DEFAULT_HIT_CACHE_TS'
const hitCacheImplementation = {

  async cacheHit (hits) {
    await redis.set(FS_HIT_PREFIX, JSON.stringify(hits))
  },
  async lookupHits () {
    const redisData = await redis.get(FS_HIT_PREFIX)
    return redisData ? JSON.parse(redisData) : redisData
  },
  async flushHits (hitKeys) {
    const redisData = await redis.get(FS_HIT_PREFIX)
    const hits = JSON.parse(redisData || '{}')
    hitKeys.forEach(key => {
      delete hits[key]
    })
    await redis.set(FS_HIT_PREFIX, JSON.stringify(hits))
  },
  async flushAllHits () {
    await redis.del(FS_HIT_PREFIX)
  }
}

const continuousStrategyHitCache = {
  cacheHit (hits) {
    const localDatabaseJson = localStorage.getItem(FS_HIT_PREFIX) || '{}'
    const localDatabase = JSON.parse(localDatabaseJson)

    const newLocalDatabase = {
      ...localDatabase,
      ...hits
    }

    localStorage.setItem(FS_HIT_PREFIX, JSON.stringify(newLocalDatabase))
    return Promise.resolve()
  },
  lookupHits () {
    const localDatabaseJson = localStorage.getItem(FS_HIT_PREFIX) || '{}'
    const localDatabase = JSON.parse(localDatabaseJson)
    return Promise.resolve(localDatabase)
  },
  flushHits (hitKeys) {
    const localDatabaseJson = localStorage.getItem(FS_HIT_PREFIX) || '{}'
    const localDatabase = JSON.parse(localDatabaseJson)

    hitKeys.forEach(key => {
      delete localDatabase[key]
    })

    localStorage.setItem(FS_HIT_PREFIX, JSON.stringify(localDatabase))
    return Promise.resolve()
  },
  flushAllHits () {
    localStorage.removeItem(FS_HIT_PREFIX)
    return Promise.resolve()
  }
}

Flagship.start(ENV_ID, API_KEY, {
  hitCacheImplementation: continuousStrategyHitCache,
  trackingMangerConfig: {
    batchIntervals: 5,
    poolMaxSize: 10,
    cacheStrategy: CacheStrategy.CONTINUOUS_CACHING
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
  for (let index = 0; index < 10; index++) {
    const visitor = Flagship.newVisitor({ visitorId: 'visitor_a', context: { qa_report: true } })
    await start(visitor, index)
  }
}

script()
