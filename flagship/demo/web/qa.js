const ENV_ID = ''
const API_KEY = ''

const hitCacheImplementation = {
  cacheHit (visitorId, data) {
    const localDatabase = localStorage.getItem(visitorId)
    let dataArray = []
    if (localDatabase) {
      dataArray = JSON.parse(localDatabase)
      dataArray.push(data)
    } else {
      dataArray = [data]
    }
    localStorage.setItem(visitorId, JSON.stringify(dataArray))
  },
  lookupHits (visitorId) {
    const dataArray = localStorage.getItem(visitorId)
    localStorage.removeItem(visitorId)
    return dataArray
  },
  flushHits (visitorId) {
    localStorage.removeItem(visitorId)
  }
}

Flagship.start(ENV_ID, API_KEY, {
  fetchNow: false,
  timeout: 10,
  hitCacheImplementation
})

const currentVisitorId = 'visitor_5678'
const myAwesomeFeature = 'myAwesomeFeature'

const btnAction1 = document.getElementById('scenario-1action-1')

const printMessage = (scenario, action) => {
  console.log(`########### SCENARIO ${scenario} ACTION ${action} ##############`)
}

const printLocalStorage = () => {
  console.log('localStorage:', { ...localStorage })
}

let visitor = Flagship.newVisitor({
  visitorId: currentVisitorId,
  context: { plan: 'premium' },
  hasConsented: true
})

// scenario 1 action 1
btnAction1.addEventListener('click', async () => {
  printMessage(1, 1)
  await visitor.synchronizeModifications()

  visitor.getModification({ key: myAwesomeFeature, defaultValue: 0, activate: true }).then((flag) => {
    console.log('flag myAwesomeFeature :', flag)
  })

  const screen1 = { type: HitType.SCREEN, documentLocation: 'Screen 1' }
  await visitor.sendHit(screen1)
  console.log('screen1 sent:', screen1)

  printLocalStorage()
})

const scenario1Action2 = document.getElementById('scenario-1-action-2')

scenario1Action2.addEventListener('click', async () => {
  printMessage(1, 2)
  visitor.getModification({ key: 'perso_value', defaultValue: 'Not found', activate: true }).then((flag) => {
    console.log('perso_value:', flag)
  })

  const screen2 = { type: HitType.SCREEN, documentLocation: 'Screen 2' }
  await visitor.sendHit(screen2)

  console.log('screen1 sent:', screen2)
  const event = { type: HitType.EVENT, action: 'Event 1', category: EventCategory.ACTION_TRACKING }
  await visitor.sendHit(event)

  console.log('event sent:', event)
  printLocalStorage()
})

const scenario1Action3 = document.getElementById('scenario-1-action-3')
scenario1Action3.addEventListener('click', async () => {
  printMessage(1, 3)
  await visitor.synchronizeModifications()
  console.log('synchronize OK')

  visitor = Flagship.newVisitor({
    visitorId: currentVisitorId,
    context: { plan: 'premium' },
    hasConsented: true
  })
  console.log('new visitor created')

  await visitor.synchronizeModifications()
  console.log('synchronize OK')

  let flag = visitor.getModificationSync({ key: myAwesomeFeature, defaultValue: 0, activate: true })
  console.log('flag myAwesomeFeature :', flag)

  visitor.updateContext({ plan: 'enterprise' })
  console.log('updateContext to  { plan: "enterprise" }')

  await visitor.synchronizeModifications()
  console.log('synchronize OK')

  flag = visitor.getModificationSync({ key: myAwesomeFeature, defaultValue: 0, activate: true })
  console.log('flag myAwesomeFeature :', flag)

  visitor.setConsent(false)
  console.log('setConsent false')

  const screen3 = { type: HitType.SCREEN, documentLocation: 'Screen 3' }
  await visitor.sendHit(screen3)
  console.log('hit screen 3 sent')

  visitor.setConsent(true)
  console.log('setConsent true')

  await visitor.synchronizeModifications()
  console.log('synchronize OK')

  console.log('LocalStorage expected must be Empty')

  printLocalStorage()
})

const scenario1Action4 = document.getElementById('scenario-1-action-4')
scenario1Action4.addEventListener('click', async () => {
  printMessage(1, 4)
  const screen4 = { type: HitType.SCREEN, documentLocation: 'Screen 4' }
  await visitor.sendHit(screen4)
  console.log('send Screen 4 failed')
  printLocalStorage()
  visitor.setConsent(false)
  console.log('consent disabled')
  printLocalStorage()
})

const scenario1Action5 = document.getElementById('scenario-1-action-5')
scenario1Action5.addEventListener('click', () => {
  printMessage(1, 5)
  visitor = Flagship.newVisitor({
    visitorId: currentVisitorId,
    hasConsented: true
  })
})
