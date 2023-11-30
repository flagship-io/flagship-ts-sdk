// import { DecisionMode, EventCategory, Flagship, HitType, CacheStrategy } from '../../'
const ENV_ID = 'c1ndrd07m0300ro0jf20'
const API_KEY = 'QzdTI1M9iqaIhnJ66a34C5xdzrrvzq6q8XSVOsS6'

Flagship.start(ENV_ID, API_KEY, {
  // decisionMode: DecisionMode.BUCKETING,
  // initialBucketing: bucketing
  // disableCache: true,
  enableQAMode: true,
  pollingInterval: 30,
  fetchThirdPartyData: true,
  fetchNow: false,
  trackingMangerConfig: {
    // cacheStrategy: 3,
    poolMaxSize: 5,
    batchIntervals: 30
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
