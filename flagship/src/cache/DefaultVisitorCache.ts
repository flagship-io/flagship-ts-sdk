import { VisitorCacheDTO } from '../types';
import { IVisitorCacheImplementation } from './IVisitorCacheImplementation';

export const VISITOR_PREFIX = 'FS_VISITOR_CACHE_';
export class DefaultVisitorCache implements IVisitorCacheImplementation {
  cacheVisitor(visitorId: string, data:VisitorCacheDTO): Promise<void> {
    localStorage.setItem(VISITOR_PREFIX + visitorId, JSON.stringify(data));
    return Promise.resolve();
  }

  lookupVisitor(visitorId: string): Promise<VisitorCacheDTO> {
    const data = localStorage.getItem(VISITOR_PREFIX + visitorId);
    return Promise.resolve(data ? JSON.parse(data) : null);
  }

  flushVisitor(visitorId: string): Promise<void> {
    localStorage.removeItem(VISITOR_PREFIX + visitorId);
    return Promise.resolve();
  }
}
