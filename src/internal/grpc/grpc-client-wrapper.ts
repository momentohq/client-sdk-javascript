export interface CloseableGrpcClient {
  close(): void;
}

export interface GrpcClientWrapper<T extends CloseableGrpcClient> {
  getClient(): T;
}
