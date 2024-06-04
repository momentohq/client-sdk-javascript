import {
  CacheClient,
  CacheGet, CacheItemGetTtl,
  Configurations,
  CredentialProvider,
  TopicClient,
  type TopicItem,
  TopicSubscribe,
} from "@gomomento/sdk-web";
import { toastError } from "./toast.tsx";

export const cacheName = "momento-eventbridge-cache";
export const topicName = "momento-eventbridge-topic";

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

const authToken = import.meta.env.VITE_MOMENTO_API_KEY;

async function getNewWebClients(): Promise<MomentoClients> {
  webCacheClient = undefined;
  webTopicClient = undefined;
  // const fetchResp = await fetchTokenWithOpenAuth();
  // const token = await fetchResp.json();
  const cacheClient = new CacheClient({
    configuration: Configurations.Browser.v1(),
    credentialProvider: CredentialProvider.fromString({
      apiKey: authToken,
    }),
    defaultTtlSeconds: 60,
  });

  const topicClient = new TopicClient({
    configuration: Configurations.Browser.v1(),
    credentialProvider: CredentialProvider.fromString({
      apiKey: authToken,
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

// async function fetchTokenWithOpenAuth() {
//   return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
//     cache: "no-store",
//   });
// }

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

export async function getRemainingTtl(key: string): Promise<number | undefined> {
  const cacheClient = await getWebCacheClient();
  const resp = await cacheClient.itemGetTtl(cacheName, key);
  if (resp instanceof CacheItemGetTtl.Hit) {
    return resp.remainingTtlMillis();
  } else if (resp instanceof CacheItemGetTtl.Miss) {
    console.log("cache miss");
    return undefined;
  } else {
    clearCurrentClient();
    toastError(`Error getting cache: ${(resp as CacheItemGetTtl.Error).message()}`);
    throw new Error(
      `Error getting cache: ${(resp as CacheItemGetTtl.Error).message()}`,
    );
  }
}

export async function subscribeToTopic(
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
