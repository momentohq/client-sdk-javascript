export interface CacheLimits {
  maxTrafficRate: number;
  maxThroughputKbps: number;
  maxItemSizeKb: number;
  maxTtlSeconds: number;
}

export interface TopicLimits {
  maxPublishRate: number;
  maxSubscriptionCount: number;
  maxPublishMessageSizeKb: number;
}

export class CacheInfo {
  private readonly name: string;
  private readonly topicLimits: TopicLimits;
  private readonly cacheLimits: CacheLimits;
  private readonly id: string;

  constructor(
    name: string,
    topicLimits: TopicLimits,
    cacheLimits: CacheLimits,
    id = ''
  ) {
    this.name = name;
    this.topicLimits = topicLimits;
    this.cacheLimits = cacheLimits;
    this.id = id;
  }

  public getName() {
    return this.name;
  }

  public getId() {
    return this.id;
  }

  public getTopicLimits() {
    return this.topicLimits;
  }

  public getCacheLimits() {
    return this.cacheLimits;
  }
}
