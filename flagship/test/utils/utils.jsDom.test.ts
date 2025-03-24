/**
 * @jest-environment jsdom
 */

import { onDomReady } from '../../src/utils/utils'
import { jest, expect, it, describe } from '@jest/globals'
import { mockGlobals } from '../helpers'

describe('Test onDomReady function', () => {
  const originalReadyState = document.readyState
  afterEach(() => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => originalReadyState
    })
  })

  beforeEach(() => {
    mockGlobals({
      __fsWebpackIsBrowser__: true
    })
  })

  it('should execute callback immediately when DOM is ready (complete)', () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete'
    })
    const callback = jest.fn()
    const result = onDomReady(callback)
    expect(callback).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should register event listener and execute callback when DOMContentLoaded fires (loading)', () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading'
    })
    const callback = jest.fn()
    const result = onDomReady(callback)
    expect(callback).not.toHaveBeenCalled()
    expect(result).toBe(false)
    // simulate DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'))
    expect(callback).toHaveBeenCalled()
  })

  it('should return current DOM state when no callback is provided', () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete'
    })
    const result = onDomReady()
    expect(result).toBe(true)
  })

  it('should NOT execute callback immediately when DOM is ready and __fsWebpackIsBrowser__ is false', () => {
    mockGlobals({
      __fsWebpackIsBrowser__: false
    })
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete'
    })
    const callback = jest.fn()
    const result = onDomReady(callback)
    expect(callback).not.toHaveBeenCalled()
    expect(result).toBeFalsy()
  })
})
