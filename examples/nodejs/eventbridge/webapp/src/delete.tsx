// import "./index.css";
// import "react-toastify/dist/ReactToastify.css";
// import MomentoLogo from "./assets/momento-mark-mint.svg";
// import AwsEventBridgeLogo from "./assets/aws-eventbridge.svg";
// import MomentoCacheLogo from "./assets/momento-service-arch-icon-Cache.svg";
// import MomentoTopicLogo from "./assets/momento-service-arch-icon-Topics.svg";
// import DynamoDbLogo from "./assets/aws-dynamodb.svg";
// import React, {useEffect, useState} from "react";
// import CreateRecordForm from "./components/CreateRecordForm.tsx";
// import DescribeCache from "./components/DescribeCache.tsx";
// import Topic from "./components/Topic.tsx";
// import { clearCurrentClient, Message, subscribeToTopic } from "./utils/momento-web.ts";
// import type { TopicItem, TopicSubscribe } from "@gomomento/sdk-web";
// import {ArrowRight} from "./svgs/arrow-right.tsx";
// import {ArrowUpwards} from "./svgs/arrow-upwards.tsx";
// import {ArrowDownwards} from "./svgs/arrow-downwards.tsx";
// import GetRecord from "./components/GetRecord.tsx";
//
// const App = () => {
//   const [location, setLocation] = useState("");
//   const [maxTemp, setMaxTemp] = useState("");
//   const [minTemp, setMinTemp] = useState("");
//   const [precipitation, setPrecipitation] = useState("");
//   const [isSubscribedToTopic, setIsSubscribedToTopic] = useState<boolean>(false);
//   const [messages, setMessages] = useState<Message[]>([]);
//
//   const handleSetMessages = (message: Message) => {
//     setMessages((curr) => [...curr, message]);
//   };
//
//   const onItem = (item: TopicItem) => {
//     try {
//       const message = {
//         text: item.valueString(),
//         timestamp: Date.now(),
//       };
//       handleSetMessages(message);
//     } catch (e) {
//       console.error("unable to parse message", e);
//     }
//   };
//
//   const onError = async (
//     error: TopicSubscribe.Error,
//     sub: TopicSubscribe.Subscription,
//   ) => {
//     console.error(
//       "received error from momento, getting new token and resubscribing",
//       error,
//     );
//     sub.unsubscribe();
//     clearCurrentClient();
//     await subscribeToTopic(onItem, onError);
//   };
//
//   useEffect(() => {
//     clearCurrentClient();
//     void handleSubscribe();
//   }, []);
//
//   const handleSubscribe = async () => {
//     const subscription = await subscribeToTopic(
//       onItem,
//       onError,
//     );
//     if (subscription) {
//       setIsSubscribedToTopic(true);
//     }
//   };
//
//   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const { id, value } = event.target;
//     if (id === "location-input") {
//       setLocation(value);
//     } else if (id === "max-temp-input") {
//       setMaxTemp(value);
//     } else if (id === "min-temp-input") {
//       setMinTemp(value);
//     } else if (id === "precipitation-input") {
//       setPrecipitation(value);
//     }
//   };
//
//   return (
//     <div className="flex flex-col h-screen">
//       <div className={"bg-gray-100 p-6 text-2xl font-bold"}>
//         <div className="flex flex-col items-center">
//           <div className="mb-2 flex">
//             <img src={MomentoLogo} alt="Momento Logo" className="w-8 h-8"/>
//             <div className={"ml-2 mr-2"}>.</div>
//             <img src={AwsEventBridgeLogo} alt="Aws Eventbridge Logo" className="w-8 h-8"/>
//           </div>
//           <h1 className="text-xl font-semibold text-center">Welcome to Weather Statistics Demo</h1>
//         </div>
//       </div>
//
//       <div className="flex-grow flex">
//         {/* Left Section: Weather Form */}
//         <div className="flex w-1/4 items-center ml-4 p-4">
//           <div className="bg-gray-100 shadow-md rounded-lg p-6">
//             <div className="flex items-center justify-center mb-6">
//               <h1 className="text-2xl font-bold text-gray-700">Enter Weather Record</h1>
//             </div>
//             <CreateRecordForm
//               location={location}
//               maxTemp={maxTemp}
//               minTemp={minTemp}
//               precipitation={precipitation}
//               setLocation={setLocation}
//               setPrecipitation={setPrecipitation}
//               setMaxTemp={setMaxTemp}
//               setMinTemp={setMinTemp}
//               handleChange={handleChange}
//             />
//           </div>
//           <div>
//             <ArrowRight />
//           </div>
//         </div>
//
//         {/* Middle Section: Arrows and DB Icon */}
//         <div className="flex items-center p-4 ml-8">
//           <div className="bg-gray-100 shadow-md rounded-lg p-6">
//             <img src={DynamoDbLogo} alt="DynamoDB Logo" className="w-12 h-12"/>
//           </div>
//           <div className={"space-y-10"}>
//             <ArrowUpwards />
//             <ArrowDownwards />
//           </div>
//           <div className={"space-y-40"}>
//             <div className="flex flex-row">
//               <div className={"bg-gray-100 p-6 shadow-md rounded-lg "}>
//                 <img src={MomentoCacheLogo} alt="Momento Cache Logo" className="w-12 h-12"/>
//               </div>
//               <div className={"mt-4"}>
//                 <ArrowRight />
//               </div>
//             </div>
//             <div className="flex flex-row">
//               <div className={"bg-gray-100 p-6 shadow-md rounded-lg "}>
//                 <img src={MomentoTopicLogo} alt="Momento Topic Logo" className="w-12 h-12"/>
//               </div>
//               <div className={"mt-4"}>
//                 <ArrowRight />
//               </div>
//             </div>
//           </div>
//         </div>
//
//         {/* Right Section: Cache and Topic */}
//         <div className="p-4 w-1/2">
//           <div className="p-4 bg-gray-100 rounded-lg">
//             <div className={"flex flex-row justify-around"}>
//               <h1 className={"font-bold mb-4"}>Get Item From Cache</h1>
//               <h1 className={"font-bold mb-4"}>Get Record From DynamoDB</h1>
//             </div>
//
//
//
//           </div>
//           <div className="mt-4 bg-gray-100  shadow-md rounded-lg p-4">
//             <h1 className={"font-bold mb-4 text-center"}>Published Items in Topic</h1>
//             <Topic location={location} isSubscribedToTopic={isSubscribedToTopic} messages={messages} handleSubscribe={handleSubscribe}/>
//           </div>
// //         </div>
//       </div>
//     </div>
//   );
// }
//
// export default App;
