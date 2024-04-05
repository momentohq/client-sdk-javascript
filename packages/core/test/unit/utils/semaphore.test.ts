// Unit test the semaphore class

import { Semaphore } from "../../../src/internal/utils";

describe('Semaphore', () => {
  let asyncTaskWithoutSemaphore = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  let asyncTaskWithSemaphore = async (semaphore: Semaphore) => {
    await semaphore.acquire();
    await asyncTaskWithoutSemaphore();
    semaphore.release();
  }

  it('Tasks without semaphore should complete concurrently', async () => {
    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(asyncTaskWithoutSemaphore());
    }
    await Promise.all(promises);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1100);
  });

  it('Tasks with semaphore with limit set to 1 should complete serially', async () => {
    const startTime = Date.now();
    const semaphore = new Semaphore(1);
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(asyncTaskWithSemaphore(semaphore));
    }
    await Promise.all(promises);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(6100);
  });

  it('Tasks with semaphore with limit set to 3 should complete with twice the concurrent time', async () => {
    const startTime = Date.now();
    const semaphore = new Semaphore(3);
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(asyncTaskWithSemaphore(semaphore));
    }
    await Promise.all(promises);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(2100);
  });

  it('Tasks with semaphore with limit set to 6 should complete concurrently', async () => {
    const startTime = Date.now();
    const semaphore = new Semaphore(6);
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(asyncTaskWithSemaphore(semaphore));
    }
    await Promise.all(promises);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1100);
  });
});
