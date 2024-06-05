import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import MomentoLogo from "./assets/momento-mark-mint.svg";
import AwsEventBridgeLogo from "./assets/aws-eventbridge.svg";
import MomentoCacheLogo from "./assets/momento-service-arch-icon-Cache.svg";
import MomentoTopicLogo from "./assets/momento-service-arch-icon-Topics.svg";
import DynamoDbLogo from "./assets/aws-dynamodb.svg";
import React, { useEffect, useState } from "react";
import CreateRecordForm from "./components/CreateRecordForm";
import DescribeCache from "./components/DescribeCache";
import Topic from "./components/Topic";
import { clearCurrentClient, Message, subscribeToTopic } from "./utils/momento-web";
import { TopicItem, TopicSubscribe } from "@gomomento/sdk-web";
import { ArrowDown } from "./svgs/arrow-down";
import DeleteRecordForm from "./components/DeleteRecordForm";
import { ArrowLeft } from "./svgs/arrow-left";
import { ArrowRight } from "./svgs/arrow-right";
import InfoModal from "./components/InfoModal";
import CacheModal from "./components/CacheModal";

const App = () => {
  const [location, setLocation] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [precipitation, setPrecipitation] = useState("");
  const [isSubscribedToTopic, setIsSubscribedToTopic] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [doesCacheExist, setDoesCacheExist] = useState<boolean>(true);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState<boolean>(() => {
    const infoModalClosed = localStorage.getItem("isInfoModalClosed");
    return infoModalClosed !== "true";
  });
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
    subscribeToTopic(onItem, onError).then((subscription) => {
      if (subscription instanceof TopicSubscribe.Subscription) {
        setIsSubscribedToTopic(true);
      } else {
        setIsSubscribedToTopic(false);
        setDoesCacheExist(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doesCacheExist]);

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
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-green-900 p-4 text-white">
        <div className="flex justify-center items-center">
          <img src={MomentoLogo} alt="Momento Logo" className="w-8 h-8" />
          <span className="mx-2">+</span>
          <img src={AwsEventBridgeLogo} alt="AWS EventBridge Logo" className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-semibold text-center mt-2">Welcome to the DynamoDB-Momento EventBridge Demo</h1>
      </header>

      <main className="flex flex-col mt-2 flex-grow">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 justify-center p-2">
          <div className="flex flex-col w-full bg-white p-4 space-y-2 rounded-lg shadow-md">
            <h1 className="text-xl font-bold text-center text-teal-700">Enter Weather Record</h1>
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
          <div className="flex flex-col w-full bg-white p-4 space-y-2 rounded-lg shadow-md">
            <h1 className="text-xl font-bold text-center text-teal-700">Delete Weather Record</h1>
            <DeleteRecordForm
              location={location}
              handleChange={handleChange}
            />
          </div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <ArrowDown />
          <div className="flex flex-col md:flex-row items-center justify-center mt-2 space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={MomentoCacheLogo} alt="Momento Cache Logo" className="w-12 h-12" />
              <span className="ml-2 font-semibold">Momento Cache</span>
            </div>
            <ArrowLeft />
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={DynamoDbLogo} alt="DynamoDB Logo" className="w-12 h-12" />
              <span className="ml-2 font-semibold">DynamoDB</span>
            </div>
            <ArrowRight />
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={MomentoTopicLogo} alt="Momento Topic Logo" className="w-12 h-12" />
              <span className="ml-2 font-semibold">Momento Topic</span>
            </div>
          </div>

          <div className="flex flex-row justify-evenly mt-2 w-full">
            <ArrowDown />
            <ArrowDown />
          </div>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 p-2 mt-2">
          <div className="bg-white p-4 rounded-lg shadow-md flex-1">
            <h1 className="font-bold text-teal-700 mb-2">Get Item From Cache</h1>
            <DescribeCache location={location} />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex-1">
            <h1 className="font-bold text-teal-700 mb-2">Published Items</h1>
            <Topic
              location={location}
              isSubscribedToTopic={isSubscribedToTopic}
              messages={messages}
            />
          </div>
        </div>
      </main>

      <InfoModal
        isVisible={isInfoModalVisible}
        onClose={() => {
          setIsInfoModalVisible(!isInfoModalVisible)
          localStorage.setItem("isInfoModalClosed", "true");
        }
      }
      />
      {
        !doesCacheExist && (
          <CacheModal
            isVisible={!doesCacheExist}
            onClose={() => {
              setDoesCacheExist(true);
            }}
          />
        )
      }
    </div>
  );
};

export default App;
