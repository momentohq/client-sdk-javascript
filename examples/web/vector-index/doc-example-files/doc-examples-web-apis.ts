import {
  ALL_VECTOR_METADATA,
  Configurations,
  CreateVectorIndex,
  CredentialProvider,
  DeleteVectorIndex,
  ListVectorIndexes,
  PreviewVectorIndexClient,
  VectorCountItems,
  VectorDeleteItemBatch,
  VectorFilterExpressions as F,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorUpsertItemBatch,
} from '@gomomento/sdk-web';
import {initJSDom} from '../utils/jsdom';

async function example_API_CreateIndex(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.createIndex('test-index', 2);
  if (result instanceof CreateVectorIndex.Success) {
    console.log("Index 'test-index' created");
  } else if (result instanceof CreateVectorIndex.AlreadyExists) {
    console.log("Index 'test-index' already exists");
  } else if (result instanceof CreateVectorIndex.Error) {
    throw new Error(
      `An error occurred while attempting to create index 'test-index': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListIndexes(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.listIndexes();
  if (result instanceof ListVectorIndexes.Success) {
    console.log(
      `Indexes:\n${result
        .getIndexes()
        .map(index => index.toString())
        .join('\n')}\n\n`
    );
  } else if (result instanceof ListVectorIndexes.Error) {
    throw new Error(`An error occurred while attempting to list caches: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_DeleteIndex(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.deleteIndex('test-index');
  if (result instanceof DeleteVectorIndex.Success) {
    console.log("Index 'test-index' deleted");
  } else if (result instanceof DeleteVectorIndex.Error) {
    throw new Error(
      `An error occurred while attempting to delete index 'test-index': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_CountItems(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.countItems('test-index');
  if (result instanceof VectorCountItems.Success) {
    console.log(`Found ${result.itemCount()} items`);
  } else if (result instanceof VectorCountItems.Error) {
    throw new Error(`An error occurred while counting items in index: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_UpsertItemBatch(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.upsertItemBatch('test-index', [
    {
      id: 'example_item_1',
      vector: [1.0, 2.0],
      metadata: {key1: 'value1'},
    },
    {
      id: 'example_item_2',
      vector: [3.0, 4.0],
      metadata: {key2: 'value2'},
    },
  ]);
  if (result instanceof VectorUpsertItemBatch.Success) {
    console.log('Successfully added items');
  } else if (result instanceof VectorUpsertItemBatch.Error) {
    throw new Error(`An error occurred while adding items to index: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_GetItemBatch(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.getItemBatch('test-index', ['example_item_1', 'example_item_2']);
  if (result instanceof VectorGetItemBatch.Success) {
    console.log(`Found ${Object.keys(result.values()).length} items`);
  } else if (result instanceof VectorGetItemBatch.Error) {
    throw new Error(`An error occurred while retrieving items from index: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_GetItemMetadataBatch(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.getItemMetadataBatch('test-index', ['example_item_1', 'example_item_2']);
  if (result instanceof VectorGetItemMetadataBatch.Success) {
    console.log(`Found metadata for ${Object.keys(result.values()).length} items`);
  } else if (result instanceof VectorGetItemMetadataBatch.Error) {
    throw new Error(
      `An error occurred while retrieving item metadata from index: ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_DeleteItemBatch(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.deleteItemBatch('test-index', ['example_item_1', 'example_item_2']);
  if (result instanceof VectorDeleteItemBatch.Success) {
    console.log('Successfully deleted items');
  } else if (result instanceof VectorDeleteItemBatch.Error) {
    throw new Error(`An error occurred while deleting items: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_Search(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.search('test-index', [1.0, 2.0], {topK: 3, metadataFields: ALL_VECTOR_METADATA});
  if (result instanceof VectorSearch.Success) {
    console.log(`Found ${result.hits().length} matches`);
  } else if (result instanceof VectorSearch.Error) {
    throw new Error(`An error occurred searching index test-index: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_SearchAndFetchVectors(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.searchAndFetchVectors('test-index', [1.0, 2.0], {
    topK: 3,
    metadataFields: ALL_VECTOR_METADATA,
  });
  if (result instanceof VectorSearchAndFetchVectors.Success) {
    console.log(`Found ${result.hits().length} matches`);
  } else if (result instanceof VectorSearchAndFetchVectors.Error) {
    throw new Error(`An error occurred searching index test-index: ${result.errorCode()}: ${result.toString()}`);
  }
}

function example_API_FilterExpressionOverview() {
  /*
   * For convenience, the filter expressions can be imported as follows:
   * import { VectorFilterExpressions as F } from '@gomomento/sdk';
   *
   * To demonstrate the various filter expressions, suppose we have a
   * dataset of movies with the following schema:
   * {
   *  movie_title: string,
   *  year: int,
   *  gross_revenue_millions: float,
   *  in_theaters: bool,
   *  actors: list<string>,
   *  directors: list<string>,
   * }
   */

  // Is the movie titled "The Matrix"?
  F.equals('movie_title', 'The Matrix');

  // Is the movie not titled "The Matrix"?
  F.not(F.equals('movie_title', 'The Matrix'));

  // Was the movie released in 1999?
  F.equals('year', 1999);

  // Did the movie gross 463.5 million dollars?
  F.equals('gross_revenue_millions', 463.5);

  // Was the movie in theaters?
  F.equals('in_theaters', true);

  // Was the movie released after 1990?
  F.greaterThan('year', 1990);

  // Was the movie released in or after 2020?
  F.greaterThanOrEqual('year', 2020);

  // Was the movie released before 2000?
  F.lessThan('year', 2000);

  // Was the movie released in or before 2000?
  F.lessThanOrEqual('year', 2000);

  // Was "Keanu Reeves" one of the actors?
  F.listContains('actors', 'Keanu Reeves');

  // Is the ID one of the following?
  F.idInSet(['tt0133093', 'tt0234215', 'tt0242653']);

  // Was the movie directed by "Lana Wachowski" and released after 2000?
  F.and(F.listContains('directors', 'Lana Wachowski'), F.greaterThan('year', 2000));

  // Was the movie directed by "Lana Wachowski" or released after 2000?
  F.or(F.listContains('directors', 'Lana Wachowski'), F.greaterThan('year', 2000));

  // Was "Keanu Reeves" not one of the actors?
  F.not(F.listContains('actors', 'Keanu Reeves'));
}

async function main() {
  // Because the Momento Web SDK is intended for use in a browser, we use the JSDom library to set up an environment
  // that will allow us to use it in a node.js program.
  initJSDom();
  const vectorClient = new PreviewVectorIndexClient({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({environmentVariableName: 'MOMENTO_API_KEY'}),
  });
  await example_API_CreateIndex(vectorClient);
  await example_API_ListIndexes(vectorClient);
  await example_API_CountItems(vectorClient);
  await example_API_UpsertItemBatch(vectorClient);
  await example_API_Search(vectorClient);
  await example_API_SearchAndFetchVectors(vectorClient);
  await example_API_GetItemBatch(vectorClient);
  await example_API_GetItemMetadataBatch(vectorClient);
  example_API_FilterExpressionOverview();
  await example_API_DeleteItemBatch(vectorClient);
  await example_API_DeleteIndex(vectorClient);
}

main().catch(e => {
  throw e;
});
