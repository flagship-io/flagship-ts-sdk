import {
  DecisionMode,
  EventCategory,
  Flagship,
  FlagshipStatus,
  HitType,
  Item,
  LogLevel,
  Transaction,
  Modification
} from '../../dist-deno/src/mod.ts'
import { API_KEY, ENV_ID } from './config.js'

const statusChangedCallback = (status:FlagshipStatus) => {
  console.log('status', FlagshipStatus[status])
}

Flagship.start(ENV_ID, API_KEY, {
  decisionMode: DecisionMode.BUCKETING,
  statusChangedCallback,
  logLevel: LogLevel.ERROR,
  fetchNow: false
})

const visitor = Flagship.newVisitor('visitor_id', { key: 'value' });

(async () => {
  if (visitor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visitor.on('ready', (err:any) => {
      if (err) {
        console.log('Flagship error:', err)
        return
      }
      console.log('Flagship Ready')
    })
    // clear context
    visitor.clearContext()

    // Update context
    visitor.updateContext({ isVip: true })

    // optional when fetchNow = true, this method is call on each newVisitor
    await visitor.synchronizeModifications()

    // getModification
    visitor.getModification({ key: 'object', defaultValue: {} })
      .then((modification) => {
        console.log('modification:', modification)
      })

    visitor.getModification([
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

    visitor.activateModification(['array', 'object'])

    // getModificationInfo
    visitor.getModificationInfo('array')
      .then((data:Modification|null) => {
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
})()
