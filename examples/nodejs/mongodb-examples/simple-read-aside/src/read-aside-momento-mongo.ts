import {CacheClient, CacheGet, CacheSet} from '@gomomento/sdk';
import { MongoClient } from "mongodb";

interface WrapperArgs {
    client: CacheClient,
    cacheName: string
}

export class ReadAsideWrapper {
    client: CacheClient
    cacheName: string

    constructor({client, cacheName}: WrapperArgs) {
        this.client = client
        this.cacheName = cacheName
    }

    public async getItem(keyToGet: string): Promise<string> {
        const getResponse = await this.client.get(this.cacheName, keyToGet);
        if (getResponse instanceof CacheGet.Hit) {
            return getResponse.valueString();
        } else if (getResponse instanceof CacheGet.Miss) {
            console.log(`Cache MISS. Fetching data from DB instead. key=${keyToGet}`)
        } else if (getResponse instanceof CacheGet.Error) {
            console.error(`Error fetching from Cache. Falling back to DB. key=${keyToGet} err=${getResponse.message()}`);
            // We are not throwing an error here as we are going to attempt next to get the item from MongoDB.
        }

        const resp = await this.MongoDBHandler(keyToGet, this.cacheName);
        // if the handler comes back with other than null, try to insert into a Momento cache. If null, error.
        if (resp !== 'null') {
            const setRsp = await this.client.set(this.cacheName, keyToGet, resp);
            // If the value is inserted into the Momento Cache, return success.
            if (setRsp instanceof CacheSet.Success) {
                console.log(`Retrieved data from MongoDB and inserted into Momento. key=${keyToGet}`);
            } else if (setRsp instanceof CacheSet.Error) {
                console.error(`Retrieved data from MongoDB but failed to insert into Momento. key=${keyToGet} err=${setRsp.message()}`);
                return resp;
            }
        } else {
            const err: string = "Item not in Momento cache or MongoDB";
            console.error(err);
            throw err;
        }
        return resp;
    }

    // Handler to query MongoDB.
    public async MongoDBHandler(itemToGet: string, dbName: string): Promise<string>{
        // Set URL to hit local MongoDB install
        const uri: string = "mongodb://localhost:27017";

        // Connect to MongoDB. You probably want some more error handling here in case you cannot connect.
        const client = new MongoClient(uri);

        try {
            //
            const database = client.db(dbName);
            console.log("trying to get: " + itemToGet);

            const query = { title: itemToGet };

            // Connect to the films collection
            const movies = database.collection("films");
            // Do a findOne with the title.
            const movie = await movies.findOne(query);
            return JSON.stringify(movie);
        } finally {
            await client.close();
        }
    }

}



