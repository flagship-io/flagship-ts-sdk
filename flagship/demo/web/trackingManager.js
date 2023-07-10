// import { DecisionMode, EventCategory, Flagship, HitType, CacheStrategy } from '../../'

const ENV_ID = ''
const API_KEY = ''

const btnAction1 = document.getElementById('btn-action-1')

btnAction1.addEventListener('click', async () => {
// Initialize the SDK and send Initialize monitoring hit
  Flagship.start(ENV_ID, API_KEY, {
    decisionMode: DecisionMode.BUCKETING,
    // initialBucketing: bucketing
    // disableCache: true,
    pollingInterval: 30,
    fetchThirdPartyData: true,
    fetchNow: false,
    pollingInterval: 15,
    trackingMangerConfig: {
      // cacheStrategy: 3,
      poolMaxSize: 5,
      batchIntervals: 30
    }
  })
})

const btnAction2 = document.getElementById('btn-action-2')

let visitor
// scenario 1 action 1
btnAction2.addEventListener('click', async () => {
  // Create a visitor and send consent hit
  visitor = Flagship.newVisitor({
    visitorId: 'wonderful_visitor_1',
    // isAuthenticated: true,
    context: {
      qa_bucketing_integration: true
    }
  })
})

const btnAction3 = document.getElementById('btn-action-3')

btnAction3.addEventListener('click', async () => {
  // Fetch flags
  await visitor.fetchFlags()
})

const btnAction4 = document.getElementById('btn-action-4')

// scenario 1 action 1
btnAction4.addEventListener('click', async () => {
  // Send an activate hit
  const value = visitor.getFlag('appName', 'defaultValue').getValue()

  console.log('flag value', value)

  const value2 = visitor.getFlag('btnColor', 'defaultValue').getValue()

  console.log('flag value2', value2)
})

const btnAction5 = document.getElementById('btn-action-5')

btnAction5.addEventListener('click', async () => {
  visitor.setConsent(false)
})

const btnAction6 = document.getElementById('btn-action-6')

btnAction6.addEventListener('click', async () => {
  await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 2' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 3' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 4' })
  // await visitor.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 5' })
})

const btnAction7 = document.getElementById('btn-action-7')

btnAction7.addEventListener('click', async () => {
  const visitor2 = Flagship.newVisitor({
    visitorId: 'visitor-B',
    context: {
      testing_tracking_manager: true
    }
  })

  // Fetch flags
  await visitor2.fetchFlags()
  const value = visitor2.getFlag('my_flag', 'defaultValue').getValue()
  console.log('flag value', value)
  await visitor2.sendHit({ type: HitType.SCREEN, documentLocation: 'Screen 1' })
})

const btnAction8 = document.getElementById('btn-action-8')

btnAction8.addEventListener('click', async () => {
  await Flagship.close()
})

const btnAction9 = document.getElementById('btn-action-9')

