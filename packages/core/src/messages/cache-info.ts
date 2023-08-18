type CacheLimitsProps = {
  maxTrafficRate: number;
  maxThroughputKbps: number;
  maxItemSizeKb: number;
  maxTtlSeconds: number;
};

export class CacheLimits {
  private readonly maxTrafficRate: number;
  private readonly maxThroughputKbps: number;
  private readonly maxItemSizeKb: number;
  private readonly maxTtlSeconds: number;

  constructor(props: CacheLimitsProps) {
    this.maxTrafficRate = props.maxTrafficRate;
    this.maxThroughputKbps = props.maxThroughputKbps;
    this.maxItemSizeKb = props.maxItemSizeKb;
    this.maxTtlSeconds = props.maxTtlSeconds;
  }

  public getMaxTrafficRate() {
    return this.maxTrafficRate;
  }

  public getMaxThroughputKbps() {
    return this.maxThroughputKbps;
  }

  public getMaxItemSizeKb() {
    return this.maxItemSizeKb;
  }

  public getMaxTtlSeconds() {
    return this.maxTtlSeconds;
  }
}

type TopicLimitsProps = {
  maxPublishRate: number;
  maxSubscriptionCount: number;
  maxPublishMessageSizeKb: number;
};

export class TopicLimits {
  private readonly maxPublishRate: number;
  private readonly maxSubscriptionCount: number;
  private readonly maxPublishMessageSizeKb: number;

  constructor(props: TopicLimitsProps) {
    this.maxPublishRate = props.maxPublishRate;
    this.maxSubscriptionCount = props.maxSubscriptionCount;
    this.maxPublishMessageSizeKb = props.maxPublishMessageSizeKb;
  }

  public getMaxPublishRate() {
    return this.maxPublishRate;
  }

  public getMaxSubscriptionCount() {
    return this.maxSubscriptionCount;
  }

  public getMaxPublishMessageSizeKb() {
    return this.maxPublishMessageSizeKb;
  }
}

export class CacheInfo {
  private readonly name: string;
  private readonly topicLimits: TopicLimits;
  private readonly cacheLimits: CacheLimits;

  constructor(
    name: string,
    topicLimits: TopicLimits,
    cacheLimits: CacheLimits
  ) {
    this.name = name;
    this.topicLimits = topicLimits;
    this.cacheLimits = cacheLimits;
  }

  public getName() {
    return this.name;
  }

  public getTopicLimits() {
    return this.topicLimits;
  }

  public getCacheLimits() {
    return this.cacheLimits;
  }
}
