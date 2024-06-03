import { useEffect, useState, useRef } from "react";
import { type Message } from "../utils/momento-web.ts";

type TopicProps = {
  gameId: string;
  gamerTag: string;
  isSubscribedToTopic: boolean;
  messages: Message[];
  handleSubscribe: (cacheName: string, topicName: string) => void;
};

const Topic = (props: TopicProps) => {
  const [cacheName, setCacheName] = useState<string>(props.gameId);
  const [topicName, setTopicName] = useState<string>(props.gamerTag);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCacheName(props.gameId);
  }, [props.gameId]);

  useEffect(() => {
    setTopicName(props.gamerTag);
  }, [props.gamerTag]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.messages]);

  const handleSubscribeClick = () => {
    props.handleSubscribe(cacheName, topicName);
  };

  return (
    <>
      <div className="mb-4 flex flex-row items-center">
        <label
          htmlFor="cache-name-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Cache Name
        </label>
        <input
          type="text"
          id="cache-name-input"
          value={cacheName}
          onChange={(e) => setCacheName(e.target.value)}
          required
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter Cache Name (Game ID)"
        />
      </div>
      <div className="mb-4 flex flex-row items-center">
        <label
          htmlFor="topic-name-input"
          className="text-sm font-medium text-gray-600 mr-2 w-24"
        >
          Topic Name
        </label>
        <div className="flex flex-1">
          <input
            data-automation-id="topic-name-input"
            autoFocus={true}
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            type="text"
            id="find-key-input"
            placeholder="Enter Topic Name (Gamer Tag)"
            className="flex-1 rounded-l-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleSubscribeClick}
            className="rounded-r-lg bg-teal-500 px-3 py-1 font-bold text-white hover:bg-teal-600 focus:outline-none focus:ring-blue-500"
          >
            Subscribe
          </button>
        </div>
      </div>
      <div className="h-72 flex-grow justify-start overflow-y-auto rounded-lg border bg-gray-50 p-4 text-left text-gray-500">
        {props.messages.length > 0 ? (
          props.messages.map((message, index) => {
            const parsedMessage = JSON.parse(message.text);
            return (
              <div
                key={index}
                className="mb-2 flex justify-between text-gray-600 text-sm border-b p-2 font-mono"
              >
                <div>
                  <p>Level: {parsedMessage.level}</p>
                  <p>Score: {parsedMessage.score}</p>
                </div>
                <p>{new Date(message.timestamp).toLocaleString()}</p>
              </div>
            );
          })
        ) : (
          <p>No messages</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      {props.isSubscribedToTopic ? (
        <div className="flex mt-2 items-center justify-center p-2 space-x-2 text-green-600 bg-green-100 rounded-md">
          <span>Subscribed</span>
          <span className="text-xl">&#x2714;</span>
        </div>
      ) : (
        <div className="flex mt-2 items-center justify-center p-2 space-x-2 text-red-600 bg-red-100 rounded-md">
          <span>Subscribed</span>
          <span className="text-xl">&#x2716;</span>
        </div>
      )}
    </>
  );
};

export default Topic;
