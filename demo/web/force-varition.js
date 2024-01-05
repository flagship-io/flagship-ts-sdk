// import { DecisionMode, EventCategory, Flagship, HitType, CacheStrategy, LogLevel } from '../../'
const ENV_ID = ''
const API_KEY = ''

Flagship.start(ENV_ID, API_KEY, {
  // decisionMode: DecisionMode.BUCKETING,
  // initialBucketing: bucketing
  // disableCache: true,
  pollingInterval: 30,
  fetchThirdPartyData: true,
  fetchNow: false,
  logLevel: LogLevel.INFO,
  trackingMangerConfig: {
    // cacheStrategy: 3,
    poolMaxSize: 5,
    batchIntervals: 10
  }
})

const createVisitorBtn = document.getElementById('create-visitor-btn')
createVisitorBtn.addEventListener('click', () => {
  // Create a visitor and send consent hit
  const visitor = Flagship.newVisitor({
    visitorId: 'my_visitor_id',
    // isAuthenticated: true,
    context: {
      plan: 'premium',
      qa_report: true,
      is_php: true
    }
  })

  visitor.fetchFlags().then(() => {
    const myFlagKey = visitor.getFlag('my_flag_key', 'defaultValue')
    document.getElementById('my_flag_key').innerText = myFlagKey.getValue()

    const jsQaApp = visitor.getFlag('js-qa-app', 'default')
    document.getElementById('jsQaApp').innerText = jsQaApp.getValue()

    const hasNewFavicon = visitor.getFlag('hasNewFavicon', false)
    document.getElementById('hasNewFavicon').innerText = hasNewFavicon.getValue()

    const myAwesomeFeature = visitor.getFlag('myAwesomeFeature', -1)
    document.getElementById('myAwesomeFeature').innerText = myAwesomeFeature.getValue()

    const qaReportVar = visitor.getFlag('qa_report_var', 'F')
    console.log(qaReportVar.getValue())
  })
})

const visitor = Flagship.newVisitor({
  visitorId: 'my_visitor_id',
  // isAuthenticated: true,
  context: {
    plan: 'premium',
    qa_report: true,
    is_php: true
  }
})

visitor.fetchFlags().then(() => {
  const myFlagKey = visitor.getFlag('my_flag_key', 'defaultValue')
  document.getElementById('my_flag_key').innerText = myFlagKey.getValue()

  const jsQaApp = visitor.getFlag('js-qa-app', 'default')
  document.getElementById('jsQaApp').innerText = jsQaApp.getValue()

  const hasNewFavicon = visitor.getFlag('hasNewFavicon', false)
  document.getElementById('hasNewFavicon').innerText = hasNewFavicon.getValue()

  const myAwesomeFeature = visitor.getFlag('myAwesomeFeature', -1)
  document.getElementById('myAwesomeFeature').innerText = myAwesomeFeature.getValue()

  const qaReportVar = visitor.getFlag('qa_report_var', 'F')
  console.log(qaReportVar.getValue())
})

const btnSendHit = document.getElementById('btn-send-hit')
btnSendHit.addEventListener('click', () => {
  visitor.sendHit({
    type: HitType.EVENT,
    action: 'Click',
    category: EventCategory.ACTION_TRACKING
  })
})
