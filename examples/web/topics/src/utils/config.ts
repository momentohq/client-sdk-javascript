export interface BrowserConfigOptions {
  numberOfBrowserInstances: number;
  numSubscriptions: number;
  publishRatePerSecond: number;
}

export interface BasicConfigOptions {
  cacheName: string;
  topicName: string;
}

export interface TopicsLoadGenContext {
  totalSubscriptionRequests: number;
  totalPublishRequests: number;
  numSubscriptionSuccess: number;
  numPublishSuccess: number;
  numSubscriptionUnavailable: number;
  numPublishUnavailable: number;
  numSubscriptionTimeoutExceeded: number;
  numPublishTimeoutExceeded: number;
  numSubscriptionLimitExceeded: number;
  numPublishLimitExceeded: number;

  toString(): string;
}

export class TopicsLoadGenContextImpl implements TopicsLoadGenContext {
  constructor(
    public totalSubscriptionRequests: number,
    public totalPublishRequests: number,
    public numSubscriptionSuccess: number,
    public numPublishSuccess: number,
    public numSubscriptionUnavailable: number,
    public numPublishUnavailable: number,
    public numSubscriptionTimeoutExceeded: number,
    public numPublishTimeoutExceeded: number,
    public numSubscriptionLimitExceeded: number,
    public numPublishLimitExceeded: number
  ) {}

  toString(): string {
    return `TopicsLoadGenContext:
    Total Subscription Requests: ${this.totalSubscriptionRequests}
    Total Publish Requests: ${this.totalPublishRequests}
    Number of Subscription Success: ${this.numSubscriptionSuccess}
    Number of Publish Success: ${this.numPublishSuccess}
    Number of Subscription Unavailable: ${this.numSubscriptionUnavailable}
    Number of Publish Unavailable: ${this.numPublishUnavailable}
    Number of Subscription Timeout Exceeded: ${this.numSubscriptionTimeoutExceeded}
    Number of Publish Timeout Exceeded: ${this.numPublishTimeoutExceeded}
    Number of Subscription Limit Exceeded: ${this.numSubscriptionLimitExceeded}
    Number of Publish Limit Exceeded: ${this.numPublishLimitExceeded}`;
  }

  static initiateTopicsLoadGenContext(): TopicsLoadGenContextImpl {
    return new TopicsLoadGenContextImpl(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
}
