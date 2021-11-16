import Flagship, { HitType, EventCategory } from '@flagship.io/js-sdk'
import { API_KEY, ENV_ID } from './config.js'

const step = 2
const myAwesomeFeature = 'myAwesomeFeature'
/** Main flow **/

let localDatabase = []
const hitCacheImplementation = {
  cacheHit (visitorId, data) {
    console.log('cacheHit')
    localDatabase.push({ [visitorId]: data })
    console.log('localDatabase', localDatabase)
  },
  lookupHits (visitorId) {
    console.log('lookupHits')
    return localDatabase.filter(x => x.data.visitorId !== visitorId).map(item => {
      return item[visitorId]
    })
  },
  flushHits (visitorId) {
    console.log('flushHits')
    localDatabase = localDatabase.filter(x => x.data.visitorId !== visitorId)
  }
}

Flagship.start(ENV_ID, API_KEY, {
  fetchNow: false,
  hitCacheImplementation
})

const currentVisitorId = 'visitor_5678'
let visitor = Flagship.newVisitor({ visitorId: currentVisitorId, context: { plan: 'premium' }, hasConsented: true })

const getFlag = () => {
  visitor.getModification({ key: myAwesomeFeature, defaultValue: 0, activate: true }).then((flag) => {
    console.log('flag:', flag)
  })
}

visitor.on('ready', error => {
  if (error) {
    console.log('error ready', error)
    return
  }
  switch (step) {
    case 1:
      getFlag()
      visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
      break
    case 2:
      visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
      visitor.sendHit({ type: HitType.EVENT, action: 'Event 1', category: EventCategory.ACTION_TRACKING })
      visitor.getModification({ key: 'perso_value', defaultValue: 'Not found', activate: true }).then((flag) => {
        console.log('perso_value:', flag)
      })

      // [
      //   { visitor_5678: { version: 1, data: { time: 1636998160490, visitorId: 'visitor_5678', type: 'SCREENVIEW', content: { cid: 'bkk4s7gcmjcg07fke9e0', t: 'SCREENVIEW', ds: 'APP', dl: 'Screen2', vid: 'visitor_5678', cuid: null } } } },
      //   { visitor_5678: { version: 1, data: { time: 1636998173117, visitorId: 'visitor_5678', type: 'EVENT', content: { cid: 'bkk4s7gcmjcg07fke9e0', t: 'EVENT', ds: 'APP', ec: 'User Engagement', ea: 'Event1', vid: 'visitor_5678', cuid: null } } } }
      // ]

      break
    case 3:

      visitor = Flagship.newVisitor({ visitorId: currentVisitorId, context: { plan: 'premium' } })

      // []
      break
    case 4:
      visitor.updateContext({ plan: 'enterprise' })
      break
    default:
      break
  }
})
// Synchronize
visitor.synchronizeModifications().then(() => {
  getFlag()
})
