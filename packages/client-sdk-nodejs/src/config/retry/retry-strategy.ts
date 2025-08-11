import {Metadata, StatusObject} from '@grpc/grpc-js';
import {ClientMethodDefinition} from '@grpc/grpc-js/build/src/make-client';

export interface DeterminewhenToRetryRequestProps {
  grpcStatus: StatusObject;
  grpcRequest: ClientMethodDefinition<unknown, unknown>;
  attemptNumber: number;
  requestMetadata: Metadata;
  overallDeadline: Date;
}

export interface RetryStrategy {
  responseDataReceivedTimeoutMillis?: number;

  determineWhenToRetryRequest(
    props: DeterminewhenToRetryRequestProps
  ): number | null;
}
