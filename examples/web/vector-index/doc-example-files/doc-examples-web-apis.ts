async function example_API_CreateIndex(vectorClient: PreviewVectorClient) {
  const result = await vectorClient.createIndex('test-index');
  if (result instanceof CreateIndex.Success) {
    console.log("Index 'test-index' created");
  } else if (result instanceof CreateIndex.AlreadyExists) {
    console.log("Index 'test-index' already exists");
  } else if (result instanceof CreateIndex.Error) {
    throw new Error(
      `An error occurred while attempting to create index 'test-index': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

async function example_API_ListIndexes(vectorClient: PreviewVectorClient) {
  const result = await vectorClient.listIndexes();
  if (result instanceof ListIndexes.Success) {
    console.log(
      `Indexes:\n${result
        .getIndexNames()
        .join('\n')}\n\n`
    );
  } else if (result instanceof ListIndexes.Error) {
    throw new Error(`An error occurred while attempting to list caches: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_DeleteIndex(vectorClient: PreviewVectorClient) {
  const result = await vectorClient.deleteIndex("test-index")
  if (result instanceof DeleteIndex.Success) {
    console.log("Index 'test-index' deleted");
  } else if (result instanceof DeleteIndex.Error) {
    throw new Error(
      `An error occurred while attempting to delete index 'test-index': ${result.errorCode()}: ${result.toString()}`
    );
  }
}
