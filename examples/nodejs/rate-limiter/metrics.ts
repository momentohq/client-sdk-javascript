export class Metrics {
  private successes = 0;
  private throttles = 0;
  private totalLatency = 0;
  private errors = 0;
  private latencies: number[] = [];

  recordSuccess(latency: number) {
    this.successes++;
    this.totalLatency += latency;
    this.latencies.push(latency);
  }

  recordThrottle(latency: number) {
    this.throttles++;
    this.totalLatency += latency;
    this.latencies.push(latency);
  }

  recordErrors() {
    this.errors++;
  }

  public displayMetrics(rateLimiterName: string) {
    const averageLatency =
      this.totalLatency / (this.successes + this.throttles);
    console.log(
      `${rateLimiterName} Rate Limiter - Successes: ${this.successes}`
    );
    console.log(
      `${rateLimiterName} Rate Limiter - Throttles: ${this.throttles}`
    );
    console.log(`${rateLimiterName} Rate Limiter - Errors: ${this.errors}`);
    console.log(
      `${rateLimiterName} Rate Limiter - Average Latency: ${averageLatency.toFixed(
        3
      )}`
    );
    if (this.latencies.length > 0) {
      this.displayPercentiles(rateLimiterName);
    }
  }

  private displayPercentiles(rateLimiterName: string) {
    this.latencies.sort((a, b) => a - b);
    const p50 = this.latencies[Math.floor(this.latencies.length * 0.5)];
    const p90 = this.latencies[Math.floor(this.latencies.length * 0.9)];
    const p99 = this.latencies[Math.floor(this.latencies.length * 0.99)];
    const p999 = this.latencies[Math.floor(this.latencies.length * 0.999)];

    console.log(`${rateLimiterName} Rate Limiter - p50 Latency: ${p50}`);
    console.log(`${rateLimiterName} Rate Limiter - p90 Latency: ${p90}`);
    console.log(`${rateLimiterName} Rate Limiter - p99 Latency: ${p99}`);
    console.log(`${rateLimiterName} Rate Limiter - p99.9 Latency: ${p999}`);
  }
}
