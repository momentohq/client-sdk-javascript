import { useState } from "react";
import { clearCurrentClient } from "./utils/momento-web";
import ChatRoom from "./components/chat-room";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [username, setUsername] = useState("");
  const [cognitoUser, setCognitoUser] = useState(import.meta.env.VITE_TOKEN_VENDING_MACHINE_AUTH_TYPE === "cognito" ? "ReadOnly" : "ReadWrite");
  const [chatRoomSelected, setChatRoomSelected] = useState(false);
  const [usernameSelected, setUsernameSelected] = useState(false);
  const [cognitoUserSelected, setCognitoUserSelected] = useState(false);

  const leaveChatRoom = () => {
    clearCurrentClient();
    setChatRoomSelected(false);
    setUsernameSelected(false);
    setCognitoUserSelected(false);
    setTopic("");
    setUsername("");
    setCognitoUser("ReadOnly");
  };

  if (!import.meta.env.VITE_MOMENTO_CACHE_NAME) {
    throw new Error("missing required env var VITE_MOMENTO_CACHE_NAME")
  }
  if (!import.meta.env.VITE_TOKEN_VENDING_MACHINE_URL) {
    throw new Error("missing required env var VITE_TOKEN_VENDING_MACHINE_URL")
  }

  if (import.meta.env.VITE_TOKEN_VENDING_MACHINE_AUTH_TYPE === "cognito" && !cognitoUserSelected) {
    return(
      <div className={
        "flex h-full justify-center items-center flex-col bg-slate-300"
      }>
          <label
            htmlFor={"cognito-users-list"}
            className={"block mb-2 text-sm font-medium text-gray-900 text-center"}
          >
            This app was configured to allow only authenticated users. <br />
            In a real-world application, this would be a more typical login or SSO page. <br />
            For demo purposes you can select one of our pre-configured users. <br />
          </label>
          <select
            className="my-2 py-3 px-4 pr-9 block w-80 border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
            value={cognitoUser}
            onChange={(e) => setCognitoUser(e.target.value)}
            id={"caches-list"}
          >
            <option value={"ReadOnly"}>User with Readonly permissions</option>
            <option value={"ReadWrite"}>User with Read and Write Permissions</option>
          </select>
          <div className={"w-52 mt-2"}>
            <button
              onClick={() => setCognitoUserSelected(true)}
              className={
                "disabled:bg-slate-50 disabled:brightness-75 disabled:cursor-default rounded-2xl hover:cursor-pointer w-full bg-emerald-400 p-2 hover:brightness-75"
              }
            >
              Continue
            </button>
          </div>
        </div>
    );
  }

  if (!chatRoomSelected) {
    return (
      <div
        className={
          "flex h-full justify-center items-center flex-col bg-slate-300"
        }
      >
        <div className={"w-80 text-center my-2"}>
          Please enter the name of the chat room you'd like to join.
          If it doesn't exist, it will be created using Momento Topics.
        </div>
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
            disabled={!topic}
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
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      cacheName={import.meta.env.VITE_MOMENTO_CACHE_NAME}
      username={username}
      selectedUser={cognitoUser}
      onLeave={leaveChatRoom}
    />
  );
}
