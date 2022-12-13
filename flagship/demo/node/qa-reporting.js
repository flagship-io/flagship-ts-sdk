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

Flagship.start(ENV_ID, API_KEY, {
  logLevel: LogLevel.INFO,
  timeout: 10,
  fetchNow: false
})

async function scenario1 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor_a',
    context: { qa_report: true, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 1: ', flag.getValue())

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA'
  })

  await visitor.sendHit({
    type: HitType.EVENT,
    action: 'KP2',
    category: EventCategory.ACTION_TRACKING
  })

  console.log('sent hit')
}

async function scenario2 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'zZz_visitor_zZz',
    context: { qa_report: true, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 2: ', flag.getValue())

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA'
  })

  await visitor.sendHit({
    type: HitType.EVENT,
    action: 'KP2',
    category: EventCategory.ACTION_TRACKING
  })

  console.log('sent hit')
}

async function scenario3 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor_0_0',
    context: { qa_report: true, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 3: ', flag.getValue(false))

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA'
  })

  await visitor.sendHit({
    type: HitType.EVENT,
    category: EventCategory.ACTION_TRACKING,
    action: 'KP2'
  })

  console.log('sent hit')
}

async function scenario4 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor_B_B',
    context: { qa_report: true, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 4: ', flag.getValue(true))
}

async function scenario5 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor_1111',
    context: { qa_report: true, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 5: ', flag.getValue())

  visitor.setConsent(false)

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA'
  })

  await visitor.sendHit({
    type: HitType.EVENT,
    action: 'KP2',
    category: EventCategory.ACTION_TRACKING
  })
}

async function scenario6 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor_22',
    context: { qa_report: false, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 6: ', flag.getValue())

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA'
  })

  await visitor.sendHit({
    type: HitType.EVENT,
    action: 'KP2',
    category: EventCategory.ACTION_TRACKING
  })
}

async function scenario7 () {
  const visitor = Flagship.newVisitor({
    visitorId: 'visitor_333',
    hasConsented: true,
    context: { qa_report: true, is_js: true, test_qa: true }
  })

  await visitor.fetchFlags()

  const flag = visitor.getFlag('qa_report_var', 'test')
  console.log('flag.getValue 7: ', flag.getValue(false))

  await flag.userExposed()

  await visitor.sendHit({
    type: HitType.SCREEN,
    documentLocation: 'I LOVE QA'
  })

  console.log('userExposed')
}

async function start () {
  // await sleep(5000)
  await scenario1()
  await scenario2()
  await scenario3()
  await scenario4()
  await scenario5()
  await scenario6()
}

start()
