import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
  PreviewVectorIndexClient,
  VectorSearch,
  VectorUpsertItemBatch
} from "@gomomento/sdk";
import {ALL_VECTOR_METADATA} from "@gomomento/sdk-core";

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
        .getIndexNames()
        .join('\n')}\n\n`
    );
  } else if (result instanceof ListVectorIndexes.Error) {
    throw new Error(`An error occurred while attempting to list caches: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_DeleteIndex(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.deleteIndex('test-index')
  if (result instanceof DeleteVectorIndex.Success) {
    console.log("Index 'test-index' deleted");
  } else if (result instanceof DeleteVectorIndex.Error) {
    throw new Error(
      `An error occurred while attempting to delete index 'test-index': ${result.errorCode()}: ${result.toString()}`
    );
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

async function example_API_DeleteItemBatch(vectorClient: PreviewVectorIndexClient) {
  const result = await vectorClient.deleteItemBatch('test-index', ['example_item_1', 'example_item_2']);
  if (result instanceof VectorUpsertItemBatch.Success) {
    console.log('Successfully deleted items');
  } else if (result instanceof VectorUpsertItemBatch.Error) {
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
