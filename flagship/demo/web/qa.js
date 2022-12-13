// import Flagship, { BatchStrategy } from '../../'

const ENV_ID = ''
const API_KEY = ''

Flagship.start(ENV_ID, API_KEY, {
  decisionMode: DecisionMode.BUCKETING,
  fetchNow: false,
  timeout: 10,
  pollingInterval: 5,
  // enableClientCache: false,
  trackingMangerConfig: {
    batchStrategy: 0
  }
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

// scenario 1 action 1
btnAction1.addEventListener('click', async () => {
  // printMessage(1, 1)

  const visitor = Flagship.newVisitor({
    context: { plan: 'premium' },
    hasConsented: true
  })
  await visitor.fetchFlags()

  const flag = visitor.getFlag('js', 'default')

  console.log('flag myAwesomeFeature :', flag.getValue())

  const screen1 = { type: HitType.SCREEN, documentLocation: 'abtastylab' }
  await visitor.sendHit(screen1)
  console.log('screen1 sent:', screen1)

  // printLocalStorage()
})

const scenario1Action2 = document.getElementById('scenario-1-action-2')

scenario1Action2.addEventListener('click', async () => {
  printMessage(1, 2)
  const flag = visitor.getFlag('perso_value', 'Not found')

  console.log('perso_value:', flag.getValue())

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
  await visitor.fetchFlags()
  console.log('fetchFlags OK')

  visitor = Flagship.newVisitor({
    visitorId: currentVisitorId,
    context: { plan: 'premium' },
    hasConsented: true
  })

  console.log('new visitor created')

  console.log('fetchFlags')
  await visitor.fetchFlags()
  console.log('fetchFlags OK')
  printLocalStorage()

  let flag = visitor.getFlag(myAwesomeFeature, 0)

  console.log('flag myAwesomeFeature :', flag.getValue())

  visitor.updateContext({ plan: 'enterprise' })
  console.log('updateContext to  { plan: "enterprise" }')

  console.log('synchronizeModifications')
  await visitor.fetchFlags()
  console.log('synchronize OK')
  printLocalStorage()

  flag = visitor.getFlag(myAwesomeFeature, 0)
  console.log('flag myAwesomeFeature :', flag.getValue())

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
  await visitor.fetchFlags()
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
  await visitor.fetchFlags()
  console.log('fetchFlags OK')

  const flag = visitor.getFlag(myAwesomeFeature, 0)
  console.log('flag myAwesomeFeature :', flag.getValue())
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
  await visitor.fetchFlags()
  console.log('fetchFlags OK')
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
  await visitor.fetchFlags()
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
  await visitor.fetchFlags()
  console.log('synchronize OK')
  const flag = visitor.getFlag('cache', 0)
  console.log('flag cache :', flag.getValue())
  const flag2 = visitor.getFlag('cache-2', 0)
  console.log('flag cache 2:', flag2.getValue())
  printLocalStorage()
})

const scenario1Action9 = document.getElementById('scenario-1-action-9')
scenario1Action9.addEventListener('click', async () => {
  printMessage(1, 9)

  await visitor.fetchFlags()
  console.log('synchronize OK')
  const flag = visitor.getFlag('cache', 0)
  console.log('flag cache :', flag.getValue())
  const flag2 = visitor.getFlag('cache-2', 0)
  console.log('flag cache 2:', flag2.getValue())
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
  await visitor.fetchFlags()
  console.log('synchronize OK')
  const flag = visitor.getFlag('cache', 0)
  console.log('flag cache :', flag.getValue())

  printLocalStorage()
})

const scenario1Action11 = document.getElementById('scenario-1-action-11')
scenario1Action11.addEventListener('click', async () => {
  printMessage(1, 11)

  visitor = Flagship.newVisitor({
    visitorId: 'V0000',
    context: {
      cacheEnabled: true
    }
  })

  await visitor.fetchFlags()
  console.log('fetchFlags OK')
  const flag = visitor.getFlag('js-qa-app', 'default')
  console.log('flag js-qa-app :', flag.getValue())

  printLocalStorage()
})

const scenario1Action12 = document.getElementById('scenario-1-action-12')
scenario1Action12.addEventListener('click', async () => {
  printMessage(1, 12)
  await visitor.fetchFlags()
  console.log('fetchFlags OK')
  const flag = visitor.getFlag('cache', 0)
  console.log('flag cache :', flag.getValue())

  printLocalStorage()
})

const scenario1Action13 = document.getElementById('scenario-1-action-13')
scenario1Action13.addEventListener('click', async () => {
  printMessage(1, 13)

  visitor = Flagship.newVisitor({
    visitorId: 'V0000',
    context: {
      cacheEnabled: true
    }
  })

  const screen5 = { type: HitType.SCREEN, documentLocation: 'Screen 5' }
  const screen6 = { type: HitType.SCREEN, documentLocation: 'Screen 6' }
  const screen7 = { type: HitType.SCREEN, documentLocation: 'Screen 7' }
  await visitor.sendHits([screen5, screen6, screen7])
  console.log('3 hit screen  sent')

  printLocalStorage()
})

const scenario1Action14 = document.getElementById('scenario-1-action-14')
scenario1Action14.addEventListener('click', async () => {
  printMessage(1, 14)

  const screen5 = { type: HitType.SCREEN, documentLocation: 'Screen 5' }
  const screen6 = { type: HitType.SCREEN, documentLocation: 'Screen 6' }
  const screen7 = { type: HitType.SCREEN, documentLocation: 'Screen 7' }
  await visitor.sendHits([screen5, screen6, screen7])
  console.log('3 hit screen  sent')

  printLocalStorage()
})

// scenario 4
const scenario1Action15 = document.getElementById('scenario-1-action-15')
scenario1Action15.addEventListener('click', async () => {
  printMessage(1, 15)

  visitor = Flagship.newVisitor({
    visitorId: 'V1111'
  })

  console.log('user created')

  printLocalStorage()
})

const scenario1Action16 = document.getElementById('scenario-1-action-16')
scenario1Action16.addEventListener('click', async () => {
  printMessage(1, 16)

  const crashLookupHits = () => {
    throw new Error('Crash lookup hits')
  }
  // hitCacheImplementation.lookupHits = crashLookupHits
  visitor = Flagship.newVisitor({
    visitorId: 'V1111'
  })

  const BadFormatLookupHits = () => {
    return 'JSON bad formatted'
  }
  // hitCacheImplementation.lookupHits = BadFormatLookupHits
  visitor = Flagship.newVisitor({
    visitorId: 'V1111'
  })

  console.log('user created')

  printLocalStorage()
  hitCacheImplementation.lookupHits = lookupHits
})

const scenario1Action17 = document.getElementById('scenario-1-action-17')
scenario1Action17.addEventListener('click', async () => {
  printMessage(1, 17)

  visitor = Flagship.newVisitor({
    visitorId: 'V0000',
    hasConsented: false
  })

  console.log('user created')

  await visitor.synchronizeModifications()
  console.log('synchronized ok')
  printLocalStorage()
})

const scenario1Action18 = document.getElementById('scenario-1-action-18')
scenario1Action18.addEventListener('click', async () => {
  printMessage(1, 18)

  visitor.setConsent(true)

  console.log('setConsent true')

  await visitor.fetchFlags()
  console.log('synchronized ok')
  printLocalStorage()
})

const scenario7Action1 = document.getElementById('scenario-7-action-1')
scenario7Action1.addEventListener('click', async () => {
  printMessage(7, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'V1111'
  })

  await visitor.fetchFlags()
  console.log('synchronized ok')
  printLocalStorage()
})

const scenario7Action2 = document.getElementById('scenario-7-action-2')
scenario7Action2.addEventListener('click', async () => {
  printMessage(7, 2)

  await visitor.fetchFlags()
  console.log('synchronized ok')
  printLocalStorage()
})

const scenario8Action1 = document.getElementById('scenario-8-action-1')
scenario8Action1.addEventListener('click', async () => {
  printMessage(8, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'V2222'
  })
  const screen5 = { type: HitType.SCREEN, documentLocation: 'Screen 5' }
  const screen6 = { type: HitType.SCREEN, documentLocation: 'Screen 6' }
  const screen7 = { type: HitType.SCREEN, documentLocation: 'Screen 7' }
  await visitor.sendHits([screen5, screen6, screen7])
  console.log('3 hit screen  sent')

  printLocalStorage()
})

