import {
  // CacheGet,
  // CreateCache,
  // CacheSet,
  // CacheClient,
  Configurations,
  CredentialProvider,
  PreviewStorageClient,
  StorageGetResponse,
} from '@gomomento/sdk';
import {DynamoDBClient, GetItemCommand, PutItemCommand} from '@aws-sdk/client-dynamodb';
import {TextEncoder} from 'util';

async function main() {
  // const momento = await CacheClient.create({
  //   configuration: Configurations.Laptop.v1(),
  //   credentialProvider: CredentialProvider.fromEnvironmentVariable({
  //     environmentVariableName: 'MOMENTO_API_KEY',
  //   }),
  //   defaultTtlSeconds: 60,
  // });
  //
  // const createCacheResponse = await momento.createCache('cache');
  // if (createCacheResponse instanceof CreateCache.AlreadyExists) {
  //   console.log('cache already exists');
  // } else if (createCacheResponse instanceof CreateCache.Error) {
  //   throw createCacheResponse.innerException();
  // }
  //
  // console.log('Storing key=foo, value=FOO');
  // const setResponse = await momento.set('cache', 'foo', 'FOO');
  // if (setResponse instanceof CacheSet.Success) {
  //   console.log('Key stored successfully!');
  // } else {
  //   console.log(`Error setting key: ${setResponse.toString()}`);
  // }
  //
  // const getResponse = await momento.get('cache', 'foo');
  // if (getResponse instanceof CacheGet.Hit) {
  //   console.log(`cache hit: ${getResponse.valueString()}`);
  // } else if (getResponse instanceof CacheGet.Miss) {
  //   console.log('cache miss');
  // } else if (getResponse instanceof CacheGet.Error) {
  //   console.log(`Error: ${getResponse.message()}`);
  // }

  const textEncoder = new TextEncoder();
  const bytes = textEncoder.encode('hello world');
  const ddbClient = new DynamoDBClient({region: 'us-west-2'});
  const ddbTable = 'DELETEME-ddbtest';
  const putItemResponse = await ddbClient.send(
    new PutItemCommand({
      TableName: ddbTable,
      Item: {
        id: {S: '1'},
        number: {N: '42'},
        bytes: {B: bytes},
      },
    })
  );
  console.log(`PutItemResponse: ${JSON.stringify(putItemResponse)}`);

  const getItemResponse = await ddbClient.send(
    new GetItemCommand({
      TableName: ddbTable,
      Key: {
        id: {S: '1'},
      },
    })
  );

  console.log(`GetItemResponse: ${JSON.stringify(getItemResponse)}`);
  const numValue = getItemResponse.Item?.number?.N;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Number value: ${numValue}`);
  const numAsBytes = getItemResponse.Item?.number?.B;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Number as bytes: ${numAsBytes}`);

  const storageClient = new PreviewStorageClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });

  const storeName = 'store';
  const putResponse = await storageClient.putInt(storeName, 'numberKey', 42);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`PutResponse: ${putResponse}`);
  const getResponse = await storageClient.get(storeName, 'numberKey');
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`GetResponse: ${getResponse}`);
  const numberVal = getResponse.value();
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Number value: ${numberVal}`);
  console.log(`Type of number value: ${typeof numberVal}`);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  console.log(`YOLO happy path number value: ${getResponse.value()!.int()!}`);

  const numberNumberVal: number = (function () {
    console.log(`Get response type is: ${getResponse.type}`);
    switch (getResponse.type) {
      case StorageGetResponse.Success: {
        console.log('get response is a StorageGetResponse.Success');
        return getResponse.value()!.int()!;
      }
      case StorageGetResponse.Error: {
        throw new Error('Not implemented yet: StorageGetResponse.Error case');
      }
    }
  })();

  console.log(`Number number value: ${numberNumberVal}`);

  const notFoundGetResponse = await storageClient.get(storeName, 'notFoundKey');
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`NotFoundGetResponse: ${notFoundGetResponse}`);
  const notFoundNumber = notFoundGetResponse.value();
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`NotFoundNumber: ${notFoundNumber}`);
  switch (notFoundGetResponse.type) {
    case StorageGetResponse.Success: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`not found get response is a StorageGetResponse.Success; value is: ${notFoundGetResponse.value()}`);
      break;
    }
    case StorageGetResponse.Error: {
      throw new Error('Not implemented yet: StorageGetResponse.Error case');
    }
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
