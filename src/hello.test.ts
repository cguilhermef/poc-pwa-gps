import { describe, it, expect } from 'vitest'

describe('Hello World', () => {
  it('should return hello world', () => {
    const message = 'Hello World'
    expect(message).toBe('Hello World')
  })

  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2)
  })
})
