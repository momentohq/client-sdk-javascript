import { useEffect } from "react";
import { Help } from "../svgs/help";

type InfoModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const appUsageInfo = `
This application showcases a write-through cache pattern implementation for DynamoDB utilizing DynamoDB Streams, AWS EventBridge, and Momento. You can perform create, update, and delete operations on items within DynamoDB table, and EventBridge will send updates in real-time to the Momento cache (<span class="italic">"momento-eventbridge-cache"</span>) and topic (<span class="italic">"momento-eventbridge-topic"</span>).<br><br>

<strong>How to Use the App:</strong><br><br>
<strong>Prerequisites:</strong><br>
Before interacting with the application, you'll need to create a cache called <span class="italic">"momento-eventbridge-cache"</span>. If you haven't done that already, please take a moment to do it now via <a class="text-blue-500" href="https://console.gomomento.com" target="_blank" rel="noopener noreferrer">Momento Console!</a><br><br>

<strong>Getting Started:</strong><br>
1. <strong>Create Weather Record:</strong> Begin by creating a weather record within the DynamoDB table using the web form to create an item in the <span class="italic">weather-stats-demo</span> DynamoDB table that we created with our CDK stack. Once the item is saved to DynamoDB, this will trigger the EventBridge event, which will automatically write-through the value to the Momento cache, as well as publish a notification to the Momento topic. The application does not enforce any constraints on the values entered, allowing users to input any desired data.<br>
2. <strong>Retrieve Cache Item:</strong> After submitting the weather record, click the 'Retrieve' button to fetch the item from the cache and observe that the cache reflects the same contents as the DynamoDB table. This demonstrates the EventBridge integration with Momento Cache.<br>
3. <strong>Publish to Topic:</strong> Notice that a message is published to the topic, mirroring the contents of the DynamoDB table. This showcases the EventBridge integration with Momento Topics<br>
4. <strong>Delete Record:</strong> Click the delete button to delete the previously created record from the DynamoDB table.<br>
5. <strong>Check Cache:</strong> Click the 'Retrieve' button again and observe that the item has been removed from both DynamoDB and the Momento Cache.<br><br>
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
