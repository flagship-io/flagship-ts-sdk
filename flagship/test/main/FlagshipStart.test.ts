import { jest, expect, it, describe } from '@jest/globals'
import { Flagship, Visitor } from '../../src'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { FSSdkStatus, METHOD_DEACTIVATED_ERROR } from '../../src/enum'
import { sprintf } from '../../src/utils/utils'

describe('Test newVisitor without starting the SDK', () => {
  const logManager = new FlagshipLogManager()

  const errorLog = jest.spyOn(logManager, 'error')

  it('should ', () => {
    const visitor = Flagship.newVisitor({ visitorId: 'visitorId', context: { key: 'value' }, hasConsented: true })
    expect(visitor).toBeInstanceOf(Visitor)
    visitor.config.logManager = logManager
    visitor.fetchFlags()
    expect(errorLog).toBeCalledTimes(1)
    const message = sprintf(METHOD_DEACTIVATED_ERROR, visitor.visitorId, 'fetchFlags', FSSdkStatus[FSSdkStatus.SDK_NOT_INITIALIZED])
    expect(errorLog).toBeCalledWith(message, 'fetchFlags')
  })
})
