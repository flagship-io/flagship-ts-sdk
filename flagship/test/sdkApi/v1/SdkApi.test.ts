import { SdkApi } from '../../../src/sdkApi/v1/SdkApi';
import { ISharedActionTracking } from '../../../src/sharedFeature/ISharedActionTracking';
import { VisitorAbstract } from '../../../src/visitor/VisitorAbstract';

describe('SdkApi', () => {
  it('should return nonce when generateNonce returns a valid string', () => {
    const expectedNonce = '12345';
    const mockSharedActionTracking = { generateNonce: jest.fn(() => expectedNonce) } as unknown as ISharedActionTracking;

    const sdkApi = new SdkApi({ sharedActionTracking: mockSharedActionTracking });
    const nonce = sdkApi.getApiV1()._getActionTrackingNonce();

    expect(nonce).toEqual(expectedNonce);
    expect(mockSharedActionTracking.generateNonce).toHaveBeenCalled();
  });

  it('should return undefined when sharedActionTracking is not provided', () => {
    const sdkApi = new SdkApi({ sharedActionTracking: undefined });
    const nonce = sdkApi.getApiV1()._getActionTrackingNonce();

    expect(nonce).toBeUndefined();
  });

  it('should _getVisitorId return undefined when visitor instance is not provided', () => {
    const sdkApi = new SdkApi({  });
    const visitorId = sdkApi.getApiV1()._getVisitorId();
    expect(visitorId).toBeUndefined();
  });

  it('should _getVisitorId return visitorId when visitor instance is provided', () => {
    const expectedVisitorId = 'visitor123';
    const mockVisitor = { visitorId: expectedVisitorId } as unknown as VisitorAbstract;
    const sdkApi = new SdkApi({});
    sdkApi.setVisitor(mockVisitor as any);
    const visitorId = sdkApi.getApiV1()._getVisitorId();

    expect(visitorId).toEqual(expectedVisitorId);
  });

  it('should _getVisitorId return visitorId when visitor instance is provided', () => {
    const expectedVisitorId = 'visitor123';
    const mockVisitor = { visitorId: expectedVisitorId } as unknown as VisitorAbstract;
    const sdkApi = new SdkApi({});
    const apiV1 = sdkApi.getApiV1();
    sdkApi.setVisitor(mockVisitor as any);
    const visitorId = apiV1._getVisitorId();

    expect(visitorId).toEqual(expectedVisitorId);
  });

});
