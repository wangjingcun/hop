import { wait } from '#utils/wait.js'

export async function retryPromise(fn: (...a: any[]) => Promise<any>, ...args: any[]) {
  const maxRetries = 5
  let retries = 0
  while (true) {
    try {
      return await fn(...args)
    } catch (err: any) {
      retries++
      if (retries >= maxRetries) {
        throw err
      }
      const delayMs = (1 << retries) * 1000
      await wait(delayMs)
    }
  }
}

