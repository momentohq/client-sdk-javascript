import {
  DeterminewhenToRetryRequestProps,
  RetryStrategy,
} from './retry-strategy';
import {EligibilityStrategy} from './eligibility-strategy';
import {MomentoLoggerFactory, MomentoLogger} from '../..';
import {DefaultStorageEligibilityStrategy} from './storage-default-eligibility-strategy';

/*
 * Default parameters
 */

/**
 * Default initial delay for the first retry (in milliseconds).
 */
const DEFAULT_INITIAL_DELAY_MS = 100;
/**
 * Default maximum delay to cap the exponential growth (in milliseconds)
 */
const DEFAULT_MAX_BACKOFF_MS = 5_000;
/**
 * Default timeout for receiving response data before retrying (in milliseconds)
 */
const DEFAULT_RESPONSE_DATA_RECEIVED_TIMEOUT_MS = 1_000;

/**
 * Properties for configuring the Decorrelated Jitter Retry Strategy
 */
export interface DecorrelatedJitterRetryStrategyProps {
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
  maxBackoffMillis?: number;

  /**
   * Timeout for receiving response data before retrying (in milliseconds)
   */
  responseDataReceivedTimeoutMillis?: number;
}

/**
 * Retry strategy that uses a decorrelated jitter backoff algorithm.
 *
 * The backoff for each attempt is calculated as follows:
 * - Base delay: initialDelayMillis * 2^(attemptNumber - 1)
 * - Jittered delay: Random delay in [baseDelay, previousDelay * 3]
 * - Maximum delay: maxBackoffMillis
 */
export class DecorrelatedJitterRetryStrategy implements RetryStrategy {
  private readonly logger: MomentoLogger;
  private readonly eligibilityStrategy: EligibilityStrategy;
  private readonly initialDelayMillis: number;
  private readonly maxBackoffMillis: number;
  readonly responseDataReceivedTimeoutMillis: number;

  constructor(props: DecorrelatedJitterRetryStrategyProps) {
    this.logger = props.loggerFactory.getLogger(this);
    this.eligibilityStrategy =
      props.eligibilityStrategy ??
      new DefaultStorageEligibilityStrategy(props.loggerFactory);

    this.initialDelayMillis =
      props.initialDelayMillis ?? DEFAULT_INITIAL_DELAY_MS;
    this.maxBackoffMillis = props.maxBackoffMillis ?? DEFAULT_MAX_BACKOFF_MS;
    this.responseDataReceivedTimeoutMillis =
      props.responseDataReceivedTimeoutMillis ??
      DEFAULT_RESPONSE_DATA_RECEIVED_TIMEOUT_MS;
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

    // Compute the backoff for this attempt
    // Decorrelated jitter: Random delay in [baseDelay, previousDelay * 3]
    const baseDelay =
      this.initialDelayMillis * Math.pow(2, props.attemptNumber);
    const maxDelay = (props.previousDelay ?? this.initialDelayMillis) * 3;
    const jitteredDelay = Math.min(
      this.maxBackoffMillis,
      randomInRange(baseDelay, maxDelay)
    );

    this.logger.debug(
      `DecorrelatedJitterRetryStrategy: attempt #${props.attemptNumber}` +
        ` -> base delay=${baseDelay}ms, max delay=${maxDelay}ms, jittered delay=${jitteredDelay}ms`
    );

    return jitteredDelay;
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
