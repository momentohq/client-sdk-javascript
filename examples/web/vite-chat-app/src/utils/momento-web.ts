import {
  Configurations,
  CredentialProvider,
  MomentoErrorCode,
  TopicClient,
  type TopicItem,
  TopicPublish,
  TopicSubscribe,
} from "@gomomento/sdk-web";
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

export enum EventTypes {
  MESSAGE = "message",
  USER_JOINED = "user_joined",
}

export type ChatMessageEvent = {
  event: EventTypes.MESSAGE;
  username: string;
  text: string;
  timestamp: number;
};

export type UserJoinedEvent = {
  event: EventTypes.USER_JOINED;
  username: string;
  timestamp: number;
};

export type ChatEvent = UserJoinedEvent | ChatMessageEvent;

let webTopicClient: TopicClient | undefined = undefined;
let subscription: TopicSubscribe.Subscription | undefined = undefined;
let onItemCb: (item: TopicItem) => void;
let onErrorCb: (
  error: TopicSubscribe.Error,
  subscription: TopicSubscribe.Subscription,
) => Promise<void>;

type MomentoClients = {
  topicClient: TopicClient;
};

async function getNewWebClients(): Promise<MomentoClients> {
  webTopicClient = undefined;
  let fetchResp;

  if (import.meta.env.VITE_TOKEN_VENDING_MACHINE_CLIENT_ID 
    && import.meta.env.VITE_TOKEN_VENDING_MACHINE_AWS_REGION
    && import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME
    && import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD
    ) {
    // use Cognito flow: sign into Cognito, get ID token, pass ID token as Authorization token to TVM
    const cognitoClient = new CognitoIdentityProviderClient({
      "region": import.meta.env.VITE_TOKEN_VENDING_MACHINE_AWS_REGION,
    });
    const input = {
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: { 
        "USERNAME": import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME,
        "PASSWORD": import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD,
      },
      ClientId: import.meta.env.VITE_TOKEN_VENDING_MACHINE_CLIENT_ID, 
    };
    const command = new InitiateAuthCommand(input);
    const response = await cognitoClient.send(command);
    const IdToken = response.AuthenticationResult?.IdToken;
    if (!IdToken) {
      throw new Error("Cognito sign in failed");
    }

    fetchResp = await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
      cache: "no-store",  // don't cache the token since it will expire in 5 min
      headers: {
        Authorization: `Bearer ${IdToken}`
      }
    });
  }
  else if (import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME
    && import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD) {
      // use Lambda Authorizer flow
      fetchResp = await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
        cache: "no-store",  // don't cache the token since it will expire in 5 min
        headers: {
          username: import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME,
          password: import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD
        }
      });
    }
  else {
    fetchResp = await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
      cache: "no-store",  // don't cache the token since it will expire in 5 min
    });
  }
  
  const token = await fetchResp.json();
  const topicClient = new TopicClient({
    configuration: Configurations.Browser.v1(),
    credentialProvider: CredentialProvider.fromString({
      authToken: token.authToken,
    }),
  });
  webTopicClient = topicClient;
  return {
    topicClient,
  };
}

export const clearCurrentClient = () => {
  subscription?.unsubscribe();
  subscription = undefined;
  webTopicClient = undefined;
};

async function getWebTopicClient(): Promise<TopicClient> {
  if (webTopicClient) {
    return webTopicClient;
  }

  const clients = await getNewWebClients();
  return clients.topicClient;
}

export async function listCaches(): Promise<string[]> {
  const fetchResp = await fetch(window.location.origin + "/api/momento/caches");
  const caches: string[] = await fetchResp.json();
  return caches;
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

  throw new Error(`unable to subscribe to topic: ${resp}`);
}

async function publish(cacheName: string, topicName: string, message: string) {
  const topicClient = await getWebTopicClient();
  const resp = await topicClient.publish(cacheName, topicName, message);
  if (resp instanceof TopicPublish.Error) {
    if (resp.errorCode() === MomentoErrorCode.AUTHENTICATION_ERROR) {
      console.log(
        "token has expired, going to refresh subscription and retry publish",
      );
      clearCurrentClient();
      await subscribeToTopic(cacheName, topicName, onItemCb, onErrorCb);
      await publish(cacheName, topicName, message);
    } else {
      console.error("failed to publish to topic", resp);
    }
  }
}

export async function userJoined(
  cacheName: string,
  topicName: string,
  username: string,
) {
  const userJoinedEvent: UserJoinedEvent = {
    username,
    timestamp: Date.now(),
    event: EventTypes.USER_JOINED,
  };
  await publish(cacheName, topicName, JSON.stringify(userJoinedEvent));
}

export async function sendMessage(
  cacheName: string,
  topicName: string,
  username: string,
  text: string,
) {
  const chatMessage: ChatMessageEvent = {
    username,
    text,
    timestamp: Date.now(),
    event: EventTypes.MESSAGE,
  };
  await publish(cacheName, topicName, JSON.stringify(chatMessage));
}
