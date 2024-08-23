import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import MomentoLogo from "./assets/momento-mark-mint.svg";
import AwsEventBridgeLogo from "./assets/aws-eventbridge.svg";
import MomentoCacheLogo from "./assets/momento-service-arch-icon-Cache.svg";
import MomentoTopicLogo from "./assets/momento-service-arch-icon-Topics.svg";
import DynamoDbLogo from "./assets/aws-dynamodb.svg";
import React, {useEffect, useState} from "react";
import CreateRecordForm from "./components/CreateRecordForm";
import DescribeCache from "./components/DescribeCache";
import Topic from "./components/Topic";
import {cacheName, clearCurrentClient, Message, subscribeToTopic, topicName} from "./utils/momento-web";
import {TopicItem, TopicSubscribe, TopicSubscribeResponse} from "@gomomento/sdk-web";
import {ArrowDown} from "./svgs/arrow-down";
import DeleteRecordForm from "./components/DeleteRecordForm";
import {ArrowLeft} from "./svgs/arrow-left";
import {ArrowRight} from "./svgs/arrow-right";
import InfoModal from "./components/InfoModal";
import CacheModal from "./components/CacheModal";
import {CornerLeftDown} from "./svgs/corner-left-down";
import {CornerRightDown} from "./svgs/corner-right-down";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import {CheckCircle} from "./svgs/check-circle";
import {BanCircle} from "./svgs/ban-circle";
import {tableName} from "./utils/dynamodb";

