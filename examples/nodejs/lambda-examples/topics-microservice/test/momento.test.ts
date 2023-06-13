import { CreateTopicClient } from "../lib/libMomentoClient";
import { PublishingWrapper } from "../lib/libMomento";

describe('WrapperTests', () => {
  it('can construct a Momento Topics wrapper and execute a function', async () => {
    let client = await CreateTopicClient();

    // init the publishing wrapper class.
    const wrapper = new PublishingWrapper({
      client: client,
      cacheName: "mycache",
      topicName: "myTopic"
    });
    // Call the getItem function in the read-aside class and pass in the key and loader function with test return value.
    const ret = await wrapper.publishItem("testval");
    console.log(JSON.stringify(ret));
  });
});
