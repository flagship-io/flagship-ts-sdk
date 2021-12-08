const ENV_ID = 'bk87t3jggr10c6l6sdog'
const API_KEY = 'N1Rm3DsCBrahhnGTzEnha31IN4DK8tXl28IykcCX'

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

const btnAction21 = document.getElementById('scenario-2-action-1')

btnAction21.addEventListener('click', async () => {
  printMessage(2, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    context: {
      qa_getflag: true
    }
  })

  await visitor.fetchFlags()

  flag = visitor.getFlag('qa_flag', 10)

  console.log('flag:', flag.value())

  console.log('flag exist:', flag.exists())

  console.log('metadata', flag.metadata.toJSON())

  await flag.userExposed()
})

const btnAction22 = document.getElementById('scenario-2-action-2')

btnAction22.addEventListener('click', async () => {
  printMessage(2, 2)

  visitor = Flagship.newVisitor({
    visitorId: 'visitor-A',
    context: {
      qa_getflag: true
    }
  })

  await visitor.fetchFlags()

  flag = visitor.getFlag('wrong', 10)

  console.log('flag:', flag.value())

  console.log('flag exist:', flag.exists())

  console.log('metadata', flag.metadata.toJSON())

  await flag.userExposed()
})

const btnAction31 = document.getElementById('scenario-3-action-1')

btnAction31.addEventListener('click', async () => {
  printMessage(3, 1)

  visitor = Flagship.newVisitor({
    visitorId: 'visitor-F',
    context: {
      qa_getflag: true
    }
  })

  await visitor.fetchFlags()

  flag = visitor.getFlag('qa_flag', 10)

  console.log('flag:', flag.value())

  console.log('flag exist:', flag.exists())

  console.log('metadata', flag.metadata.toJSON())
})

const btnAction32 = document.getElementById('scenario-3-action-2')

btnAction32.addEventListener('click', async () => {
  printMessage(3, 2)

  console.log('flag:', flag.value(false))
})

const btnAction33 = document.getElementById('scenario-3-action-3')
btnAction33.addEventListener('click', async () => {
  printMessage(3, 3)

  await flag.userExposed()
})

const btnAction34 = document.getElementById('scenario-3-action-4')
btnAction34.addEventListener('click', async () => {
  printMessage(3, 4)

  flag = visitor.getFlag('qa_flag', 'default')

  console.log('flag:', flag.value())
})

const btnAction35 = document.getElementById('scenario-3-action-5')
btnAction35.addEventListener('click', async () => {
  printMessage(3, 5)

  flag = visitor.getFlag('qa_flag', null)

  console.log('flag:', flag.value())
  console.log('metadata', flag.metadata.toJSON())
})
