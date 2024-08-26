import {
  DeterminewhenToRetryRequestProps,
  RetryStrategy,
} from './retry-strategy';
import {MomentoLoggerFactory, MomentoLogger} from '../../';

export interface NoRetryStrategyProps {
  loggerFactory: MomentoLoggerFactory;
}

export class NoRetryStrategy implements RetryStrategy {
  private readonly logger: MomentoLogger;

  constructor(props: NoRetryStrategyProps) {
    this.logger = props.loggerFactory.getLogger(this);
  }

  determineWhenToRetryRequest(
    props: DeterminewhenToRetryRequestProps
  ): number | null {
    this.logger.debug(
      `Using no-retry strategy, therefore not retrying request; status code: ${props.grpcStatus.code}, request type: ${props.grpcRequest.path}, attemptNumber: ${props.attemptNumber}`
    );
    // null means do not retry
    return null;
  }
}
