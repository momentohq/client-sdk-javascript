import {cache} from '@momento/wire-types-typescript';
import {authInterceptor} from "./grpc/AuthInterceptor";
import {cacheNameInterceptor} from "./grpc/CacheNameInterceptor";
import {momentoResultConverter} from "./messages/Result";
import {InvalidArgumentError, ClientSdkError} from "./Errors";
import {errorMapper} from "./GrpcErrorMapper";
import {ChannelCredentials, Interceptor} from "@grpc/grpc-js";
import {GetResponse} from "./messages/GetResponse";
import {SetResponse} from "./messages/SetResponse";

const DEFAULT_TTL = 100

export class MomentoCache {
    private readonly client: cache.cache_client.ScsClient;
    private readonly textEncoder: TextEncoder;
    private readonly interceptors: Interceptor[];
    private readonly cacheName: string;

    /**
     *
     * @param {string} authToken
     * @param {string} cacheName
     * @param {string} endpoint
     */
    constructor(authToken: string, cacheName: string, endpoint: string) {
        this.client = new cache.cache_client.ScsClient(endpoint, ChannelCredentials.createSsl());
        this.textEncoder = new TextEncoder();
        this.cacheName = cacheName;
        this.interceptors = [authInterceptor(authToken), cacheNameInterceptor(cacheName)]
    }

    /**
     * @param {string} key - utf-8 string key
     * @param {string} value - utf-8 string to store in the cache
     * @param {number} [ttl=100] - time to live in cache, in seconds
     * @returns Promise<SetResponse>
     */
    public set(key: string, value: string, ttl: number = DEFAULT_TTL): Promise<SetResponse> {
        this.ensureValidSetRequest(key, value, ttl)
        const encodedKey = this.textEncoder.encode(key)
        const encodedValue = this.textEncoder.encode(value)

        return this.sendSet(encodedKey, encodedValue, ttl)
    }

    /**
     * @param {Uint8Array} key - the cache key
     * @param {Uint8Array} value - the value to store in the cache
     * @param {number} [ttl=100] - time to live in cache, in seconds
     * @returns Promise<SetResponse>
     */
    public setBytes(key: Uint8Array, value: Uint8Array, ttl: number = DEFAULT_TTL): Promise<SetResponse> {
        this.ensureValidSetRequest(key, value, ttl)
        return this.sendSet(key, value, ttl);
    }

    private sendSet(key: Uint8Array, value: Uint8Array, ttl: number): Promise<SetResponse> {
        const request = new cache.cache_client.SetRequest({
            cache_body: value,
            cache_key: key,
            ttl_milliseconds: ttl * 1000
        })
        return new Promise((resolve, reject) => {
            this.client.Set(request, { interceptors: this.interceptors }, (err, resp) => {
                if (err) {
                    reject(errorMapper(err))
                } else if (resp) {
                    resolve(this.parseSetResponse(resp))
                } else {
                    reject(new ClientSdkError("unable to perform set"))
                }
            })
        })
    }

    /**
     * @param {string} key - utf-8 string key
     * @returns Promise<GetResponse>
     */
    public get(key: string): Promise<GetResponse> {
        this.ensureValidKey(key);
        return this.sendGet(this.textEncoder.encode(key));
    }

    /**
     * @param {Uint8Array} key
     * @returns Promise<GetResponse>
     */
    public getBytes(key: Uint8Array): Promise<GetResponse> {
        this.ensureValidKey(key);
        return this.sendGet(key);
    }

    private sendGet(key: Uint8Array): Promise<GetResponse> {
        const request = new cache.cache_client.GetRequest({
            cache_key: key
        })

        return new Promise((resolve, reject) => {
            this.client.Get(request, {interceptors: this.interceptors}, (err, resp) => {
                if (err) {
                    reject(errorMapper(err))
                } else if (resp) {
                    resolve(this.parseGetResponse(resp))
                } else {
                    reject(new ClientSdkError("unable to get from cache"))
                }
            })
        })
    }

    private parseGetResponse = (resp: cache.cache_client.GetResponse): GetResponse => {
        const momentoResult = momentoResultConverter(resp.result);
        return new GetResponse(momentoResult, resp.message, resp.cache_body)
    }

    private parseSetResponse = (resp: cache.cache_client.SetResponse): SetResponse => {
        const momentoResult = momentoResultConverter(resp.result)
        return new SetResponse(momentoResult, resp.message);
    }

    private ensureValidKey = (key: any) => {
        if (!key) {
            throw new InvalidArgumentError("key must not be empty")
        }
    }

    private ensureValidSetRequest(key: any, value: any, ttl: number) {
        this.ensureValidKey(key)

        if (!value) {
            throw new InvalidArgumentError("value must not be empty")
        }

        if (ttl && ttl < 0) {
            throw new InvalidArgumentError("ttl must be a positive integer")
        }
    }
}
