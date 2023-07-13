import { CacheClient } from '@gomomento/sdk';
interface WrapperArgs {
    client: CacheClient;
    cacheName: string;
}
export declare class ReadAsideWrapper {
    client: CacheClient;
    cacheName: string;
    constructor({ client, cacheName }: WrapperArgs);
    getItem(keyToGet: string): Promise<string>;
    MongoDBHandler(itemToGet: string, dbName: string): Promise<string>;
}
export {};
