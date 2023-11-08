export enum WebhookDestinationType {
  PostUrl = 'post_url',
}

interface IPostUrlWebhookDestination {
  url: () => string;
  type: WebhookDestinationType.PostUrl;
}

export class PostUrlWebhookDestination implements IPostUrlWebhookDestination {
  readonly _url: string;
  constructor(url: string) {
    this._url = url;
  }

  public url(): string {
    return this._url;
  }

  type: WebhookDestinationType.PostUrl;
}

export type WebhookDestination = InstanceType<typeof PostUrlWebhookDestination>;
