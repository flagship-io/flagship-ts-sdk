import { VisitorEvent } from '../../../src/emotionAI/hit/VisitorEvent';

describe('VisitorEvent', () => {
  test('should assign all properties correctly', () => {
    const data = {
      customerAccountId: 'CID123',
      visitorId: 'visitor_456',
      currentUrl: 'https://example.com',
      clickPath: '100,200,12345;',
      clickPosition: '100,200,12345,150;',
      screenSize: '1024,768;',
      scrollPosition: '500,12345;'
    };
    const event = new VisitorEvent(data);
    expect(event.customerAccountId).toBe(data.customerAccountId);
    expect(event.visitorId).toBe(data.visitorId);
    expect(event.currentUrl).toBe(data.currentUrl);
    expect(event.clickPath).toBe(data.clickPath);
    expect(event.clickPosition).toBe(data.clickPosition);
    expect(event.screenSize).toBe(data.screenSize);
    expect(event.scrollPosition).toBe(data.scrollPosition);
  });

  test('should handle optional properties correctly', () => {
    const data = {
      customerAccountId: 'CID123',
      visitorId: 'visitor_456',
      currentUrl: 'https://example.com',
      screenSize: '1024,768;'
    };
    const event = new VisitorEvent(data);
    expect(event.clickPath).toBeUndefined();
    expect(event.clickPosition).toBeUndefined();
    expect(event.scrollPosition).toBeUndefined();
  });

  test('toApiKeys should return correct keys with all properties', () => {
    const data = {
      customerAccountId: 'CID123',
      visitorId: 'visitor_456',
      currentUrl: 'https://example.com',
      clickPath: '100,200,12345;',
      clickPosition: '100,200,12345,150;',
      screenSize: '1024,768;',
      scrollPosition: '500,12345;'
    };
    const event = new VisitorEvent(data);
    const apiKeys = event.toApiKeys();
    expect(apiKeys).toEqual({
      cid: 'CID123',
      vid: 'visitor_456',
      dl: 'https://example.com',
      sr: '1024,768;',
      t: 'VISITOREVENT',
      cp: '100,200,12345;',
      cpo: '100,200,12345,150;',
      sp: '500,12345;'
    });
  });

  test('toApiKeys should omit optional keys when they are not provided', () => {
    const data = {
      customerAccountId: 'CID123',
      visitorId: 'visitor_456',
      currentUrl: 'https://example.com',
      screenSize: '1024,768;'
    };
    const event = new VisitorEvent(data);
    const apiKeys = event.toApiKeys();
    expect(apiKeys).toEqual({
      cid: 'CID123',
      vid: 'visitor_456',
      dl: 'https://example.com',
      sr: '1024,768;',
      t: 'VISITOREVENT'
    });
  });
});
