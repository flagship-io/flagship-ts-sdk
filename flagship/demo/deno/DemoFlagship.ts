import {
  DecisionMode,
  EventCategory,
  Flagship,
  FlagshipStatus,
  HitType,
  Item,
  LogLevel,
  Transaction,
  Modification,
  DEVICE_LOCALE
} from '../../dist-deno/src/mod.ts'
import { API_KEY, ENV_ID } from './config.js'
const sleep = (ms:number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const statusChangedCallback = (status:any) => {
  console.log('status', FlagshipStatus[status])
}

const check:any = {}

Flagship.start(ENV_ID, API_KEY, {
  // decisionMode: DecisionMode.BUCKETING,
  statusChangedCallback,
  // logLevel: LogLevel.ERROR,
  fetchNow: false,
  timeout: 10
})

const start = async (visitor:any, index:number) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visitor.on('ready', async (err:any) => {
    if (err) {
      console.log('Flagship error:', err)
      return
    }
    console.log('Flagship Ready')

    // getFlag
    const flag = visitor.getFlag('js-qa-app', 'test')

    const value = flag.getValue(false)

    if (check[value]) {
      check[value] += 1
    } else {
      check[value] = 1
    }

    console.log('flag.value', value)

    await flag.userExposed()

    console.log('flag.userExposed')
    // send hit

    // hit type Event
    await visitor.sendHit({
      type: HitType.EVENT,
      category: EventCategory.ACTION_TRACKING,
      action: 'KPI2',
      value: 10
    })

    console.log('hit type Event')

    await flag.userExposed()
    // hit type Page
    await visitor.sendHit({ type: HitType.PAGE, documentLocation: 'https://www.sdk.com/abtastylab/js/151021-' + index })
    console.log('hit type Page')

    await flag.userExposed()
    // hit type Screen
    await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'abtastylab-js-' + index })

    console.log('hit type Screen')

    await flag.userExposed()
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
  for (let index = 0; index <= 1; index++) {
    const visitor = Flagship.newVisitor({ visitorId: 'visitor_a', context: { qa_report: true } })
    await start(visitor, index)
  }
}

script()
