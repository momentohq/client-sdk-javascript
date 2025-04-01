import {Channel} from '@grpc/grpc-js';

export interface CloseableGrpcClient {
  close(): void;
}

export interface GrpcClientWrapper<T extends CloseableGrpcClient> {
  getClient(): T;
  startRequest(): void;
  endRequest(): void;
}

export interface GrpcClientWithChannel extends CloseableGrpcClient {
  getChannel(): Channel;
}
