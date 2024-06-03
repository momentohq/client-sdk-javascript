import {
  CacheClient,
  CacheGet,
  Configurations,
  CredentialProvider,
  TopicClient,
  type TopicItem,
  TopicSubscribe,
} from "@gomomento/sdk-web";
import { toastError } from "./toast.tsx";

let webCacheClient: CacheClient | undefined = undefined;
let webTopicClient: TopicClient | undefined = undefined;
let subscription: TopicSubscribe.Subscription | undefined = undefined;
let onItemCb: (item: TopicItem) => void;
let onErrorCb: (
  error: TopicSubscribe.Error,
  subscription: TopicSubscribe.Subscription,
) => Promise<void>;

type MomentoClients = {
  cacheClient: CacheClient;
  topicClient: TopicClient;
};

export type Message = {
  text: string;
  timestamp: number;
};

async function getNewWebClients(): Promise<MomentoClients> {
  webCacheClient = undefined;
  webTopicClient = undefined;
  const fetchResp = await fetchTokenWithOpenAuth();
  const token = await fetchResp.json();
  const cacheClient = new CacheClient({
    configuration: Configurations.Browser.v1(),
    credentialProvider: CredentialProvider.fromString({
      apiKey: token.authToken,
    }),
    defaultTtlSeconds: 60,
  });

  const topicClient = new TopicClient({
    configuration: Configurations.Browser.v1(),
    credentialProvider: CredentialProvider.fromString({
      apiKey: token.authToken,
    }),
  });
  webCacheClient = cacheClient;
  webTopicClient = topicClient;
  return {
    cacheClient,
    topicClient,
  };
}

export const clearCurrentClient = () => {
  subscription?.unsubscribe();
  subscription = undefined;
  webCacheClient = undefined;
  webTopicClient = undefined;
};

async function fetchTokenWithOpenAuth() {
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
    cache: "no-store",
  });
}

async function getWebCacheClient(): Promise<CacheClient> {
  if (webCacheClient) {
    return webCacheClient;
  }

  const clients = await getNewWebClients();
  return clients.cacheClient;
}

async function getWebTopicClient(): Promise<TopicClient> {
  if (webTopicClient) {
    return webTopicClient;
  }

  const clients = await getNewWebClients();
  return clients.topicClient;
}

export async function getItemFromCache(
  cacheName: string,
  key: string,
): Promise<string | undefined> {
  const cacheClient = await getWebCacheClient();
  const resp = await cacheClient.get(cacheName, key);
  if (resp instanceof CacheGet.Hit) {
    return resp.valueString();
  } else if (resp instanceof CacheGet.Miss) {
    console.log("cache miss");
    return undefined;
  } else {
    clearCurrentClient();
    toastError(`Error getting cache: ${(resp as CacheGet.Error).message()}`);
    throw new Error(
      `Error getting cache: ${(resp as CacheGet.Error).message()}`,
    );
  }
}

export async function subscribeToTopic(
  cacheName: string,
  topicName: string,
  onItem: (item: TopicItem) => void,
  onError: (
    error: TopicSubscribe.Error,
    subscription: TopicSubscribe.Subscription,
  ) => Promise<void>,
) {
  onErrorCb = onError;
  onItemCb = onItem;
  const topicClient = await getWebTopicClient();
  const resp = await topicClient.subscribe(cacheName, topicName, {
    onItem: onItemCb,
    onError: onErrorCb,
  });
  if (resp instanceof TopicSubscribe.Subscription) {
    subscription = resp;
    return subscription;
  }
  throw new Error(`Unable to subscribe to topic: ${resp}`);
}
