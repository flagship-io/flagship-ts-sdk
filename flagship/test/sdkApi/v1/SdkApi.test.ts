import { SdkApi } from '../../../src/sdkApi/v1/SdkApi'
import { ISharedActionTracking } from '../../../src/sharedFeature/ISharedActionTracking'

describe('SdkApi', () => {
  it('should return nonce when generateNonce returns a valid string', () => {
    const expectedNonce = '12345'
    const mockSharedActionTracking = {
      generateNonce: jest.fn(() => expectedNonce)
    } as unknown as ISharedActionTracking

    const sdkApi = new SdkApi({ sharedActionTracking: mockSharedActionTracking })
    const nonce = sdkApi.getActionTrackingNonce()

    expect(nonce).toEqual(expectedNonce)
    expect(mockSharedActionTracking.generateNonce).toHaveBeenCalled()
  })

  it('should return undefined when sharedActionTracking is not provided', () => {
    const sdkApi = new SdkApi({ sharedActionTracking: undefined })
    const nonce = sdkApi.getActionTrackingNonce()

    expect(nonce).toBeUndefined()
  })
})
