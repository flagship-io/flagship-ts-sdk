import { Modification } from '../../src/model/Modification'
import { expect, it, describe } from '@jest/globals'

describe('Test model Modification', () => {
  it('should ', () => {
    const key = 'key'
    const campaignId = 'campaignId'
    const variationGroupId = 'variationGroupId'
    const variationId = 'variationId'
    const isReference = true
    const value = 'value'
    const modification = new Modification(
      key,
      campaignId,
      variationGroupId,
      variationId,
      isReference,
      value
    )
    expect(modification.key).toBe(key)
    expect(modification.campaignId).toBe(campaignId)
    expect(modification.variationGroupId).toBe(variationGroupId)
    expect(modification.variationId).toBe(variationId)
    expect(modification.isReference).toBe(isReference)
    expect(modification.value).toBe(value)
  })
})
