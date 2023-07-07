import {
    CacheClient,
    Configurations,
    CredentialProvider,
    ListCaches,
} from "@gomomento/sdk";

const cacheClient = new CacheClient({
    credentialProvider: CredentialProvider.fromString({
        authToken: process.env.MOMENTO_AUTH_TOKEN,
    }),
    defaultTtlSeconds: 60,
    configuration: Configurations.Laptop.v1()
})

export async function GET(request: Request) {
    const listCachesRep = await cacheClient.listCaches();
    if (listCachesRep instanceof ListCaches.Success) {
        const listOfCacheNames = listCachesRep.getCaches().map(c => c.getName());
        return new Response(JSON.stringify(listOfCacheNames))
    } else if (listCachesRep instanceof  ListCaches.Error) {
        throw new Error(listCachesRep.message())
    }
    throw new Error("Unable to list caches from momento")
}
