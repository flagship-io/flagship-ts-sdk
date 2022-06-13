// import { Flagship } from '../../'
// import { BatchStrategy } from '../../dist/enum/BatchStrategy'

const ENV_ID = ''
const API_KEY = ''

Flagship.start(ENV_ID, API_KEY, {
  // decisionMode: DecisionMode.BUCKETING,
  fetchNow: false,
  timeout: 10,
  pollingInterval: 5,
  trackingMangerConfig: {
    batchStrategy: BatchStrategy.NO_BATCHING_WITH_CONTINUOUS_CACHING_STRATEGY,
    batchLength: 5,
    batchIntervals: 10
  }
})

let visitor
const btnAction1 = document.getElementById('scenario-1action-1')
// scenario 1 action 1
btnAction1.addEventListener('click', async () => {
  visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    // isAuthenticated: true,
    context: {
      testing_tracking_manager: true
    }
  })

  await visitor.fetchFlags()

  visitor.getFlag('my_flag', 'defaultValue').userExposed()

  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 3' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 4' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 5' })
})

const btnAction2 = document.getElementById('scenario-1action-2')
// scenario 1 action 1
btnAction2.addEventListener('click', async () => {
  visitor.setConsent(false)
})

const btnAction3 = document.getElementById('scenario-1action-3')
// scenario 1 action 1
btnAction3.addEventListener('click', async () => {
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 3' })
})
