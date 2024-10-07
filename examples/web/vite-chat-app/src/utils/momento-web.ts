import {
  ExpiresAt,
  MomentoErrorCode,
  type TopicItem,
  TopicPublish,
  TopicSubscribe,
} from "@gomomento/sdk-web";
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import jwt_decode from "jwt-decode";
import { TokenRefreshingTopicClient } from "./refreshing-topic-client";

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

async function getDisposableToken(selectedUser?: string): Promise<{token: string; expiresAt: ExpiresAt}> {
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

  const token = await fetchResp.json() as {authToken: string; expiresAt: number};
  return {
    token: token.authToken,
    expiresAt: ExpiresAt.fromEpoch(token.expiresAt),
  };
}

async function fetchTokenWithOpenAuth() {
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL as string, {
    cache: "no-store",  // don't cache the token since it will expire in 5 min
  });
}

async function fetchTokenWithLambdaAuth() {
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL as string, {
    cache: "no-store",  // don't cache the token since it will expire in 5 min
    headers: {
      username: import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME as string,
      password: import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD as string
    }
  });
}

async function fetchTokenWithCognitoAuth(selectedUser?: string) {
  // Cognito auth flow: sign into Cognito, get ID token, pass ID token as
  // the Authorization token to the token vending machine
  const cognitoClient = new CognitoIdentityProviderClient({
    "region": import.meta.env.VITE_TOKEN_VENDING_MACHINE_AWS_REGION as string,
  });

  if (!selectedUser) {
    throw new Error("Cognito user wasn't selected!");
  }

  let userCredentials = {};
  if (selectedUser === "ReadWrite") {
    userCredentials = {
      "USERNAME": import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME_READWRITE as string,
      "PASSWORD": import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD_READWRITE as string,
    };
  }
  else {
    userCredentials = {
      "USERNAME": import.meta.env.VITE_TOKEN_VENDING_MACHINE_USERNAME_READONLY as string,
      "PASSWORD": import.meta.env.VITE_TOKEN_VENDING_MACHINE_PASSWORD_READONLY as string,
    };
  }

  const input = {
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: userCredentials,
    ClientId: import.meta.env.VITE_TOKEN_VENDING_MACHINE_CLIENT_ID as string,
  };
  const command = new InitiateAuthCommand(input);
  const response = await cognitoClient.send(command);
  const IdToken = response.AuthenticationResult?.IdToken;
  if (!IdToken) {
    throw new Error("Cognito sign in failed");
  }
  const decodedToken: {[key: string]: string[]} = jwt_decode(IdToken);
  const userCognitoGroup = decodedToken['cognito:groups'][0];

  // Make the actual API call to the token vending machine here
  return await fetch(import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL as string, {
    cache: "no-store",  // don't cache the token since it will expire in 5 min
    headers: {
      Authorization: `Bearer ${IdToken}`,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      usergroup: userCognitoGroup,
      cachename: import.meta.env.VITE_MOMENTO_CACHE_NAME as string
    }
  });
}

export class MomentoWebClient {
  topicClient: TokenRefreshingTopicClient;
  selectedUser?: string;

  constructor(topicClient: TokenRefreshingTopicClient, selectedUser?: string) {
    this.topicClient = topicClient;
    this.selectedUser = selectedUser;
  }

  static async create(selectedUser?: string) {
    const topicClient = await TokenRefreshingTopicClient.create({
      refreshBeforeExpiryMs: 30000,
      getDisposableToken: async () => {return await getDisposableToken(selectedUser);},
    });
    return new MomentoWebClient(topicClient, selectedUser);
  }

  async subscribeToTopic(
    cacheName: string,
    topicName: string,
    onItem: (item: TopicItem) => void,
    onError: (error: TopicSubscribe.Error) => void,
    selectedUser?: string
  ) {
    console.log(`Subscribing to ${cacheName}:${topicName} and selectedUser is ${selectedUser ?? 'undefined'}`);
    await this.topicClient.subscribe(cacheName, topicName, {
      onItem,
      onError,
    });
  }
  
  async publish(cacheName: string, topicName: string, message: string) {
    const onPublishError = (resp: TopicPublish.Error) => {
      if (resp.errorCode() === MomentoErrorCode.PERMISSION_ERROR) {
        console.log("User is not allowed to publish to topic", resp);
        alert("You have entered the chat room as a read-only user!");
      } else {
        console.error("failed to publish to topic", resp);
      }
    };
    await this.topicClient.publish(cacheName, topicName, message, onPublishError);
  }
  
  async userJoined(
    cacheName: string,
    topicName: string,
    username: string,
  ) {
    const userJoinedEvent: UserJoinedEvent = {
      username,
      timestamp: Date.now(),
      event: EventTypes.USER_JOINED,
    };
    await this.publish(cacheName, topicName, JSON.stringify(userJoinedEvent));
  }
  
  async sendMessage(
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
    await this.publish(cacheName, topicName, JSON.stringify(chatMessage));
  }
  
}