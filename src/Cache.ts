import {cache, grpc} from '@momento/wire-types-typescript';
import {authInterceptor} from "./grpc/AuthInterceptor";
import {cacheNameInterceptor} from "./grpc/CacheNameInterceptor";
import {MomentoCacheResult, momentoResultConverter} from "./messages/Result";
import {IllegalArgumentError} from "./errors/IllegalArgumentError";
import {ClientSdkError} from "./errors/ClientSdkError";
import {errorMapper} from "./errors/GrpcErrorMapper";

type GetResponse = {
    body: string;
    message: string;
    result: MomentoCacheResult;
}

type SetResponse = {
    message: string;
    result: MomentoCacheResult;
}

export class Cache {
    private readonly client: cache.cache_client.ScsClient;
    private readonly textEncoder: TextEncoder;
    private readonly textDecoder: TextDecoder;
    private readonly interceptors: grpc.Interceptor[];
    private readonly cacheName: string;
    constructor(authToken: string, cacheName: string, endpoint: string) {
        this.client = new cache.cache_client.ScsClient(endpoint, grpc.ChannelCredentials.createSsl())
        this.textEncoder = new TextEncoder();
        this.textDecoder = new TextDecoder();
        this.cacheName = cacheName;
        this.interceptors = [authInterceptor(authToken), cacheNameInterceptor(cacheName)]
    }

    public async set(key: string, value: string, ttl: number = 1000): Promise<SetResponse> {
        this.ensureValidSetRequest(key, value, ttl)
        const encodedKey = this.textEncoder.encode(key)
        const encodedValue = this.textEncoder.encode(value)

        const request = new cache.cache_client.SetRequest({
            cache_body: encodedValue,
            cache_key: encodedKey,
            ttl_milliseconds: ttl
        })
        return new Promise((resolve, reject) => {
            this.client.Set(request, { interceptors: this.interceptors }, (err, resp) => {
                if (err) {
                    reject(errorMapper(err))
                }
                if (resp) {
                    resolve(this.parseSetResponse(resp))
                }
                reject(new ClientSdkError("unable to perform set"))
            })
        })
    }

    public async get(key: string): Promise<GetResponse> {
        this.ensureValidKey(key);
        const request = new cache.cache_client.GetRequest({
            cache_key: this.textEncoder.encode(key)
        })

        return new Promise((resolve, reject) => {
            this.client.Get(request, { interceptors: this.interceptors }, (err, resp) => {
                if (err) {
                    reject(errorMapper(err))
                }
                if (resp) {
                    resolve(this.parseGetResponse(resp))
                }
                reject(new ClientSdkError("unable to get from cache"))
            })
        })
    }

    private parseGetResponse(resp: cache.cache_client.GetResponse): GetResponse {
        return {
            result: momentoResultConverter(resp.result),
            message: resp.message,
            body: this.textDecoder.decode(resp.cache_body)
        }
    }

    private parseSetResponse(resp: cache.cache_client.SetResponse): SetResponse {
        return {
            result: momentoResultConverter(resp.result),
            message: resp.message
        }
    }

    private ensureValidKey(key: any) {
        if (!key) {
            throw new IllegalArgumentError("key must not be empty")
        }
    }

    private ensureValidSetRequest(key: any, value: any, ttl: number) {
        this.ensureValidKey(key)

        if (!value) {
            throw new IllegalArgumentError("value must not be empty")
        }

        if (ttl && ttl < 0) {
            throw new IllegalArgumentError("ttl must be a positive integer")
        }
    }
}