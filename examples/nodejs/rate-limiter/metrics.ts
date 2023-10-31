export class Metrics {
  private successes: number = 0;
  private throttles: number = 0;
  private totalLatency: number = 0;
  private errors: number = 0;

  recordSuccess(latency: number) {
    this.successes++;
    this.totalLatency += latency;
  }

  recordThrottle(latency: number) {
    this.throttles++;
    this.totalLatency += latency;
  }

  recordErrors() {
    this.errors++;
  }

  getSuccessCount(): number {
    return this.successes;
  }

  getThrottleCount(): number {
    return this.throttles;
  }

  getErrorsCount(): number {
    return this.errors;
  }

  getAverageLatency(): number {
    return this.totalLatency / (this.successes + this.throttles + this.errors);
  }

  displayMetrics(type: string) {
    console.log(`${type} Rate Limiter - Successes:`, this.getSuccessCount());
    console.log(`${type} Rate Limiter - Throttles:`, this.getThrottleCount());
    console.log(`${type} Rate Limiter - Errors:`, this.getErrorsCount());
    console.log(`${type} Rate Limiter - Average Latency:`, this.getAverageLatency());
  }
}
