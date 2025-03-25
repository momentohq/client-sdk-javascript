import {Channel} from '@grpc/grpc-js';

export interface CloseableGrpcClient {
  close(): void;
}

export interface GrpcClientWrapper<T extends CloseableGrpcClient> {
  getClient(): T;
}

export interface GrpcClientWithChannel extends CloseableGrpcClient {
  getChannel(): Channel;
}
