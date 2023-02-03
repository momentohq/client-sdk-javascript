import {StatusObject} from '@grpc/grpc-js';
import {ClientMethodDefinition} from '@grpc/grpc-js/build/src/make-client';

export interface DeterminewhenToRetryRequestProps {
  grpcStatus: StatusObject;
  grpcRequest: ClientMethodDefinition<unknown, unknown>;
  attemptNumber: number;
}

export interface RetryStrategy {
  determineWhenToRetryRequest(
    props: DeterminewhenToRetryRequestProps
  ): number | null;
}
