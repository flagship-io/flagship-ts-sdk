import { jest, expect, it, describe } from '@jest/globals'
import { DecisionApiConfig, EventCategory } from '../../src'
import { TrackingManager } from '../../src/api/TrackingManager'
import { ConfigManager } from '../../src/config'
import { ApiManager } from '../../src/decision/ApiManager'
import { HitType } from '../../src/enum'
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager'
import { HttpClient, IHttpResponse, IHttpOptions } from '../../src/utils/HttpClient'
import { VisitorDelegate, DefaultStrategy } from '../../src/visitor'
import { Mock } from 'jest-mock'
import { returnModification } from './modification'

describe('Name of the group', () => {
  const visitorId = 'visitorId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context: any = {
    isVip: true
  }

  const logManager = new FlagshipLogManager()
  const logError = jest.spyOn(logManager, 'error')

  const config = new DecisionApiConfig({ envId: 'envId', apiKey: 'apiKey' })
  config.logManager = logManager

  const httpClient = new HttpClient()

  const post: Mock<
      Promise<IHttpResponse>,
      [url: string, options: IHttpOptions]
    > = jest.fn()
  httpClient.postAsync = post
  post.mockResolvedValue({} as IHttpResponse)

  const apiManager = new ApiManager(httpClient, config)

  const trackingManager = new TrackingManager(httpClient, config)

  const sendActive = jest.spyOn(trackingManager, 'sendActive')
  const sendHit = jest.spyOn(trackingManager, 'sendHit')

  const configManager = new ConfigManager(config, apiManager, trackingManager)

  const visitorDelegate = new VisitorDelegate({ visitorId, context, configManager })
  const defaultStrategy = new DefaultStrategy(visitorDelegate)

  const getModifications = jest.spyOn(
    apiManager,
    'getModifications'
  )

  const getCampaignsAsync = jest.spyOn(
    apiManager,
    'getCampaignsAsync'
  )

  it('should ', async () => {
    getCampaignsAsync.mockResolvedValue([])
    getModifications.mockReturnValue(returnModification)
    await defaultStrategy.synchronizeModifications()
  })

  it('should ', async () => {
    const key = 'keyString'
    await defaultStrategy.activateModification(key)
    await defaultStrategy.activateModification(key)
    await defaultStrategy.activateModification(key)
    await defaultStrategy.activateModification('keyNumber')
    await defaultStrategy.activateModification('keyNumber')
    expect(sendActive).toBeCalledTimes(2)
  })

  it('test sendHitAsync with literal object Event ', async () => {
    try {
      const hit = {
        type: HitType.EVENT,
        action: 'action_1',
        category: EventCategory.ACTION_TRACKING
      }
      await defaultStrategy.sendHit(hit)
      await defaultStrategy.sendHit(hit)
      await defaultStrategy.sendHit({ ...hit, action: 'action_2' })
      await defaultStrategy.sendHit({ ...hit, action: 'action_2' })
      await defaultStrategy.sendHit({ ...hit, action: 'action_2' })
      expect(sendHit).toBeCalledTimes(2)
    } catch (error) {
      console.log(error)
      expect(logError).toBeCalled()
    }
  })
})
