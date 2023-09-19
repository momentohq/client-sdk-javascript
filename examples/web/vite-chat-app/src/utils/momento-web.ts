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
import jwt_decode from "jwt-decode";

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

async function getNewWebClients(selectedUser?: string): Promise<MomentoClients> {
  webTopicClient = undefined;
  let fetchResp;

  const token_vending_machine_auth = String(import.meta.env.VITE_TOKEN_VENDING_MACHINE_AUTH_TYPE)

  switch (token_vending_machine_auth) {
    case "cognito": {
      fetchResp = await fetchTokenWithCognitoAuth(selectedUser);
      break;
    }
    case "lambda": {
      fetchResp = await fetchTokenWithLambdaAuth();
      break;
    }
    case "open": {
      fetchResp = await fetchTokenWithOpenAuth();
      break;
    }
    default: {
      throw new Error(`Unrecognized token vending machine auth type ${token_vending_machine_auth}`);
    }
  }

  const token = await fetchResp.json();
  const topicClient = new TopicClient({
    configuration: Configurations.Browser.v1(),
    credentialProvider: CredentialProvider.fromString({
      apiKey: token.apiKey,
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

async function fetchTokenWithOpenAuth() {
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
    cache: "no-store",  // don't cache the token since it will expire in 5 min
  });
}

async function fetchTokenWithLambdaAuth() {
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
    cache: "no-store",  // don't cache the token since it will expire in 5 min
    headers: {
      username: import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME,
      password: import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD
    }
  });
}

async function fetchTokenWithCognitoAuth(selectedUser?: string) {
  // Cognito auth flow: sign into Cognito, get ID token, pass ID token as
  // the Authorization token to the token vending machine
  const cognitoClient = new CognitoIdentityProviderClient({
    "region": import.meta.env.VITE_TOKEN_VENDING_MACHINE_AWS_REGION,
  });

  if (!selectedUser) {
    throw new Error("Cognito user wasn't selected!");
  }

  let userCredentials = {};
  if (selectedUser === "ReadWrite") {
    userCredentials = {
      "USERNAME": import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME_READWRITE,
      "PASSWORD": import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD_READWRITE,
    };
  }
  else {
    userCredentials = {
      "USERNAME": import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME_READONLY,
      "PASSWORD": import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD_READONLY,
    };
  }

  const input = {
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: userCredentials,
    ClientId: import.meta.env.VITE_TOKEN_VENDING_MACHINE_CLIENT_ID,
  };
  const command = new InitiateAuthCommand(input);
  const response = await cognitoClient.send(command);
  const IdToken = response.AuthenticationResult?.IdToken;
  if (!IdToken) {
    throw new Error("Cognito sign in failed");
  }

  const decodedToken: any = jwt_decode(IdToken);
  const userCognitoGroup = decodedToken['cognito:groups'][0];

  // Make the actual API call to the token vending machine here
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL, {
    cache: "no-store",  // don't cache the token since it will expire in 5 min
    headers: {
      Authorization: `Bearer ${IdToken}`,
      usergroup: userCognitoGroup,
      cachename: import.meta.env.VITE_MOMENTO_CACHE_NAME
    }
  });
}

async function getWebTopicClient(selectedUser?: string): Promise<TopicClient> {
  if (webTopicClient) {
    return webTopicClient;
  }

  const clients = await getNewWebClients(selectedUser);
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
  selectedUser?: string
) {
  onErrorCb = onError;
  onItemCb = onItem;
  const topicClient = await getWebTopicClient(selectedUser);
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
    }
    else if (resp.errorCode() === MomentoErrorCode.PERMISSION_ERROR) {
      console.log("User is not allowed to publish to topic", resp);
      alert("You have entered the chat room as a read-only user!");
    }
    else {
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
