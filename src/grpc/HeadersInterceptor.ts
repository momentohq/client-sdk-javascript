import {InterceptingCall, Interceptor} from '@grpc/grpc-js';

interface Header {
  name: string;
  value: string;
}

export class HeaderInterceptor {
  private readonly headers: Header[];
  private static isUserAgentSent = false;

  /**
   * @param {Header[]} headers
   */
  constructor(headers: Header[]) {
    this.headers = headers;
  }

  public addHeadersInterceptor(): Interceptor {
    return (options, nextCall) => {
      return new InterceptingCall(nextCall(options), {
        start: (metadata, listener, next) => {
          if (!HeaderInterceptor.isUserAgentSent) {
            this.headers.forEach(h => metadata.add(h.name, h.value));
            HeaderInterceptor.isUserAgentSent = true;
          } else {
            // Only add Authorization/cache metadata
            this.headers.forEach(h => {
              if (h.name !== 'Agent') {
                metadata.add(h.name, h.value);
              }
            });
          }
          next(metadata, {});
        },
      });
    };
  }
}
