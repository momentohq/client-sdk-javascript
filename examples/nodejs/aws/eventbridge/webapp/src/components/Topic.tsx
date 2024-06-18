import { useEffect, useRef } from "react";
import { Message } from "../utils/momento-web";

type TopicProps = {
  location: string;
  isSubscribedToTopic: boolean;
  messages: Message[];
};

const Topic = (props: TopicProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
      }
    };
    scrollToBottom();
  }, [props.messages]);

  return (
      <div
        className="flex-grow h-56 justify-start text-sm overflow-y-auto rounded-lg border bg-gray-50 p-4 text-left text-gray-500">
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
          <p className={"font-mono text-sm"}>No messages</p>
        )}
        <div ref={messagesEndRef} />
      </div>
  );
};

export default Topic;
