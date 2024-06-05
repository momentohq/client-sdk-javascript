import { useEffect, useRef } from "react";
import {cacheName, Message, topicName} from "../utils/momento-web";

type TopicProps = {
  location: string;
  isSubscribedToTopic: boolean;
  messages: Message[];
};

const Topic = (props: TopicProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.messages]);

  return (
    <>
      <div className="mb-4 flex items-center bg-yellow-100 p-2 rounded-lg">
        <h2 className="font-semibold">Cache Name:</h2>
        <span className="text-gray-600 ml-2">{cacheName}</span>
        <span className={"ml-2 mr-2"}></span>
        <h2 className="font-semibold">Topic Name:</h2>
        <span className="text-gray-600 ml-2">{topicName}</span>
      </div>
      {props.isSubscribedToTopic ? (
        <div className="flex mt-2 mb-4 items-center justify-center p-2 space-x-2 text-green-600 bg-green-100 rounded-md">
          <span>Subscribed</span>
          <span className="text-xl">&#x2714;</span>
        </div>
      ) : (
        <div className="flex mt-2 items-center justify-center p-2 space-x-2 text-red-600 bg-red-100 rounded-md">
          <span>Subscribed</span>
          <span className="text-xl">&#x2716;</span>
        </div>
      )}
      <div
        className="h-56 flex-grow justify-start overflow-y-auto rounded-lg border bg-gray-50 p-4 text-left text-gray-500">
        {props.messages.length > 0 ? (
          props.messages.map((message, index) => {
            const parsedMessage = JSON.parse(message.text);
            return (
              <div
                key={index}
                className="mb-2 flex justify-between text-gray-600 text-sm border-b p-2 font-mono"
              >
                <pre>
                  {JSON.stringify(parsedMessage, null, 2)}
                </pre>
                <p>{new Date(message.timestamp).toLocaleString()}</p>
              </div>
            );
          })
        ) : (
          <p>No messages</p>
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
};

export default Topic;
