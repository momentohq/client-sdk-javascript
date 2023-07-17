import CreateCacheClient from "../src/lib/getClientFunctions";
import {ReadAsideWrapper} from "../src/read-aside-momento-mongo";

describe('WrapperTests', () => {
    it('can construct a read aside wrapper and execute a function', async () => {
        let client = await CreateCacheClient(10800); // default to 3 hours
        // init the read-aside class in read-aside-momento-mongo.ts
        const wrapper = new ReadAsideWrapper({
            client: client,
            cacheName: "movies"
        });
        // Call the getItem function in the read-aside class and pass in the key and loader function with test return value
        const ret = await wrapper.getItem("Conan the Librarian");
        console.log(JSON.stringify(ret));
    });
});
