// import { EventCategory, Flagship, HitType } from '../../'
// import { BatchStrategy } from '../../dist/enum/BatchStrategy'

const ENV_ID = 'c1ndrd07m0300ro0jf20'
const API_KEY = 'QzdTI1M9iqaIhnJ66a34C5xdzrrvzq6q8XSVOsS6'

const btnAction1 = document.getElementById('btn-action-1')

btnAction1.addEventListener('click', async () => {
// Initialize the SDK and send Initialize monitoring hit
  Flagship.start(ENV_ID, API_KEY, {
    hitCacheImplementation: {},
    fetchNow: false,
    timeout: 15,
    pollingInterval: 5,
    trackingMangerConfig: {
      batchLength: 10,
      batchIntervals: 120
    }
  })
})

const btnAction2 = document.getElementById('btn-action-2')
// scenario 1 action 1
btnAction2.addEventListener('click', async () => {
  // Create a visitor and send consent hit
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    context: {
      testing_tracking_manager: true
    }
  })

  // Fetch flags
  await visitor.fetchFlags()

  // Send an activate hit
  await visitor.getFlag('my_flag', 'defaultValue').userExposed()

  // Send a screen hit
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })

  // send a page hit
  await visitor.sendHit({ type: HitType.PAGE, documentLocation: 'home page' })

  // Send an event hit
  await visitor.sendHit({ type: HitType.EVENT, action: 'click', category: EventCategory.ACTION_TRACKING })
})
