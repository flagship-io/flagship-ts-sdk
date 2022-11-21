// import { DecisionMode, EventCategory, Flagship, HitType, BatchStrategy } from '../../'

const ENV_ID = ''
const API_KEY = ''

const btnAction1 = document.getElementById('btn-action-1')

btnAction1.addEventListener('click', async () => {
// Initialize the SDK and send Initialize monitoring hit
  Flagship.start(ENV_ID, API_KEY, {
    trackingMangerConfig: {
      // cacheStrategy: CacheStrategy.PERIODIC_CACHING,
      poolMaxSize: 5,
      batchIntervals: 10
    }
  })
})

const btnAction2 = document.getElementById('btn-action-2')

let visitor
// scenario 1 action 1
btnAction2.addEventListener('click', async () => {
  // Create a visitor and send consent hit
  visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    // isAuthenticated: true,
    context: {
      testing_tracking_manager: true
    }
  })

  // Fetch flags
  await visitor.fetchFlags()

  // Send an activate hit
  const value = visitor.getFlag('my_flag', 'defaultValue').getValue()

  console.log('flag value', value)

  // Send a screen hit

  for (let index = 0; index < 25; index++) {
    await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen ' + index })
  }

  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 3' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 4' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 5' })

  // // send a page hit
  // await visitor.sendHit({ type: HitType.PAGE, documentLocation: 'home page' })

  // // Send an event hit
  // await visitor.sendHit({ type: HitType.EVENT, action: 'click', category: EventCategory.ACTION_TRACKING })
})

const btnAction3 = document.getElementById('btn-action-3')

btnAction3.addEventListener('click', async () => {
  // visitor.setConsent(false)
  const value = visitor.getFlag('my_flag', 'defaultValue').getValue()

  console.log('flag value', value)
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 3' })
})

const btnAction4 = document.getElementById('btn-action-4')

btnAction4.addEventListener('click', async () => {
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
