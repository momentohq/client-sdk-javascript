import { useEffect } from "react";
import { Help } from "../svgs/help";

type InfoModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const appUsageInfo = `
This application demonstrates how to create a write-through cache for a DynamoDB table utilizing DynamoDB Streams, AWS EventBridge, and Momento.
<br><br>
Our demo app stores Weather information for different geographic locations in a DynamoDB table. Whenever the weather
for a given location is updated, an event is sent to EventBridge by DynamoDB Streams. The EventBridge rule forwards the event
to both a Momento Topic (simulating real-time notifications) and to a Momento Cache (so that subsequent requests can read
the data directly from the cache, to reduce load on the database and improve performance).
<br><br>
In this web page, you can perform create, update, and delete operations on weather records in the DynamoDB table. EventBridge will send updates in real-time to the Momento Cache (<span class="italic">"momento-eventbridge-cache"</span>) and Topic (<span class="italic">"momento-eventbridge-topic"</span>).
<br><br>
<strong>Prerequisite:</strong> Before interacting with the application, you'll need to create a cache called <span class="italic">"momento-eventbridge-cache"</span>. If you haven't done that already, please take a moment to do it now via <a class="text-blue-500" href="https://console.gomomento.com" target="_blank" rel="noopener noreferrer">Momento Console!</a>
<br><br>
<strong>How to use the App:</strong>
<br><br>
1. <strong>Create a Weather Record:</strong> Begin by creating a weather record using the web form at the top of the page. This will create an item in the <span class="italic">weather-stats-demo</span> DynamoDB table that we created with our CDK stack. Once the item is saved to DynamoDB, this will trigger the EventBridge event, which will automatically write-through the value to the Momento cache, as well as publish a notification to the Momento topic.<br>
2. <strong>Observe the Topic notification:</strong> Notice that a message is published to the topic (the form on the bottom left of the page), mirroring the contents of the DynamoDB table. This showcases the EventBridge integration with Momento Topics.<br>
3. <strong>Retrieve the Weather Record from the Cache:</strong> Click the 'Get Item' in the form on the bottom-right of the page to fetch the item from the cache and observe that the cache reflects the same contents as the DynamoDB table. This demonstrates the EventBridge integration with Momento Cache.<br>
4. <strong>Delete a Weather Record:</strong> Use the radio button at the very top of the form to switch from "Create" to "Delete". When you delete a weather record from the DynamoDB table, you will get a delete notification on the Momento Topic, and the value will be removed from the cache.<br>
`;

const InfoModal = (props: InfoModalProps) => {
  useEffect(() => {
    if (props.isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [props.isVisible]);

  return (
    <>
      {props.isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-[96vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Welcome to DynamoDB-Momento EventBridge Demo:</h2>
            <p className="mb-4" dangerouslySetInnerHTML={{ __html: appUsageInfo }} />
            <button
              onClick={props.onClose}
              className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {!props.isVisible && (
        <div
          onClick={props.onClose}
          className="fixed bottom-4 right-4 z-50 p-4 bg-teal-500 text-white rounded-lg cursor-pointer hover:bg-teal-600 flex items-center justify-center space-x-2"
        >
          <Help />
          <span>Help</span>
        </div>
      )}
    </>
  );
};

export default InfoModal;
