import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import MomentoLogo from "./assets/momento-mark-mint.svg";
import AwsEventBridgeLogo from "./assets/aws-eventbridge.svg";
import MomentoCacheLogo from "./assets/momento-service-arch-icon-Cache.svg";
import MomentoTopicLogo from "./assets/momento-service-arch-icon-Topics.svg";
import DynamoDbLogo from "./assets/aws-dynamodb.svg";
import React, {useEffect, useState} from "react";
import CreateRecordForm from "./components/CreateRecordForm.tsx";
import DescribeCache from "./components/DescribeCache.tsx";
import Topic from "./components/Topic.tsx";
import { clearCurrentClient, Message, subscribeToTopic } from "./utils/momento-web.ts";
import type { TopicItem, TopicSubscribe } from "@gomomento/sdk-web";
import GetRecord from "./components/GetRecord.tsx";
import {ArrowDown} from "./svgs/arrow-down.tsx";
import {ArrowLeftwards} from "./svgs/arrow-leftwards.tsx";
import {ArrowRightwards} from "./svgs/arrow-rightwards.tsx";
import DeleteRecordForm from "./components/DeleteRecordForm.tsx";

const App = () => {
  const [location, setLocation] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [precipitation, setPrecipitation] = useState("");
  const [isSubscribedToTopic, setIsSubscribedToTopic] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

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
    await subscribeToTopic(onItem, onError);
  };

  useEffect(() => {
    clearCurrentClient();
    void handleSubscribe();
  }, []);

  const handleSubscribe = async () => {
    const subscription = await subscribeToTopic(
      onItem,
      onError,
    );
    if (subscription) {
      setIsSubscribedToTopic(true);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    if (id === "location-input") {
      setLocation(value);
    } else if (id === "max-temp-input") {
      setMaxTemp(value);
    } else if (id === "min-temp-input") {
      setMinTemp(value);
    } else if (id === "precipitation-input") {
      setPrecipitation(value);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className={"bg-gray-100 p-6 text-2xl font-bold"}>
        <div className="flex flex-col items-center">
          <div className="mb-2 flex">
            <img src={MomentoLogo} alt="Momento Logo" className="w-8 h-8"/>
            <div className={"ml-2 mr-2"}>.</div>
            <img src={AwsEventBridgeLogo} alt="Aws Eventbridge Logo" className="w-8 h-8"/>
          </div>
          <h1 className="text-xl font-semibold text-center">Welcome to Weather Statistics Demo</h1>
        </div>
      </div>

      <div className={"flex flex-col mt-4"}>
        <div className={"flex flex-row space-x-8 justify-center p-4"}>
          <div className={"flex flex-col w-1/3 bg-gray-100 p-4 space-y-4 rounded-lg"}>
            <div className={"text-center"}>
              <h1 className="text-2xl font-bold text-gray-700">Enter Weather Record</h1>
            </div>
            <CreateRecordForm
              location={location}
              maxTemp={maxTemp}
              minTemp={minTemp}
              precipitation={precipitation}
              setLocation={setLocation}
              setPrecipitation={setPrecipitation}
              setMaxTemp={setMaxTemp}
              setMinTemp={setMinTemp}
              handleChange={handleChange}
            />
          </div>
          <div className={"font-bold text-xl"}>OR</div>
          <div className={"flex flex-col w-1/3 bg-gray-100 p-4 space-y-4 rounded-lg"}>
            <div className={"text-center"}>
              <h1 className="text-2xl font-bold text-gray-700">Delete Weather Record</h1>
            </div>
            <DeleteRecordForm
              location={location}
              handleChange={handleChange}
            />
          </div>
        </div>

        <div className={"items-center mt-4 flex flex-col justify-center"}>
          <ArrowDown/>
          <div className={"bg-gray-100 p-6 space-x-2 flex items-center shadow-md rounded-lg "}>
            <img src={DynamoDbLogo} alt="Momento Cache Logo" className="w-12 h-12"/>
            <span className={"font-semibold"}>DynamoDB</span>
          </div>
          <div className={"flex flex-row justify-between space-x-24"}>
            <ArrowLeftwards/>
            <ArrowRightwards/>
          </div>
          <div className={"flex flex-row justify-between space-x-48"}>
            <div className={"bg-gray-100 p-6 space-x-2 flex items-center shadow-md rounded-lg "}>
              <img src={MomentoCacheLogo} alt="Momento Cache Logo" className="w-12 h-12"/>
              <span className={"font-semibold"}>Momento Cache</span>
            </div>
            <div className={"bg-gray-100 p-6 space-x-2 flex items-center shadow-md rounded-lg "}>
              <img src={MomentoTopicLogo} alt="Momento Topic Logo" className="w-12 h-12"/>
              <span className={"font-semibold"}>Momento Topic</span>
            </div>
          </div>
          <div className={"flex flex-row justify-between space-x-72"}>
            <ArrowLeftwards/>
            <ArrowRightwards/>
          </div>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 p-4">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4">
            <div className="bg-gray-100 p-4 rounded-lg flex-1">
              <h1 className="font-bold mb-4">Get Item From Cache</h1>
              <DescribeCache location={location}/>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg flex-1">
              <h1 className="font-bold mb-4">Get Record From DynamoDB</h1>
              <GetRecord location={location}/>
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg flex-1">
            <h1 className="font-bold mb-4">Published Items</h1>
            <Topic
              location={location}
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
