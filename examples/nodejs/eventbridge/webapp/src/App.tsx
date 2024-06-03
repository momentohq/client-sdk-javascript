// App.tsx

import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import DbForm from "./components/DbForm.tsx";
import React, { useEffect, useState } from "react";
import DescribeCache from "./components/DescribeCache.tsx";
import Topic from "./components/Topic.tsx";
import {
  clearCurrentClient,
  type Message,
  subscribeToTopic,
} from "./utils/momento-web.ts";
import { type TopicItem, type TopicSubscribe } from "@gomomento/sdk-web";
import { toastSuccess } from "./utils/toast.tsx";
import MomentoCacheSVG from "./assets/momento-service-arch-icon-Cache.svg";
import MomentoTopicSVG from "./assets/momento-service-arch-icon-Topics.svg";
import DynamoDBSVG from "./assets/aws-dynamodb.svg";
import MomentoLogo from "./assets/momento-logo-mint.svg";

const App = () => {
  const [gameId, setGameId] = useState<string>("");
  const [gamerTag, setGamerTag] = useState<string>("");
  const [score, setScore] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [isSubscribedToTopic, setIsSubscribedToTopic] =
    useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    if (id === "game-id-input") {
      setGameId(value);
    } else if (id === "gamer-tag-input") {
      setGamerTag(value);
    } else if (id === "score-input") {
      setScore(value);
    } else if (id === "level-input") {
      setLevel(value);
    }
  };

  const handleSetMessages = (message: Message) => {
    setMessages((curr) => [...curr, message]);
  };

  const onItem = (item: TopicItem) => {
    try {
      const message = {
        text: item.valueString(),
        timestamp: Date.now(),
      };
      handleSetMessages(message);
    } catch (e) {
      console.error("unable to parse message", e);
    }
  };

  useEffect(() => {
    clearCurrentClient();
    setMessages([]);
    setIsSubscribedToTopic(false);
  }, [gamerTag, gameId]);

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
    await subscribeToTopic(gameId, gamerTag, onItem, onError);
  };

  const handleSubscribe = async (cacheName: string, topicName: string) => {
    const subscription = await subscribeToTopic(
      cacheName,
      topicName,
      onItem,
      onError,
    );
    if (subscription) {
      setIsSubscribedToTopic(true);
      toastSuccess(`Successfully subscribed to topic: ${gamerTag}`);
    }
  };

  return (
    <div>
      <div className={"mb-2 bg-gray-100 p-6 text-2xl font-bold"}>
        <div className="flex flex-col items-center">
          <div className="mb-2">
            <img src={MomentoLogo} alt="Momento Logo" className="w-36 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-center">Welcome to Momento Game Score Demo</h1>
          </div>
          <div className="text-center">
            <p className="mt-2 text-sm font-light">
              To begin, enter/delete the game details in the leftmost box to store an item
              in the DynamoDB table: <strong>game-score-demo</strong>. Make sure to
              subscribe to the topic (i.e., <strong>Gamer Tag</strong>) within the
              cache (i.e., <strong>Game Id</strong>) using the rightmost box before
              submitting an item. After submitting an item using the form, you can
              use the center box to retrieve an item from the Momento cache and use
              the rightmost to view the published messages.
            </p>
          </div>
        </div>
      </div>
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center bg-gray-100 p-4">
          <div className="w-full">
            <div className="flex items-center justify-center mb-6">
              <img src={DynamoDBSVG} alt="DynamoDB" className="w-10 h-8" />
              <h1
                className="text-2xl ml-4 font-bold text-gray-700">
                Enter/Delete Game Record
              </h1>
            </div>
            <DbForm
              gameId={gameId}
              gamerTag={gamerTag}
              level={level}
              score={score}
              setLevel={setLevel}
              setScore={setScore}
              setGamerTag={setGamerTag}
              setGameId={setGameId}
              handleChange={handleChange}
            />
          </div>
        </div>

        <div className="flex flex-col items-center bg-gray-100 p-4">
          <div className={`w-full`}>
            <div className="flex items-center justify-center mb-6">
              <img src={MomentoCacheSVG} alt="Momento Cache" className="w-10 h-8" />
              <h1
                className="text-2xl ml-4 font-bold text-gray-700">
                Get Item From Cache
              </h1>
            </div>
            <DescribeCache gameId={gameId} gamerTag={gamerTag} />
          </div>
        </div>

        <div className="flex flex-col items-center bg-gray-100 p-4">
          <div className={`w-full`}>
            <div className="flex items-center justify-center mb-6">
              <img src={MomentoTopicSVG} alt="Momento Topics" className="w-10 h-8" />
              <h1
                className="text-2xl ml-4 font-bold text-gray-700">
                Subscribe to Topic
              </h1>
            </div>
            <Topic
              gameId={gameId}
              gamerTag={gamerTag}
              isSubscribedToTopic={isSubscribedToTopic}
              messages={messages}
              handleSubscribe={handleSubscribe}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
