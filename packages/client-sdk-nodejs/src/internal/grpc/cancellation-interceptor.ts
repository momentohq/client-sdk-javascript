import {InterceptingCall, Interceptor} from '@grpc/grpc-js';
import {Status} from '@grpc/grpc-js/build/src/constants';

export class CancellationInterceptor {
  public static createCancellationInterceptor(
    abortSignal?: AbortSignal
  ): Interceptor {
    return (options, nextCall) => {
      if (abortSignal !== undefined && abortSignal.aborted) {
        const interceptingCall = new InterceptingCall(nextCall(options), {});
        interceptingCall.cancelWithStatus(
          Status.ABORTED, // to short-circuit any existing retry strategy
          'Request cancelled by an AbortSignal'
        );
        return interceptingCall;
      } else {
        return new InterceptingCall(nextCall(options), {
          start: (metadata, _, next) => {
            next(metadata, {});
          },
        });
      }
    };
  }
}
