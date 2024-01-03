import {SdkError} from '../../src';

export interface ResolveOrRejectErrorOptions<TGrpcError> {
  err: TGrpcError | null;
  errorResponseFactoryFn: (err: SdkError) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolveFn: (result: any) => void;
  rejectFn: (err: SdkError) => void;
}

export interface ICacheServiceErrorMapper<TGrpcError> {
  resolveOrRejectError(opts: ResolveOrRejectErrorOptions<TGrpcError>): void;
  returnOrThrowError<TErrorResponse>(
    err: Error,
    errorResponseFactoryFn: (err: SdkError) => TErrorResponse
  ): TErrorResponse;
  convertError(err: TGrpcError | null): SdkError;
}
