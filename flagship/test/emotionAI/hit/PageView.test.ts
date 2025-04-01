import { PageView } from '../../../src/emotionAI/hit/PageView';

describe('PageView', () => {
  const sampleData = {
    customerAccountId: 'CID123456789',
    visitorId: 'visitor_67890',
    hasAdBlocker: true,
    screenDepth: '24',
    screenSize: '1920x1080',
    doNotTrack: '1',
    fonts: '["arial", "arial black"]',
    hasFakeBrowserInfos: false,
    hasFakeLanguageInfos: false,
    hasFakeOsInfos: false,
    hasFakeResolutionInfos: false,
    userLanguage: 'en-US',
    deviceCategory: 'iphone',
    pixelRatio: 2,
    plugins: '["edge pdf viewer::portable document format::application/pdf~pdf"]',
    documentReferer: 'https://example.com',
    viewportSize: '[1920,1080]',
    touchSupport: '[0,false,false]',
    currentUrl: 'https://example.com/reports/12345',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    customerUserId: '12345',
    timezoneOffset: 240,
    eventCategory: 'click tunnel auto'
  };

  let pageView: PageView;

  beforeEach(() => {
    pageView = new PageView(sampleData);
  });

  test('should initialize all properties correctly', () => {
    expect(pageView.customerAccountId).toBe(sampleData.customerAccountId);
    expect(pageView.visitorId).toBe(sampleData.visitorId);
    expect(pageView.hasAdBlocker).toBe(sampleData.hasAdBlocker);
    expect(pageView.screenDepth).toBe(sampleData.screenDepth);
    expect(pageView.screenSize).toBe(sampleData.screenSize);
    expect(pageView.doNotTrack).toBe(sampleData.doNotTrack);
    expect(pageView.fonts).toBe(sampleData.fonts);
    expect(pageView.hasFakeBrowserInfos).toBe(sampleData.hasFakeBrowserInfos);
    expect(pageView.hasFakeLanguageInfos).toBe(sampleData.hasFakeLanguageInfos);
    expect(pageView.hasFakeOsInfos).toBe(sampleData.hasFakeOsInfos);
    expect(pageView.hasFakeResolutionInfos).toBe(sampleData.hasFakeResolutionInfos);
    expect(pageView.userLanguage).toBe(sampleData.userLanguage);
    expect(pageView.deviceCategory).toBe(sampleData.deviceCategory);
    expect(pageView.pixelRatio).toBe(sampleData.pixelRatio);
    expect(pageView.plugins).toBe(sampleData.plugins);
    expect(pageView.documentReferer).toBe(sampleData.documentReferer);
    expect(pageView.viewportSize).toBe(sampleData.viewportSize);
    expect(pageView.touchSupport).toBe(sampleData.touchSupport);
    expect(pageView.currentUrl).toBe(sampleData.currentUrl);
    expect(pageView.userAgent).toBe(sampleData.userAgent);
    expect(pageView.customerUserId).toBe(sampleData.customerUserId);
    expect(pageView.timezoneOffset).toBe(sampleData.timezoneOffset);
    expect(pageView.eventCategory).toBe(sampleData.eventCategory);
  });

  test('toApiKeys should return correct mapping with all fields', () => {
    const apiKeys = pageView.toApiKeys();
    expect(apiKeys).toEqual({
      cid: sampleData.customerAccountId,
      vid: sampleData.visitorId,
      adb: sampleData.hasAdBlocker,
      sd: sampleData.screenDepth,
      sr: sampleData.screenSize,
      dnt: sampleData.doNotTrack,
      fnt: sampleData.fonts,
      hlb: sampleData.hasFakeBrowserInfos,
      hll: sampleData.hasFakeLanguageInfos,
      hlo: sampleData.hasFakeOsInfos,
      hlr: sampleData.hasFakeResolutionInfos,
      ul: sampleData.userLanguage,
      dc: sampleData.deviceCategory,
      pxr: sampleData.pixelRatio,
      dr: sampleData.documentReferer,
      vp: sampleData.viewportSize,
      tof: sampleData.timezoneOffset,
      tsp: sampleData.touchSupport,
      dl: sampleData.currentUrl,
      ua: sampleData.userAgent,
      ec: sampleData.eventCategory,
      t: 'PAGEVIEW',
      plu: sampleData.plugins,
      cuid: sampleData.customerUserId
    });
  });

  test('toApiKeys should exclude optional fields when undefined', () => {
    const dataWithoutOptional = {
      ...sampleData,
      plugins: undefined,
      customerUserId: undefined
    };
    const pageViewWithoutOptional = new PageView(dataWithoutOptional);
    const apiKeys = pageViewWithoutOptional.toApiKeys();
    expect(apiKeys).toEqual({
      cid: dataWithoutOptional.customerAccountId,
      vid: dataWithoutOptional.visitorId,
      adb: dataWithoutOptional.hasAdBlocker,
      sd: dataWithoutOptional.screenDepth,
      sr: dataWithoutOptional.screenSize,
      dnt: dataWithoutOptional.doNotTrack,
      fnt: dataWithoutOptional.fonts,
      hlb: dataWithoutOptional.hasFakeBrowserInfos,
      hll: dataWithoutOptional.hasFakeLanguageInfos,
      hlo: dataWithoutOptional.hasFakeOsInfos,
      hlr: dataWithoutOptional.hasFakeResolutionInfos,
      ul: dataWithoutOptional.userLanguage,
      dc: dataWithoutOptional.deviceCategory,
      pxr: dataWithoutOptional.pixelRatio,
      dr: dataWithoutOptional.documentReferer,
      vp: dataWithoutOptional.viewportSize,
      tof: dataWithoutOptional.timezoneOffset,
      tsp: dataWithoutOptional.touchSupport,
      dl: dataWithoutOptional.currentUrl,
      ua: dataWithoutOptional.userAgent,
      ec: dataWithoutOptional.eventCategory,
      t: 'PAGEVIEW'
    });
  });
});