const App = () => {
  const [location, setLocation] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [ttl, setTtl] = useState("");
  const [precipitation, setPrecipitation] = useState("");
  const [isSubscribedToTopic, setIsSubscribedToTopic] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [doesCacheExist, setDoesCacheExist] = useState<boolean>(true);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState<boolean>(true);
  const [operation, setOperation] = useState<string>("create");

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
      switch (subscription?.type) {
        case TopicSubscribeResponse.Subscription:
          setIsSubscribedToTopic(true);
          break;
        case TopicSubscribeResponse.Error:
        default:
          setIsSubscribedToTopic(false);
          setDoesCacheExist(false);
          break;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doesCacheExist]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {id, value} = event.target;
    if (id === "location-input") {
      setLocation(value);
    } else if (id === "max-temp-input") {
      setMaxTemp(value);
    } else if (id === "min-temp-input") {
      setMinTemp(value);
    } else if (id === "precipitation-input") {
      setPrecipitation(value);
    } else if (id === "ttl-input") {
      setTtl(value);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-green-900 p-2 text-white">
        <div className="flex space-x-4 justify-center items-center">
          <img src={MomentoLogo} alt="Momento Logo" className="w-6 h-6"/>
          <span className="mx-2">+</span>
          <img src={AwsEventBridgeLogo} alt="AWS EventBridge Logo" className="w-6 h-6"/>
          <h1 className="text-lg font-semibold text-center mt-2">Welcome to the DynamoDB-Momento EventBridge Demo</h1>
        </div>
      </header>
      <main className="flex flex-col mt-2 flex-grow">
        <div className={"flex flex-col space-y-2 justify-center p-2"}>
          <div className={"flex flex-row ml-2 space-x-4"}>
            <h1 className="font-bold text-center text-teal-700">Choose a Weather Record Operation</h1>
            <label>
              <div className="flex flex-row justify-center items-center">
                <input
                  type="radio"
                  id="create"
                  name="operation"
                  value="create"
                  checked={operation === "create"}
                  onChange={() => setOperation("create")}
                />
                <label htmlFor="create" className="ml-2">Create</label>
              </div>
            </label>
            <label>
              <div className="flex flex-row justify-center items-center">
                <input
                  type="radio"
                  id="delete"
                  name="operation"
                  value="delete"
                  checked={operation === "delete"}
                  onChange={() => setOperation("delete")}
                />
                <label htmlFor="create" className="ml-2">Delete</label>
              </div>
            </label>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {operation === "create" && (
              <div className="flex flex-col bg-white p-4 space-y-2 rounded-lg shadow-md">
                <CreateRecordForm
                  location={location}
                  maxTemp={maxTemp}
                  minTemp={minTemp}
                  precipitation={precipitation}
                  ttl={ttl}
                  setLocation={setLocation}
                  setPrecipitation={setPrecipitation}
                  setMaxTemp={setMaxTemp}
                  setMinTemp={setMinTemp}
                  setTtl={setTtl}
                  handleChange={handleChange}
                />
              </div>
            )}
            {operation === "delete" && (
              <div className="flex flex-col w-full bg-white p-4 space-y-2 rounded-lg shadow-md">
                <DeleteRecordForm
                  location={location}
                  handleChange={handleChange}
                />
              </div>)}
            {operation == "create" && (<div>
              <h1 className="font-semibold text-sm text-teal-700">Put Item in DynamoDB</h1>
              <div className={"text-sm text-gray-500"}>
                Clicking the "Submit" button will run the following code to write the weather record to DDB:
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-sm">
                <pre>
                  <code className={"whitespace-pre-wrap"}>
                    {`ddbClient.putItem({TableName: ${tableName}, Item: item})`}
                  </code>
                </pre>
              </div>
            </div>)}
            {operation == "delete" && (<div>
              <h1 className="font-semibold text-teal-700 text-sm">Delete Item from DynamoDB</h1>
              <div className={"text-sm text-gray-500"}>
                Clicking the "Delete" button will run the following code to delete the weather record from DDB:
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <pre>
                <code>
                  {`ddbClient.deleteItem({TableName: 'weather-stats-demo', Key: ${location ? location : "key"}})`}
                </code>
              </pre>
              </div>
            </div>)}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <ArrowDown />
          <div
            className="flex flex-col md:flex-row items-center justify-center mt-2 space-y-2 md:space-y-0 md:space-x-4">
            <CornerLeftDown/>
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={MomentoTopicLogo} alt="Momento Topic Logo" className="w-6 h-6"/>
              <span className="ml-2 font-semibold">Momento Topic</span>
            </div>
            <ArrowLeft/>
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={AwsEventBridgeLogo} alt="AWS EventBridge Logo" className="w-6 h-6"/>
              <span className="ml-2 font-semibold">AWS EventBridge</span>
            </div>
            <ArrowLeft/>
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={DynamoDbLogo} alt="DynamoDB Logo" className="w-6 h-6"/>
              <span className="ml-2 font-semibold">DynamoDB</span>
            </div>
            <ArrowRight/>
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={AwsEventBridgeLogo} alt="AWS EventBridge Logo" className="w-6 h-6"/>
              <span className="ml-2 font-semibold">AWS EventBridge</span>
            </div>
            <ArrowRight/>
            <div className="flex items-center bg-white p-4 shadow-md rounded-lg">
              <img src={MomentoCacheLogo} alt="Momento Cache Logo" className="w-6 h-6"/>
              <span className="ml-2 font-semibold">Momento Cache</span>
            </div>
            <CornerRightDown/>
          </div>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 p-2 mt-2">
          <div className="bg-white p-4 rounded-lg shadow-md flex-1 space-y-3">
            <div className={"flex flex-row space-x-2 text-sm items-center"}>
              <h1 className="font-bold text-teal-700">Published Messages: </h1>
              <div className={"text-sm text-gray-500"}>
                When DDB items are updated or deleted, EventBridge sends messages to the Momento Topic. Those messages
                will show up here, because we've subscribed to the topic using the code below.
              </div>
            </div>
            <div>
              <div className="flex rounded-lg space-x-1 text-sm">
                <h2 className="font-semibold">Cache Name: <span className="text-gray-600 ml-2">{cacheName}</span></h2>
                <span className={"mr-2"}>,</span>
                <h2 className="font-semibold">Topic Name: <span className="text-gray-600 ml-2">{topicName}</span></h2>
                <div className="flex flex-row space-x-2">
                  {isSubscribedToTopic ? (
                    <Tippy content={"Subscribed"} placement={"top"} trigger={"mouseenter"}>
                      <div><CheckCircle /></div>
                    </Tippy>
                  ) : (
                    <Tippy content={"Unsubscribed"} placement={"top"}>
                      <div><BanCircle /></div>
                    </Tippy>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg text-sm">
                <pre>
                  <code className={"whitespace-pre-wrap"}>
                    {`topicClient.subscribe("${cacheName}", "${topicName}", {onItem: onItemCallback})`}
                  </code>
                </pre>
            </div>
            <Topic
              location={location}
              isSubscribedToTopic={isSubscribedToTopic}
              messages={messages}
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex-1 space-y-2">
            <div className={"flex flex-row items-center text-sm space-x-2"}>
              <h1 className="font-bold text-teal-700">Get Item From Cache: </h1>
              <div className={"text-sm text-gray-500"}>
                When DDB items are updated or deleted, EventBridge uses the Momento API Destination to update the Cache.
                Click the "Get Item" button to read the item from the cache using the code below.
              </div>
            </div>
            <div>
              <div className="flex rounded-lg text-sm">
                <h2 className="font-semibold">Cache Name: <span className="text-gray-600 ml-2">{cacheName}</span></h2>
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg text-sm">
                <pre>
                  <code className={"whitespace-pre-wrap"}>
                    {`cacheClient.get("${cacheName}", "${location ? location : "key"}")`}
                  </code>
                </pre>
            </div>
            <DescribeCache location={location} handleChange={handleChange}/>
          </div>
        </div>
      </main>

      <InfoModal
        isVisible={isInfoModalVisible}
        onClose={() => {
          setIsInfoModalVisible(!isInfoModalVisible)
        }
        }
      />
      {
        !doesCacheExist && !isInfoModalVisible && (
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
