import { expect, it, describe } from '@jest/globals'
import { globalOption } from '../src/nodeDeps'
import { Agent as HttpAgents } from 'https'
import { Agent as HttpAgent } from 'http'

describe('test agent', () => {
  it('should ', () => {
    if (typeof globalOption.agent === 'function') {
      const agent = globalOption.agent(new URL('https://127.0.0.1'))
      expect(agent).toBeInstanceOf(HttpAgents)
    }
  })
  it('should ', () => {
    if (typeof globalOption.agent === 'function') {
      const agent = globalOption.agent(new URL('http://127.0.0.1'))
      expect(agent).toBeInstanceOf(HttpAgent)
    }
  })
})
