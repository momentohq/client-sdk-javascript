import {StoreClient} from './store-client';
import * as StoreGet from './store-get';
import {StoreValueType} from './store-value-type';

async function main() {
  const client = new StoreClient();
  const storeName = 'my-store';

  for (const key of ['string-key', 'integer-key', 'float-key', 'boolean-key', 'unknown-key']) {
    console.log(`====== Getting key: ${key} ======`);
    const getResponse = await client.get(storeName, key);
    switch (getResponse.response) {
      case StoreGet.ResponseType.Success:
        switch (getResponse.type) {
          case StoreValueType.STRING:
            console.log('The value is a string:', getResponse.value);
            break;
          case StoreValueType.INTEGER:
            console.log('The value is an integer:', getResponse.value);
            break;
          case StoreValueType.BOOLEAN:
            console.log('The value is a boolean:', getResponse.value);
            break;
        }
        console.log(`The value is: ${getResponse.value} and the type is ${getResponse.type}`);
        break;
      case StoreGet.ResponseType.Error:
        console.error('Error:', getResponse.message);
        break;
    }
  }
}

main().then().catch(console.error);
