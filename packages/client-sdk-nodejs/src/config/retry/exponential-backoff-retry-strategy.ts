import {
  DeterminewhenToRetryRequestProps,
  RetryStrategy,
} from './retry-strategy';
import {EligibilityStrategy} from './eligibility-strategy';
import {
  DefaultEligibilityStrategy,
  MomentoLoggerFactory,
  MomentoLogger,
} from '../..';

/*
 * Default parameters
 */

/**
 * Default initial delay for the first retry (in milliseconds).
 */
const DEFAULT_INITIAL_DELAY_MS = 16;
/**
 * Default maximum delay to cap the exponential growth (in milliseconds)
 */
const DEFAULT_MAX_DELAY_MS = 5_000;

/**
 * Properties for configuring the ExponentialBackoffRetryStrategy
 */
export interface ExponentialBackoffRetryStrategyProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures how and when failed requests will be retried
   */
  eligibilityStrategy?: EligibilityStrategy;

  /**
   * Initial delay for the first retry (in milliseconds)
   */
  initialDelayMillis?: number;

  /**
   * Maximum delay to cap the exponential growth (in milliseconds)
   */
  maxDelayMillis?: number;
}

/**
 * Retry strategy that uses exponential backoff with decorrelated jitter.
 *
 * The backoff for each attempt is calculated as follows:
 * - The first retry has a fixed delay of `initialDelayMillis`
 * - Backoff for subsequent retries is calculated as `initialDelayMillis * 2^attemptNumber`
 * - Subsequent retries have a delay that is a random value between
 *   the current backoff and 3 times the previous backoff, with the
 *.  maximum delay capped at `maxDelayMillis`.
 */
export class ExponentialBackoffRetryStrategy implements RetryStrategy {
  private readonly logger: MomentoLogger;
  private readonly eligibilityStrategy: EligibilityStrategy;
  private readonly initialDelayMillis: number;
  private readonly maxDelayMillis: number;

  constructor(props: ExponentialBackoffRetryStrategyProps) {
    this.logger = props.loggerFactory.getLogger(this);
    this.eligibilityStrategy =
      props.eligibilityStrategy ??
      new DefaultEligibilityStrategy(props.loggerFactory);

    this.initialDelayMillis =
      props.initialDelayMillis ?? DEFAULT_INITIAL_DELAY_MS;
    this.maxDelayMillis = props.maxDelayMillis ?? DEFAULT_MAX_DELAY_MS;
  }

  determineWhenToRetryRequest(
    props: DeterminewhenToRetryRequestProps
  ): number | null {
    this.logger.debug(
      `Determining whether request is eligible for retry; status code: ${props.grpcStatus.code}, request type: ${props.grpcRequest.path}, attemptNumber: ${props.attemptNumber}`
    );

    if (!this.eligibilityStrategy.isEligibleForRetry(props)) {
      this.logger.debug('Request is not eligible for retry.');
      return null; // Do not retry
    }

    const baseDelay = this.computeBaseDelay(props.attemptNumber);
    const previousBaseDelay = this.computeBaseDelay(props.attemptNumber - 1);
    const maxDelay = previousBaseDelay * 3;
    const jitteredDelay = randomInRange(baseDelay, maxDelay);
    const finalDelay = Math.min(this.maxDelayMillis, jitteredDelay);

    this.logger.debug(
      `ExponentialBackoffRetryStrategy: attempt #${props.attemptNumber}` +
        ` -> base delay=${baseDelay}ms, max delay=${maxDelay}ms, jittered delay=${finalDelay}ms`
    );

    return finalDelay;
  }

  /**
   * Compute the backoffed base delay for the given attempt number.
   * @param attemptNumber - The attempt number (0-based)
   * @returns The base delay for the given attempt number
   */
  private computeBaseDelay(attemptNumber: number): number {
    if (attemptNumber <= 0) {
      return this.initialDelayMillis;
    }
    return this.initialDelayMillis * Math.pow(2, attemptNumber);
  }
}

/**
 * Generate a uniform random number in the range [min, max)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns A random number in the range [min, max)
 */
function randomInRange(min: number, max: number): number {
  if (min >= max) {
    return min;
  }
  return min + Math.random() * (max - min);
}
