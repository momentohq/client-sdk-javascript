import { useEffect } from "react";
import { Help } from "../svgs/help";

type InfoModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const appUsageInfo = `
<strong>Application Overview:</strong><br>
The application showcases a write-through cache pattern implementation for DynamoDB utilizing DynamoDB Streams, AWS EventBridge, and Momento. It enables users to perform create, update, and delete operations on items within a DynamoDB table, with real-time reflection of changes in the cache (<span class="italic">"momento-eventbridge-cache"</span>) and topic (<span class="italic">"momento-eventbridge-topic"</span>).<br><br>

<strong>How to Use the App:</strong><br><br>
<strong>Prerequisites:</strong><br>
Before interacting with the application, ensure the existence of the cache <span class="italic">"momento-eventbridge-cache"</span>. If the cache does not exist, it can be created via <a class="text-blue-500" href="https://console.gomomento.com" target="_blank" rel="noopener noreferrer">Momento Console</a>.<br><br>

<strong>Getting Started:</strong><br>
1. <strong>Create Weather Record:</strong> Begin by creating a weather record within the DynamoDB table. The application does not enforce any constraints on the values entered, allowing users to input any desired data.<br>
2. <strong>Retrieve Cache Item:</strong> After submitting the weather record, observe that the cache reflects the same contents as the DynamoDB table. This demonstrates the real-time synchronization between the two data sources.<br>
3. <strong>Publish to Topic:</strong> Additionally, notice that a message is published to the topic, mirroring the contents of the DynamoDB table. This showcases the propagation of changes across subscribed topic.<br>
4. <strong>Delete Record:</strong> Proceed to delete the previously created record from the DynamoDB table.<br>
5. <strong>Check Cache:</strong> Upon attempting to retrieve the item from the cache post-deletion, expect a cache miss indication. This confirms the absence of the deleted item in the cache.<br><br>
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
            <h2 className="text-2xl font-bold mb-4">Welcome to Weather Statistics Demo</h2>
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
