import { useEffect, useRef, useState } from "react";

import {
  type ChatEvent,
  clearCurrentClient,
  EventTypes,
  sendMessage,
  subscribeToTopic,
  userJoined,
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

  const onItem = (item: TopicItem) => {
    try {
      const message = JSON.parse(item.valueString()) as ChatEvent;
      setChats((curr) => [...curr, message]);
    } catch (e) {
      console.error("unable to parse chat message", e);
    }
  };

  const onError = async (
    error: TopicSubscribe.Error,
    sub: TopicSubscribe.Subscription,
  ) => {
    console.error(
      "received error from momento, getting new token and resubscribing",
      error,
    );
    sub.unsubscribe();
    clearCurrentClient();
    await subscribeToTopic(props.cacheName, props.topicName, onItem, onError);
  };

  const onSendMessage = async () => {
    await sendMessage(
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
    subscribeToTopic(props.cacheName, props.topicName, onItem, onError, props.selectedUser)
      .then(async () => {
        console.log("successfully subscribed");
        await userJoined(props.cacheName, props.topicName, props.username);
      })
      .catch((e) => console.error("error subscribing to topic", e));
  }, []);

  const scrollToBottom = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  return (
    <div className={"flex flex-col p-6 h-full justify-between bg-slate-200"}>
      <div
        className={
          "flex justify-between items-center p-1 border-b-2 border-slate-300 mb-4"
        }
      >
        <div>
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
          switch (chat.event) {
            case EventTypes.MESSAGE:
              const timestampWithUsername = `[${hours}:${minutes}] <${chat.username}>`;
              return (
                <div
                  className={"break-words"}
                  key={`${chat.timestamp}-${chat.username}`}
                >
                  <span className={"text-red-500"}>
                    {timestampWithUsername}
                  </span>{" "}
                  {chat.text}
                </div>
              );
            case EventTypes.USER_JOINED:
              const timestamp = `[${hours}:${minutes}]`;
              return (
                <div
                  key={`${chat.timestamp}-${chat.username}`}
                  className={"text-green-500 italic"}
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
          onKeyDown={onEnterClicked}
          className={"border-2 rounded-2xl p-2 w-full"}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <div className={"w-4"} />
        <button
          onClick={onSendMessage}
          disabled={!textInput}
          className={
            "bg-blue-400 rounded-2xl p-2 hover:brightness-75 disabled:bg-slate-400 disabled:brightness-75 disabled:text-white"
          }
        >
          Send
        </button>
      </div>
    </div>
  );
}