btnAction9.addEventListener('click', async () => {
  const envId = ''
  const timestamp = new Date().toISOString()
  const url = 'https://events.flagship.io/troubleshooting'
  // const url = 'https://ariane.staging.abtasty.com/'
  // const url = 'https://ariane.staging.abtasty.com/troubleshooting'
  // const url = 'https://ariane.abtasty.com/simu'
  const sendBy = 'Merveille to endpoint ' + url
  const hits = [
    {
      vid: 'wonderful_visitor_1',
      ds: 'APP',
      cid: envId,
      t: 'TROUBLESHOOTING',
      cv: {
        logVersion: '1',
        LogLevel: 'INFO',
        timestamp,
        sendBy,
        timeZone: 'America/Chicago',
        component: 'Flagship SDK Typescript',
        subComponents: 'VISITOR-FETCH-CAMPAIGNS',
        message: 'VISITOR-FETCH-CAMPAIGNS',
        'stack.type': 'SDK',
        'stack.name': 'Typescript',
        'stack.version': '3.2.3',
        lastBucketingTimestamp: '2023-06-19T16:34:26.598Z',
        flagshipInstanceId: '2003d74d-d553-4f62-9265-5499efd1ec00',
        envId,
        'visitor.instanceId': '07fb8b42-7a73-4598-88d2-747646a7888f',
        'sdk.status': 'READY',
        'sdk.config.mode': 'BUCKETING',
        'sdk.config.timeout': '2',
        'sdk.config.pollingTime': '15',
        'sdk.config.trackingManager.config.strategy': 'CONTINUOUS_CACHING',
        'sdk.config.trackingManager.config.batchIntervals': '30',
        'sdk.config.trackingManager.config.poolMaxSize': '5',
        'sdk.config.trackingManager.config.fetchNow': 'false',
        'sdk.config.trackingManager.config.enableClientCache': 'true',
        'sdk.config.trackingManager.config.decisionApiUrl': 'https://decision.flagship.io/v2/',
        'sdk.config.trackingManager.config.deduplicationTime': '2.5',
        'http.response.time': '119',
        'visitor.context': '{"fs_client":"Typescript","fs_version":"3.2.3","fs_users":"wonderful_visitor_1","qa_bucketing_integration":true}',
        'visitor.consent': 'true',
        'visitor.assignmentsHistory': '{"cht4j0d77vnhmphn0700":"cht4j0d77vnhmphn070g","cehgd0ffdki0pvap7450":"cehgd0ffdki0pvap745g","cehgb43k5li0o2m2ui20":"cehgb43k5li0o2m2ui2g","cecu03ot8ti0afg8mi70":"cecu03ot8ti0afg8mi90","ccblmka7bde07sr4cqqg":"ccblmka7bde07sr4cqr0","cc71vulhk7601h4alqag":"cc71vulhk7601h4alqb0"}',
        'visitor.flags': '{"btnColor":"#28a745","showPromotion":"show","shopBtnVariant":null,"my_flag_key":"value 2","feature_payment_paypal_enable":true,"payment_cta_disabled_color":"#F2F2F2","payment_cta_enabled_color":"#1FA140","payment_cta_prefix_text":"Pay","payment_header_color":"#ee5c64","payment_header_title_text":"Flagship demo"}',
        'visitor.isAuthenticated': 'false',
        'visitor.campaigns': '[{"id":"cht4j0d77vnhmphn06v0","variation":{"id":"cht4j0d77vnhmphn070g","modifications":{"type":"FLAG","value":{"btnColor":"#28a745"}}},"variationGroupId":"cht4j0d77vnhmphn0700","type":"toggle"},{"id":"cehgd0ffdki0pvap7440","variation":{"id":"cehgd0ffdki0pvap745g","modifications":{"type":"FLAG","value":{"showPromotion":"show"}}},"variationGroupId":"cehgd0ffdki0pvap7450","type":"toggle"},{"id":"cehgb43k5li0o2m2ui10","variation":{"id":"cehgb43k5li0o2m2ui2g","modifications":{"type":"FLAG","value":{"shopBtnVariant":null}},"reference":true},"variationGroupId":"cehgb43k5li0o2m2ui20","type":"ab"},{"id":"cecu03ot8ti0afg8mi60","variation":{"id":"cecu03ot8ti0afg8mi90","modifications":{"type":"FLAG","value":{"my_flag_key":"value 2"}}},"variationGroupId":"cecu03ot8ti0afg8mi70","type":"ab","slug":"js-app-qa"},{"id":"ccblmka7bde07sr4cqpg","variation":{"id":"ccblmka7bde07sr4cqr0","modifications":{"type":"FLAG","value":{"feature_payment_paypal_enable":true}}},"variationGroupId":"ccblmka7bde07sr4cqqg","type":"toggle"},{"id":"cc71vulhk7601h4alq9g","variation":{"id":"cc71vulhk7601h4alqb0","modifications":{"type":"FLAG","value":{"payment_cta_disabled_color":"#F2F2F2","payment_cta_enabled_color":"#1FA140","payment_cta_prefix_text":"Pay","payment_header_color":"#ee5c64","payment_header_title_text":"Flagship demo"}}},"variationGroupId":"cc71vulhk7601h4alqag","type":"toggle"}]'
      }
    },
    {
      vid: 'wonderful_visitor_1',
      ds: 'APP',
      cid: envId,
      t: 'TROUBLESHOOTING',
      cv: {
        logVersion: '1',
        LogLevel: 'INFO',
        timestamp,
        sendBy,
        timeZone: 'America/Chicago',
        component: 'Flagship SDK Typescript',
        subComponents: 'VISITOR-SEND-HIT',
        message: 'VISITOR-SEND-HIT',
        'stack.type': 'SDK',
        'stack.name': 'Typescript',
        'stack.version': '3.2.3',
        flagshipInstanceId: '2003d74d-d553-4f62-9265-5499efd1ec00',
        envId,
        'visitor.instanceId': '07fb8b42-7a73-4598-88d2-747646a7888f',
        'hit.content': '{"vid":"wonderful_visitor_1","ds":"APP","cid":"cc71v52777606bpnr3n0","t":"EVENT","cuid":null,"qt":1391,"ec":"User Engagement","ea":"fs_consent","el":"Typescript:true"}'
      }
    },
    {
      vid: 'wonderful_visitor_1',
      ds: 'APP',
      cid: envId,
      t: 'TROUBLESHOOTING',
      cv: {
        logVersion: '1',
        LogLevel: 'INFO',
        sendBy,
        timestamp,
        timeZone: 'America/Chicago',
        component: 'Flagship SDK Typescript',
        subComponents: 'VISITOR-SEND-HIT',
        message: 'VISITOR-SEND-HIT',
        'stack.type': 'SDK',
        'stack.name': 'Typescript',
        'stack.version': '3.2.3',
        flagshipInstanceId: '2003d74d-d553-4f62-9265-5499efd1ec00',
        envId,
        'visitor.instanceId': '07fb8b42-7a73-4598-88d2-747646a7888f',
        'hit.content': '{"vid":"wonderful_visitor_1","ds":"APP","cid":"cc71v52777606bpnr3n0","t":"SEGMENT","cuid":null,"qt":6,"s":{"fs_client":"Typescript","fs_version":"3.2.3","fs_users":"wonderful_visitor_1","qa_bucketing_integration":true}}'
      }
    },
    {
      vid: '2003d74d-d553-4f62-9265-5499efd1ec00',
      ds: 'APP',
      cid: envId,
      t: 'TROUBLESHOOTING',
      cv: {
        logVersion: '1',
        LogLevel: 'INFO',
        sendBy,
        timestamp,
        timeZone: 'America/Chicago',
        component: 'Flagship SDK Typescript',
        subComponents: 'SDK-BUCKETING-FILE',
        message: 'SDK-BUCKETING-FILE',
        'stack.type': 'SDK',
        'stack.name': 'Typescript',
        'stack.version': '3.2.3',
        flagshipInstanceId: '2003d74d-d553-4f62-9265-5499efd1ec00',
        envId,
        'http.request.url': 'https://cdn.flagship.io/cc71v52777606bpnr3n0/bucketing.json',
        'http.request.method': 'POST',
        'http.request.headers': '{"x-api-key":"AYXPTTqtNbtIwsopebtRmmImdLIaLJonCGXdbeaa","x-sdk-client":"Typescript","x-sdk-version":"3.2.3","Content-Type":"application/json"}',
        'http.response.headers': '{"cache-control":"s-maxage=86400,max-age=30","content-type":"application/json","last-modified":"Mon, 19 Jun 2023 16:34:15 GMT"}',
        'http.response.code': '200',
        'http.response.body': '{"campaigns":[{"id":"cht4j0d77vnhmphn06v0","type":"toggle","variationGroups":[{"id":"cht4j0d77vnhmphn0700","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"fs_all_users","value":""}]}]},"variations":[{"id":"cht4j0d77vnhmphn070g","modifications":{"type":"FLAG","value":{"btnColor":"#28a745"}},"allocation":100}]}],"bucketRanges":[{"r":[0,100]}]},{"id":"cehgd0ffdki0pvap7440","type":"toggle","variationGroups":[{"id":"cehgd0ffdki0pvap7450","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"fs_all_users","value":""}]}]},"variations":[{"id":"cehgd0ffdki0pvap745g","modifications":{"type":"FLAG","value":{"showPromotion":"show"}},"allocation":100}]}],"bucketRanges":[{"r":[0,100]}]},{"id":"cehgb43k5li0o2m2ui10","type":"ab","variationGroups":[{"id":"cehgb43k5li0o2m2ui20","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"fs_all_users","value":""}]}]},"variations":[{"id":"cehgb43k5li0o2m2ui2g","modifications":{"type":"FLAG","value":{"shopBtnVariant":null}},"allocation":34,"reference":true},{"id":"cehgb43k5li0o2m2ui30","modifications":{"type":"FLAG","value":{"shopBtnVariant":"danger"}},"allocation":33},{"id":"cehgcgbanln0p0qqaou0","modifications":{"type":"FLAG","value":{"shopBtnVariant":"success"}},"allocation":33}]}],"bucketRanges":[{"r":[0,100]}]},{"id":"cecu03ot8ti0afg8mi60","slug":"js-app-qa","type":"ab","variationGroups":[{"id":"cecu03ot8ti0afg8mi70","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"fs_all_users","value":""}]}]},"variations":[{"id":"cecu03ot8ti0afg8mi7g","modifications":{"type":"FLAG","value":{"my_flag_key":null}},"reference":true},{"id":"cecu03ot8ti0afg8mi80","modifications":{"type":"FLAG","value":{"my_flag_key":"value 1 changed again"}},"allocation":40},{"id":"cecu03ot8ti0afg8mi8g","modifications":{"type":"FLAG","value":{"my_flag_key":"value 3"}},"allocation":30},{"id":"cecu03ot8ti0afg8mi90","modifications":{"type":"FLAG","value":{"my_flag_key":"value 2"}},"allocation":30}]}],"bucketRanges":[{"r":[0,100]}]},{"id":"ccblofa7bde07su6g5g0","type":"toggle","variationGroups":[{"id":"ccblqvgsfm000s41jimg","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"osName","value":["Android"]}]}]},"variations":[{"id":"ccblqvgsfm000s41jin0","modifications":{"type":"FLAG","value":{"feature_payment_applePay_enable":false,"feature_payment_googlePay_enable":true}},"allocation":100}]},{"id":"ccbls0qbg1fg3blfn8vg","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"osName","value":["iOS"]}]}]},"variations":[{"id":"ccbls0qbg1fg3blfn900","modifications":{"type":"FLAG","value":{"feature_payment_applePay_enable":true,"feature_payment_googlePay_enable":false}},"allocation":100}]}],"bucketRanges":[{"r":[0,100]}]},{"id":"ccblmka7bde07sr4cqpg","type":"toggle","variationGroups":[{"id":"ccblmka7bde07sr4cqqg","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"fs_all_users","value":""}]}]},"variations":[{"id":"ccblmka7bde07sr4cqr0","modifications":{"type":"FLAG","value":{"feature_payment_paypal_enable":true}},"allocation":100}]}],"bucketRanges":[{"r":[0,100]}]},{"id":"cc71vulhk7601h4alq9g","type":"toggle","variationGroups":[{"id":"cc71vulhk7601h4alqag","targeting":{"targetingGroups":[{"targetings":[{"operator":"EQUALS","key":"fs_all_users","value":""}]}]},"variations":[{"id":"cc71vulhk7601h4alqb0","modifications":{"type":"FLAG","value":{"payment_cta_disabled_color":"#F2F2F2","payment_cta_enabled_color":"#1FA140","payment_cta_prefix_text":"Pay","payment_header_color":"#ee5c64","payment_header_title_text":"Flagship demo"}},"allocation":100}]}],"bucketRanges":[{"r":[0,100]}]}],"accountSettings":{"enabledXPC":true,"troubleshooting":{"startDate":"2023-06-19T16:34:01.234Z","endDate":"2023-06-19T17:04:01.234Z","traffic":100}}}',
        'http.response.time': '270'
      }
    },
    {
      vid: 'wonderful_visitor_1',
      ds: 'APP',
      cid: envId,
      t: 'TROUBLESHOOTING',
      cv: {
        logVersion: '1',
        LogLevel: 'WARNING',
        sendBy,
        timestamp,
        timeZone: 'America/Chicago',
        component: 'Flagship SDK Typescript',
        subComponents: 'GET-FLAG-VALUE-FLAG-NOT-FOUND',
        message: 'GET-FLAG-VALUE-FLAG-NOT-FOUND',
        'stack.type': 'SDK',
        'stack.name': 'Typescript',
        'stack.version': '3.2.3',
        flagshipInstanceId: '2003d74d-d553-4f62-9265-5499efd1ec00',
        envId,
        'visitor.instanceId': '07fb8b42-7a73-4598-88d2-747646a7888f',
        'visitor.context': '{"fs_client":"Typescript","fs_version":"3.2.3","fs_users":"wonderful_visitor_1","qa_bucketing_integration":true}',
        'flag.key': 'appName',
        'flag.default': '"defaultValue"'
      }
    },
    {
      vid: 'wonderful_visitor_1',
      ds: 'APP',
      cid: envId,
      t: 'TROUBLESHOOTING',
      cv: {
        logVersion: '1',
        LogLevel: 'INFO',
        sendBy,
        timestamp,
        timeZone: 'America/Chicago',
        component: 'Flagship SDK Typescript',
        subComponents: 'VISITOR-SEND-ACTIVATE',
        message: 'VISITOR-SEND-ACTIVATE',
        'stack.type': 'SDK',
        'stack.name': 'Typescript',
        'stack.version': '3.2.3',
        flagshipInstanceId: '2003d74d-d553-4f62-9265-5499efd1ec00',
        envId,
        'visitor.instanceId': '07fb8b42-7a73-4598-88d2-747646a7888f',
        'hit.content': '{"vid":"wonderful_visitor_1","vaid":"cht4j0d77vnhmphn070g","caid":"cht4j0d77vnhmphn0700","cid":"cc71v52777606bpnr3n0","aid":null}'
      }
    }
  ]

  hits.forEach(item => {
    fetch(url, {
      mode: 'no-cors',
      method: 'POST',
      headers: [['content-type', 'application/json']],
      body: JSON.stringify(item)
    }).then(async (response) => {
      console.log('response', await response.text())
    }).catch(err => {
      console.log('err', err)
    })
  })
})
