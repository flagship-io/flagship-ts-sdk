
export function sleep (ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
interface GlobalOverrides {
    [key: string]: unknown;
  }

const originalGlobals = new Map<string, unknown>()

/**
   * Overrides specified properties on the global object.
   * Backs up existing values so they can be restored later.
   *
   * @param overrideProps An object containing property/value pairs to mock on the global object.
   */
export function mockGlobals (overrideProps: GlobalOverrides): void {
  for (const [key, value] of Object.entries(overrideProps)) {
    (global as any)[key] = value
  }
}

/**
   * Restores any globals that were previously overridden via mockGlobals.
   * Useful for test cleanup.
   */
export function restoreGlobals (): void {
  for (const [key, value] of originalGlobals.entries()) {
    (global as any)[key] = value
  }
  originalGlobals.clear()
}
