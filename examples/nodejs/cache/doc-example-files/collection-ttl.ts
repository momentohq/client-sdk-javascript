import {CollectionTtl} from '@gomomento/sdk';

function example_API_CollectionTtlOf() {
  CollectionTtl.of(20 * 60); // 20 minutes
}

function example_API_CollectionTtlNew() {
  const ttlSeconds = 20 * 60; // 20 minutes
  const refreshTtl = true;
  new CollectionTtl(ttlSeconds, refreshTtl);
}

function example_API_CollectionTtlOfNoRefresh() {
  CollectionTtl.of(20 * 60).withNoRefreshTtlOnUpdates(); // 20 minutes, only when collection is created
}

function example_API_CollectionTtlNewNoRefresh() {
  const ttlSeconds = 20 * 60; // 20 minutes
  const refreshTtl = false;
  new CollectionTtl(ttlSeconds, refreshTtl);
}

function main() {
  example_API_CollectionTtlOf();
  example_API_CollectionTtlNew();
  example_API_CollectionTtlOfNoRefresh();
  example_API_CollectionTtlNewNoRefresh();
}

main();
