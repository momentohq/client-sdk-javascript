import {Metadata, StatusObject} from '@grpc/grpc-js';
import {ClientMethodDefinition} from '@grpc/grpc-js/build/src/make-client';

export interface EligibleForRetryProps {
  grpcStatus: StatusObject;
  grpcRequest: ClientMethodDefinition<unknown, unknown>;
  requestMetadata: Metadata;
}

export interface EligibilityStrategy {
  isEligibleForRetry(props: EligibleForRetryProps): boolean;
}
