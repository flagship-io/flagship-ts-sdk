import Flagship, {
  DecisionMode,
  EventCategory,
  FlagshipStatus,
  HitType,
  Item,
  LogLevel,
  Transaction
} from '../../'
import { API_KEY, ENV_ID } from './config.js'
import { campaigns } from './campaigns'

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const statusChangedCallback = (status) => {
  console.log('status', FlagshipStatus[status])
}

Flagship.start(ENV_ID, API_KEY, {
  decisionMode: DecisionMode.DECISION_API,
  statusChangedCallback,
  logLevel: LogLevel.ERROR,
  fetchNow: false
})

const initialModifications = new Map([[
  'array', {
    key: 'array',
    campaignId: 'c3ev1afkprbg5u3burag',
    variationGroupId: 'c3ev1afkprbg5u3burbg',
    variationId: 'c3ev1afkprbg5u3burcg',
    isReference: false,
    value: [1, 1, 1]
  }
]])

const visitor = Flagship.newVisitor({ visitorId: 'visitor_id', context: { key: 'value' }, initialModifications, initialCampaigns: campaigns.campaigns })

const start = async () => {
  if (visitor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visitor.on('ready', async (err) => {
      if (err) {
        console.log('Flagship error:', err)
        return
      }
      console.log('Flagship Ready')
    })

    // await sleep(5000)
    // clear context
    visitor.clearContext()

    // Update context
    visitor.updateContext({ isVip: true })

    // optional when fetchNow = true, this method is call on each newVisitor
    // await visitor.synchronizeModifications()
    visitor.setConsent(true)

    // getModification
    visitor.getModification({ key: 'object', defaultValue: {} })
      .then((modification) => {
        console.log('modification:', modification)
      })

    visitor.getModifications([
      { key: 'array', defaultValue: [] },
      {
        key: 'object',
        defaultValue: {},
        activate: true
      }])
      .then((modifications) => {
        console.log('modifications:', modifications)
      })

    // activateModification
    visitor.activateModification('object')

    visitor.activateModifications(['array', 'object'])

    // getModificationInfo
    visitor.getModificationInfo('array')
      .then((data) => {
        console.log('info', data)
      })

    // send hit

    // hit type Event
    visitor.sendHit({
      type: HitType.EVENT,
      category: EventCategory.ACTION_TRACKING,
      action: 'click'
    })

    // hit type Item
    const item = new Item({
      transactionId: 'transaction_1',
      productName: 'product_name',
      productSku: '00255578'
    })

    visitor.sendHit(item)

    // hit type Page
    visitor.sendHit({ type: HitType.PAGE, documentLocation: 'https://localhost' })

    // hit type Screen
    visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'https://localhost' })

    // hit type Transaction
    const transaction = new Transaction({ transactionId: 'transaction_1', affiliation: 'affiliation' })
    visitor.sendHit(transaction)
  }
}
start()
