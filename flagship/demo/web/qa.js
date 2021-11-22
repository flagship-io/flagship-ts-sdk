const ENV_ID = ''
const API_KEY = ''

const hitPrefix = 'fs_hit_'
const hitCacheImplementation = {
  cacheHit (visitorId, data) {
    const localDatabase = localStorage.getItem(hitPrefix + visitorId)
    let dataJson = ''
    if (localDatabase) {
      const dataArray = JSON.parse(localDatabase)
      dataArray.push(JSON.parse(data))
      dataJson = JSON.stringify(dataArray)
    } else {
      dataJson = `[${data}]`
    }
    localStorage.setItem(hitPrefix + visitorId, dataJson)
  },
  lookupHits (visitorId) {
    const dataArray = localStorage.getItem(hitPrefix + visitorId)
    localStorage.removeItem(hitPrefix + visitorId)
    return dataArray
  },
  flushHits (visitorId) {
    localStorage.removeItem(hitPrefix + visitorId)
  }
}

const visitorPrefix = 'fs_visitor_'
const visitorCacheImplementation = {
  cacheVisitor (visitorId, data) {
    localStorage.setItem(visitorPrefix + visitorId, data)
  },
  lookupVisitor (visitorId) {
    const dataArray = localStorage.getItem(visitorPrefix + visitorId)
    localStorage.removeItem(visitorPrefix + visitorId)
    return dataArray
  },
  flushVisitor (visitorId) {
    localStorage.removeItem(visitorPrefix + visitorId)
  }
}

Flagship.start(ENV_ID, API_KEY, {
  decisionMode: DecisionMode.BUCKETING,
  fetchNow: false,
  timeout: 10,
  hitCacheImplementation,
  visitorCacheImplementation,
  pollingInterval: 20
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

  console.log('synchronizeModifications')
  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  printLocalStorage()

  let flag = visitor.getModificationSync({ key: myAwesomeFeature, defaultValue: 0, activate: true })
  console.log('flag myAwesomeFeature :', flag)

  visitor.updateContext({ plan: 'enterprise' })
  console.log('updateContext to  { plan: "enterprise" }')

  console.log('synchronizeModifications')
  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  printLocalStorage()

  flag = visitor.getModificationSync({ key: myAwesomeFeature, defaultValue: 0, activate: true })
  console.log('flag myAwesomeFeature :', flag)

  console.log('setConsent')
  visitor.setConsent(false)
  console.log('setConsent false')

  const screen3 = { type: HitType.SCREEN, documentLocation: 'Screen 3' }
  await visitor.sendHit(screen3)
  console.log('hit screen 3 sent')
  printLocalStorage()

  console.log('setConsent')
  visitor.setConsent(true)
  console.log('setConsent true')

  console.log('synchronizeModifications')
  await visitor.synchronizeModifications()
  console.log('synchronize OK')

  console.log('LocalStorage expected must be Empty')

  printLocalStorage()
})

const scenario1Action4 = document.getElementById('scenario-1-action-4')
scenario1Action4.addEventListener('click', async () => {
  printMessage(1, 4)
  printLocalStorage()
  visitor = Flagship.newVisitor({
    visitorId: currentVisitorId,
    hasConsented: true
  })
  printLocalStorage()
  console.log('visitor created')
  await visitor.synchronizeModifications()
  console.log('synchronize OK')

  const flag = visitor.getModificationSync({ key: myAwesomeFeature, defaultValue: 0, activate: true })
  console.log('flag myAwesomeFeature :', flag)
})

const scenario1Action5 = document.getElementById('scenario-1-action-5')
scenario1Action5.addEventListener('click', async () => {
  printMessage(1, 5)
  const screen4 = { type: HitType.SCREEN, documentLocation: 'Screen 4' }
  await visitor.sendHit(screen4)
  console.log('send Screen 4 failed')
  printLocalStorage()
  visitor.setConsent(false)
  console.log('consent disabled')
  printLocalStorage()
})

const scenario1Action6 = document.getElementById('scenario-1-action-6')
scenario1Action6.addEventListener('click', async () => {
  printMessage(1, 6)
  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  printLocalStorage()
  visitor.setConsent(true)
  console.log('setConsent true')
  const event = { type: HitType.EVENT, action: 'Event 2', category: EventCategory.ACTION_TRACKING }
  await visitor.sendHit(event)
  console.log('event sent:', event)
})

const scenario1Action7 = document.getElementById('scenario-1-action-7')
scenario1Action7.addEventListener('click', async () => {
  printMessage(1, 7)
  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  printLocalStorage()
})

const scenario1Action8 = document.getElementById('scenario-1-action-8')
scenario1Action8.addEventListener('click', async () => {
  printMessage(1, 8)
  visitor = Flagship.newVisitor({
    visitorId: 'visitor_AAAA',
    hasConsented: true,
    context: {
      cacheEnabled: true
    }
  })
  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  const flag = visitor.getModificationSync({ key: 'cache', defaultValue: 0, activate: true })
  console.log('flag cache :', flag)

  printLocalStorage()
})

const scenario1Action9 = document.getElementById('scenario-1-action-9')
scenario1Action9.addEventListener('click', async () => {
  printMessage(1, 9)

  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  const flag = visitor.getModificationSync({ key: 'cache', defaultValue: 0, activate: true })
  console.log('flag cache :', flag)

  printLocalStorage()
})

const scenario1Action10 = document.getElementById('scenario-1-action-10')
scenario1Action10.addEventListener('click', async () => {
  printMessage(1, 10)

  visitor = Flagship.newVisitor({
    visitorId: 'visitor_BBBB',
    hasConsented: true,
    context: {
      cacheEnabled: true
    }
  })
  await visitor.synchronizeModifications()
  console.log('synchronize OK')
  const flag = visitor.getModificationSync({ key: 'cache', defaultValue: 0, activate: true })
  console.log('flag cache :', flag)

  printLocalStorage()
})