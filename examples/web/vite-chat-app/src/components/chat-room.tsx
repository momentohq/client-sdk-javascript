import { useEffect, useRef, useState } from "react";

import {
  type ChatEvent,
  EventTypes,
  MomentoWebClient,
} from "../utils/momento-web";
import { type TopicItem, type TopicSubscribe } from "@gomomento/sdk-web";

type Props = {
  topicName: string;
  cacheName: string;
  username: string;
  selectedUser: string;
  onLeave: () => void;
};

export default function ChatRoom(props: Props) {
  const [chats, setChats] = useState<ChatEvent[]>([]);
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [momentoClient, setMomentoClient] = useState<MomentoWebClient|undefined>(undefined);

  const onItem = (item: TopicItem) => {
    try {
      const message = JSON.parse(item.valueString()) as ChatEvent;
      setChats((curr) => [...curr, message]);
    } catch (e) {
      // Messages received from elsewhere (like the Momento Console or an SDK)
      // should be converted from TopicItem to ChatEvent to be readable on the UI.
      const chatEvent: ChatEvent = {
        event: EventTypes.MESSAGE,
        text: item.valueString(),
        username: item.tokenId() || "unknown",
        timestamp: Date.now(),
      };
      setChats((curr) => [...curr, chatEvent]);
    }
  };

  const onError = (error: TopicSubscribe.Error) => {
    console.error("received error from momento", error);
  }

  const onSendMessage = async () => {
    await momentoClient?.sendMessage(
      props.cacheName,
      props.topicName,
      props.username,
      textInput,
    );
    setTextInput("");
  };

  const onEnterClicked = async (e: { keyCode: number }) => {
    if (e.keyCode === 13 && textInput) {
      await onSendMessage();
    }
  };

  useEffect(() => {
    // Initializing the Momento TopicClient is an async operation because
    // we first need to get a disposable token from the token vending machine.
    // We must also pass in props.selectedUser here in case the cognito authorizer
    // is used in the getDisposableToken function passed to the TokenRefreshingTopicClient.

    const initialSetup = async (client: MomentoWebClient) => {
      setMomentoClient(client);
      await client.subscribeToTopic(props.cacheName, props.topicName, onItem, onError, props.selectedUser);
      console.log("Successfully initialized momento client and subscribed to topic", props.topicName);
      await momentoClient?.userJoined(props.cacheName, props.topicName, props.username);
    }

    MomentoWebClient.create(props.selectedUser)
      .then(initialSetup)
      .catch((e) => console.error("error initializing momento client", e));
  }, [props.topicName, props.username, props.selectedUser]);

  const scrollToBottom = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  return (
    // <div className={"flex flex-col p-6 h-full justify-between bg-slate-200"}>
    <div 
      className={"flex flex-col p-6 h-full justify-between"}
      style={{ background: "radial-gradient(circle, #25392B, #0E2515)" }}
    >
      <div
        className={
          "flex justify-between items-center p-1 border-b-2 border-slate-300 mb-4"
        }
      >
        <div className={"text-white"}>
          Welcome to the <span className={"italic"}>{props.topicName}</span>{" "}
          chat room
        </div>
        <button
          onClick={props.onLeave}
          className={"bg-red-600 text-white rounded-xl p-1"}
        >
          Leave
        </button>
      </div>
      <div className={"h-full p-1 overflow-auto"}>
        {chats.map((chat) => {
          const date = new Date(chat.timestamp);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const timestampWithUsername = `[${hours}:${minutes}] <${chat.username}>`;
          const timestamp = `[${hours}:${minutes}]`;
          switch (chat.event) {
            case EventTypes.MESSAGE:
              return (
                <div
                  className={"break-words"}
                  key={`${chat.timestamp}-${chat.username}`}
                >
                  <span className={"text-green-500"}>
                    {timestampWithUsername}
                  </span>{" "}
                  <span className={"text-white"}>
                    {chat.text}
                  </span>
                </div>
              );
            case EventTypes.USER_JOINED:
              return (
                <div
                  key={`${chat.timestamp}-${chat.username}`}
                  className={"text-gray-400 italic"}
                >
                  {timestamp} user joined: {chat.username}
                </div>
              );
          }
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className={"w-full flex "}>
        <input
          disabled={props.selectedUser === "ReadOnly"}
          placeholder={"chat"}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onKeyDown={onEnterClicked}
          className={"border-2 rounded-2xl p-2 w-full"}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <div className={"w-4"} />
        <button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={onSendMessage}
          disabled={!textInput}
          className={
            "bg-green-400 rounded-2xl p-2 hover:brightness-75 disabled:bg-slate-400 disabled:brightness-75 disabled:text-white"
          }
        >
          Send
        </button>
      </div>
    </div>
  );
}
