export const myFetch = (input: RequestInfo | URL, init?: RequestInit):Promise<Response> => fetch(input, init);
export { EventEmitter } from 'events';
export { LocalAbortController } from './LocalAbortController';
