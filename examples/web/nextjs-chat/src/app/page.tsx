"use client";

import { useState } from "react";
import { clearCurrentClient } from "@/utils/momento-web";
import ChatRoom from "@/app/pages/chat-room";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const cacheName = String(process.env.NEXT_PUBLIC_MOMENTO_CACHE_NAME);
  const authMethod = String(process.env.NEXT_PUBLIC_AUTH_METHOD);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session, status } = useSession();

  const [topic, setTopic] = useState("");
  const [username, setUsername] = useState("");
  const [chatRoomSelected, setChatRoomSelected] = useState(false);
  const [usernameSelected, setUsernameSelected] = useState(false);

  const leaveChatRoom = () => {
    clearCurrentClient();
    setChatRoomSelected(false);
    setUsernameSelected(false);
    setTopic("");
    setUsername("");
    signOut();
  };

  if (authMethod === "credentials" && status !== "authenticated") {
    return (
      <div
        className={
          "flex h-full justify-center items-center flex-col bg-slate-300"
        }
      >
        <p className={"w-80 text-center my-2"}>
          This app was configured to allow only authenticated users. Please sign
          in.
        </p>
        <button
          onClick={() => signIn()}
          className={
            "disabled:bg-slate-50 disabled:brightness-75 disabled:cursor-default rounded-2xl hover:cursor-pointer w-24 bg-emerald-400 p-2 hover:brightness-75"
          }
        >
          Sign in
        </button>
      </div>
    );
  }

  if (!chatRoomSelected || !cacheName) {
    return (
      <div
        className={
          "flex h-full justify-center items-center flex-col bg-slate-300"
        }
      >
        <p className={"w-80 text-center my-2"}>
          Please enter the name of the chat room you'd like to join. If it
          doesn't exist, it will be created using Momento Topics.
        </p>
        <div className={"h-8"} />
        <div className={"w-48"}>
          <input
            className={"rounded-2xl w-full p-2"}
            placeholder={"chat room"}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div className={"h-8"} />
        <div className={"w-48"}>
          <button
            onClick={() => setChatRoomSelected(true)}
            disabled={!topic || !cacheName}
            className={
              "disabled:bg-slate-50 disabled:brightness-75 disabled:cursor-default rounded-2xl hover:cursor-pointer w-full bg-emerald-400 p-2 hover:brightness-75"
            }
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  if (!usernameSelected) {
    return (
      <div
        className={
          "flex h-full justify-center items-center flex-col bg-slate-300"
        }
      >
        <div className={"w-72 text-center"}>
          <div>
            Welcome to the <span className={"italic"}>{topic}</span> chat room!
            What would you like to be called?
          </div>
        </div>
        <div className={"h-4"} />
        <div className={"flex w-72 justify-center"}>
          <input
            className={"rounded-2xl p-2 w-60 items-center"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={"username"}
          />
        </div>
        <div className={"h-4"} />
        <div className={"w-72 flex justify-center"}>
          <button
            onClick={() => setUsernameSelected(true)}
            disabled={!username}
            className={
              "disabled:bg-slate-50 disabled:brightness-75 disabled:cursor-default rounded-2xl hover:cursor-pointer w-24 bg-emerald-400 p-2 hover:brightness-75"
            }
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatRoom
      topicName={topic}
      cacheName={cacheName}
      username={username}
      onLeave={leaveChatRoom}
    />
  );
}
