import {InterceptingCall, Interceptor} from '@grpc/grpc-js';

export class Header {
  public readonly onceOnlyHeaders: string[] = ['Agent'];
  public readonly name: string;
  public readonly value: string;

  /**
   * @param {string} name
   * @param {string} value
   */
  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
}

export class HeaderInterceptorProvider {
  private readonly headersToAddEveryTime: Header[];
  private readonly headersToAddOnce: Header[];
  private static areOnlyOnceHeadersSent = false;

  /**
   * @param {Header[]} headers
   */
  constructor(headers: Header[]) {
    this.headersToAddOnce = headers.filter(header =>
      header.onceOnlyHeaders.includes(header.name)
    );
    this.headersToAddEveryTime = headers.filter(
      header => !header.onceOnlyHeaders.includes(header.name)
    );
  }

  public createHeadersInterceptor(): Interceptor {
    return (options, nextCall) => {
      return new InterceptingCall(nextCall(options), {
        start: (metadata, listener, next) => {
          this.headersToAddEveryTime.forEach(h =>
            metadata.add(h.name, h.value)
          );
          if (!HeaderInterceptorProvider.areOnlyOnceHeadersSent) {
            HeaderInterceptorProvider.areOnlyOnceHeadersSent = true;
            this.headersToAddOnce.forEach(h => metadata.add(h.name, h.value));
          }
          next(metadata, {});
        },
      });
    };
  }
}
