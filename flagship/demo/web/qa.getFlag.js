const ENV_ID = ''
const API_KEY = ''

const printMessage = (scenario, action) => {
  console.log(`########### SCENARIO ${scenario} ACTION ${action} ##############`)
}

const printLocalStorage = () => {
  console.log('localStorage:', { ...localStorage })
}

Flagship.start(ENV_ID, API_KEY, {
//   decisionMode: DecisionMode.BUCKETING,
  fetchNow: false,
  timeout: 10,
  pollingInterval: 5
})

let visitor

let flag

const btnAction1 = document.getElementById('scenario-1action-1')
// scenario 1 action 1
btnAction1.addEventListener('click', async () => {
  printMessage(1, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    context: {
      qa_getflag: true
    }
  })

  await visitor.fetchFlags()

  flag = visitor.getFlag('qa_flag', 'default')

  console.log('flag:', flag.value())

  console.log('metadata', flag.metadata.toJSON())

  console.log('flag exist:', flag.exists())
})

const btnAction2 = document.getElementById('scenario-1-action-2')

btnAction2.addEventListener('click', async () => {
  await flag.userExposed()
})
