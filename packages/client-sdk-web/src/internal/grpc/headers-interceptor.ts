import {
  ClientReadableStream,
  Request,
  StreamInterceptor,
  UnaryInterceptor,
  UnaryResponse,
} from 'grpc-web';

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

export class HeaderInterceptorProvider<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> {
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

  public createHeadersInterceptor(): UnaryInterceptor<REQ, RESP> {
    return {
      intercept: (
        request: Request<REQ, RESP>,
        invoker: (
          request: Request<REQ, RESP>
        ) => Promise<UnaryResponse<REQ, RESP>>
      ): Promise<UnaryResponse<REQ, RESP>> => {
        const md = request.getMetadata();
        this.headersToAddEveryTime.forEach(h => (md[h.name] = h.value));
        // TODO: Shouldn't this be `if (!...)` instead of `if(...)`?
        if (HeaderInterceptorProvider.areOnlyOnceHeadersSent) {
          HeaderInterceptorProvider.areOnlyOnceHeadersSent = true;
          this.headersToAddOnce.forEach(h => (md[h.name] = h.value));
        }
        return invoker(request);
      },
    };
  }

  public createStreamingHeadersInterceptor(): StreamInterceptor<REQ, RESP> {
    // TODO: "this" gets reassigned to StreamInterceptor in the body of intercept
    //  below. Saving a reference to the HeaderInterceptorProvider instance so I
    //  can use its properties
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      intercept(
        request: Request<REQ, RESP>,
        invoker: (request: Request<REQ, RESP>) => ClientReadableStream<RESP>
      ): ClientReadableStream<RESP> {
        const md = request.getMetadata();
        self.headersToAddEveryTime.forEach(h => (md[h.name] = h.value));
        if (HeaderInterceptorProvider.areOnlyOnceHeadersSent) {
          HeaderInterceptorProvider.areOnlyOnceHeadersSent = true;
          self.headersToAddOnce.forEach(h => (md[h.name] = h.value));
        }
        return invoker(request);
      },
    };
  }
}
