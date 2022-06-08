const ENV_ID = ''
const API_KEY = ''

Flagship.start(ENV_ID, API_KEY, {
  // decisionMode: DecisionMode.BUCKETING,
//   fetchNow: false,
  timeout: 10,
  pollingInterval: 5
})

let visitor
const btnAction1 = document.getElementById('scenario-1action-1')
// scenario 1 action 1
btnAction1.addEventListener('click', async () => {
  visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    context: {
      qa_getflag: true
    }
  })

  const screen2 = { type: HitType.SCREEN, documentLocation: 'Screen 2' }
  await visitor.sendHit(screen2)

  console.log('screen1 sent:', screen2)
  const event = { type: HitType.EVENT, action: 'Event 1', category: EventCategory.ACTION_TRACKING }
  await visitor.sendHit(event)
})

const btnAction2 = document.getElementById('scenario-1action-2')
// scenario 1 action 1
btnAction2.addEventListener('click', async () => {
  visitor.setConsent(false)
})
