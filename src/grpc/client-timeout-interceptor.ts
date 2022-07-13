import {InterceptingCall, Interceptor} from '@grpc/grpc-js';

export const ClientTimeoutInterceptor = (
  requestTimeoutMs: number
): Interceptor => {
  return (options, nextCall) => {
    if (!options.deadline) {
      const deadline = new Date(Date.now());
      deadline.setMilliseconds(deadline.getMilliseconds() + requestTimeoutMs);
      options.deadline = deadline;
      console.log(`SET DEADLINE TO ${deadline.getMilliseconds().toString()}`);
    }
    return new InterceptingCall(nextCall(options));
  };
};
