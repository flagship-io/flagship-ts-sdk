import Flagship, {
  DecisionMode,
  EventCategory,
  FlagshipStatus,
  HitType,
  Item,
  LogLevel,
  Transaction
} from '../../'
import { API_KEY, ENV_ID } from './config.js'

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Flagship.start(ENV_ID, API_KEY, {
  timeout: 10,
  fetchNow: false
})

async function scenario1 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'anonymous_1',
    context: { qa_report_xpc: true, is_js: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_xpc', 'test')
  console.log('flag.getValue 1: ', flag.getValue())

  await sleep(3000)

  visitor.authenticate('logged_1')

  await visitor.fetchFlags()

  const flagXp = visitor.getFlag('qa_report_xpc', 'test')
  console.log('flagXp.getValue 1: ', flagXp.getValue())

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I DON\'T LOVE QA XPC'
  })

  await sleep(3000)

  visitor.unauthenticate()

  const flagAnonymous = visitor.getFlag('qa_report_xpc', 'test')
  console.log('flagAnonymous.getValue 1: ', flagAnonymous.getValue())

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA XPC'
  })
}

async function start () {
  await scenario1()
}

start()