const scenario8Action2 = document.getElementById('scenario-8-action-2')
scenario8Action2.addEventListener('click', async () => {
  printMessage(8, 2)

  visitor = Flagship.newVisitor({
    visitorId: 'V2222'
  })

  printLocalStorage()
})

const scenario11Action1 = document.getElementById('scenario-11-action-1')
scenario11Action1.addEventListener('click', async () => {
  printMessage(11, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'V3333'
  })

  await visitor.fetchFlags()

  printLocalStorage()
})

const scenario11Action2 = document.getElementById('scenario-11-action-2')
scenario11Action2.addEventListener('click', async () => {
  printMessage(11, 2)

  const screen = { type: HitType.SCREEN, documentLocation: 'Screen 5' }
  const event = { type: HitType.EVENT, action: 'Event 1', category: EventCategory.ACTION_TRACKING }

  await visitor.activateModifications(['array', 'object'])
  await visitor.sendHits([screen, event])
  await visitor.fetchFlags()

  printLocalStorage()
})

const scenario11Action3 = document.getElementById('scenario-11-action-3')
scenario11Action3.addEventListener('click', async () => {
  printMessage(11, 3)

  visitor = Flagship.newVisitor({
    visitorId: 'V3333'
  })

  printLocalStorage()
})

const scenario12Action1 = document.getElementById('scenario-12-action-1')
scenario12Action1.addEventListener('click', async () => {
  printMessage(12, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'cacheTest2',
    context: {
      is_scene_12: true
    }
  })

  await visitor.fetchFlags()

  console.log('flag', visitor.getFlag('scene_12', 0).getValue())

  printLocalStorage()
})

const scenario12Action2 = document.getElementById('scenario-12-action-2')
scenario12Action2.addEventListener('click', async () => {
  printMessage(12, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'cacheTest2',
    context: {
      is_scene_12: false
    }
  })

  await visitor.fetchFlags()

  console.log('flag', visitor.getFlag('scene_12', 0).getValue())

  printLocalStorage()
})
