// Source: https://gist.github.com/gregkorossy/e33be1f201cf242197d9c4d0a1fa7335

export class Semaphore {
  private counter = 0;
  private waiting: {
    resolve: (value?: unknown) => void;
    err: (reason?: string) => void;
  }[] = [];
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  public take(): void {
    if (this.waiting.length > 0 && this.counter < this.max) {
      this.counter += 1;
      const promise = this.waiting.shift();
      if (promise) {
        promise.resolve();
      }
    }
  }

  public acquire(): Promise<unknown> {
    if (this.counter < this.max) {
      this.counter += 1;
      return new Promise(resolve => {
        resolve(null);
      });
    }
    return new Promise((resolve, err) => {
      this.waiting.push({resolve, err});
    });
  }

  public release(): void {
    this.counter -= 1;
    this.take();
  }

  public purge(): number {
    const unresolved = this.waiting.length;

    for (let i = 0; i < unresolved; i += 1) {
      this.waiting[i].err('Task has been purged.');
    }

    this.counter = 0;
    this.waiting = [];

    return unresolved;
  }
}
