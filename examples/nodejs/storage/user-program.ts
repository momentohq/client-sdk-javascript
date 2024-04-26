import {StoreClient} from './store-client';
import * as StoreGet from './store-get';
import {StoreValueType} from './store-value-type';

async function main() {
  const client = new StoreClient();
  const storeName = 'my-store';

  for (const key of ['string-key', 'integer-key', 'float-key', 'boolean-key', 'unknown-key']) {
    console.log(`====== Getting key: ${key} ======`);
    const getResponse = await client.get(storeName, key);
    if (getResponse instanceof StoreGet.Success) {
      // developer gets back the value and doesn't care about the type or will cast themselves.
      const value = getResponse.value;

      // eg can do `const value: string = getResponse.value as string;`
      console.log(`The value is: ${value} and the type is ${getResponse.type}`);

      // To request back as a concrete type means the developer knows the type.
      // If the developer is right, they get the value. And if they are wrong,
      // we have two choices:
      // 1. return undefined, or
      // 2. throw an exception.
      //
      // Returning undefined is a silent failure. The developer may not know
      // that the value was not what they expected. They may also confuse
      // the undefind with the value not in the store.
      //
      // Throwing an exception is a loud failure. The developer will know
      // immediately they were wrong. But not all developers want to
      // handle exceptions.
      //
      // We can make it easy for the developer to exhaustively check the type
      // and handle the cases they care about as follows:
      switch (getResponse.type) {
        case StoreValueType.STRING:
          console.log('The value is a string:', getResponse.tryGetValueString());
          break;
        case StoreValueType.INTEGER:
          console.log('The value is an integer:', getResponse.tryGetValueInteger());
          break;
        case StoreValueType.FLOAT:
          console.log('The value is a float:', getResponse.tryGetValueFloat());
          break;
        case StoreValueType.BOOLEAN:
          console.log('The value is a boolean:', getResponse.tryGetValueBoolean());
          break;
        default:
          console.error('Unknown type');
      }
      // An alternative to this switch is:
      // - StoreGet.Success has a `value` field which is of type `StoreValue`
      // `StoreValue` is a base class with derived types, each with a `value` field.
      // - StoreStringValue with a string-valued `value` field,
      // - StoreIntegerValue with an integer-valued `value` field,
      // - StoreFloatValue, etc.
      // In that world the developer can use more instanceof checks:
      // if (getResponse instanceof StoreGet.Success) {
      //    const storeValue = getResponse.value;
      //    if (storeValue instanceof StoreStringValue) {
      //      console.log('The value is a string:', storeValue.value);
      //    } else if (storeValue instanceof StoreIntegerValue) {
      //      console.log('The value is an integer:', storeValue.value);
      //    } else if (storeValue instanceof StoreFloatValue) {
      //      // ...
      //    } else {
      //      console.error('Unknown type');
      //    }
      // }
      //
      // I feel this pattern makes sense in a language with first-class pattern matching, such as
      // Rust, Scala, Kotlin, etc.
      // But in JavaScript, I feel the switch is at the right level of complexity.
      // This introduces an extra level of indirection where the dev has to access the `Success`
      // value and then the `value` field of the `StoreValue` object.
    } else if (getResponse instanceof StoreGet.Error) {
      console.error('Error:', getResponse.message);
    } else {
      console.error('Unknown response type');
    }
  }

  // I know what I'm doing
  const response = await client.get(storeName, 'string-key');
  if (response instanceof StoreGet.Success) {
    console.log(`The value is: ${response.tryGetValueString()} which is the same as ${response.value as string}`);
    console.log("If I don't know what I'm doing, I can catch the exception");
    try {
      console.log(response.tryGetValueInteger());
    } catch (error: unknown) {
      console.error(error);
    }
  } else if (response instanceof StoreGet.Error) {
    console.error('Error:', response.message);
  }
}

main().then().catch(console.error);
