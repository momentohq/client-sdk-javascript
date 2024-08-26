import {InterceptingCall, Interceptor} from '@grpc/grpc-js';

export class Header {
  public readonly onceOnlyHeaders: string[] = ['agent', 'runtime-version'];
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

export class HeaderInterceptor {
  public static createHeadersInterceptor(headers: Header[]): Interceptor {
    const headersToAddOnce = headers.filter(header =>
      header.onceOnlyHeaders.includes(header.name)
    );
    const headersToAddEveryTime = headers.filter(
      header => !header.onceOnlyHeaders.includes(header.name)
    );
    let areOnlyOnceHeadersSent = false;
    return (options, nextCall) => {
      return new InterceptingCall(nextCall(options), {
        start: (metadata, listener, next) => {
          headersToAddEveryTime.forEach(h => {
            metadata.set(h.name, h.value);
          });
          if (!areOnlyOnceHeadersSent) {
            areOnlyOnceHeadersSent = true;
            headersToAddOnce.forEach(h => metadata.add(h.name, h.value));
          }
          next(metadata, {});
        },
      });
    };
  }
}
