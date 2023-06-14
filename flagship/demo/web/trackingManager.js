// import { DecisionMode, EventCategory, Flagship, HitType, CacheStrategy } from '../../'

const ENV_ID = ''
const API_KEY = ''

const btnAction1 = document.getElementById('btn-action-1')

btnAction1.addEventListener('click', async () => {
// Initialize the SDK and send Initialize monitoring hit
  Flagship.start(ENV_ID, API_KEY, {
    decisionMode: DecisionMode.BUCKETING,
    // initialBucketing: bucketing
    // disableCache: true,
    pollingInterval: 30,
    fetchThirdPartyData: true,
    fetchNow: false,
    trackingMangerConfig: {
      // cacheStrategy: 3,
      poolMaxSize: 5,
      batchIntervals: 30
    }
  })
})

const btnAction2 = document.getElementById('btn-action-2')

let visitor
// scenario 1 action 1
btnAction2.addEventListener('click', async () => {
  // Create a visitor and send consent hit
  visitor = Flagship.newVisitor({
    visitorId: 'wonderful_visitor_1',
    // isAuthenticated: true,
    context: {
      qa_bucketing_integration: true
    }
  })
})

const btnAction3 = document.getElementById('btn-action-3')

btnAction3.addEventListener('click', async () => {
  // Fetch flags
  await visitor.fetchFlags()
})

const btnAction4 = document.getElementById('btn-action-4')

// scenario 1 action 1
btnAction4.addEventListener('click', async () => {
  // Send an activate hit
  const value = visitor.getFlag('not_exists_flag', 'defaultValue').getValue()

  console.log('flag value', value)
})

const btnAction5 = document.getElementById('btn-action-5')

btnAction5.addEventListener('click', async () => {
  visitor.setConsent(false)
})

const btnAction6 = document.getElementById('btn-action-6')

btnAction6.addEventListener('click', async () => {
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 3' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 4' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 5' })
})

const btnAction7 = document.getElementById('btn-action-7')

btnAction7.addEventListener('click', async () => {
  const visitor2 = Flagship.newVisitor({
    visitorId: 'visitor-B',
    context: {
      testing_tracking_manager: true
    }
  })

  // Fetch flags
  await visitor2.fetchFlags()
  const value = visitor2.getFlag('my_flag', 'defaultValue').getValue()
  console.log('flag value', value)
  await visitor2.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
})

const btnAction8 = document.getElementById('btn-action-8')

btnAction8.addEventListener('click', async () => {
  await Flagship.close()
})
