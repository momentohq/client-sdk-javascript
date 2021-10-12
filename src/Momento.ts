import {control} from '@momento/wire-types-typescript';
import jwtDecode from "jwt-decode";
import {MomentoCache} from "./MomentoCache";
import {addHeadersInterceptor} from "./grpc/AddHeadersInterceptor";
import {
    InvalidArgumentError,
    CacheAlreadyExistsError,
    CacheNotFoundError,
    InvalidJwtError
} from "./Errors";
import {Status} from "@grpc/grpc-js/build/src/constants";
import {cacheServiceErrorMapper} from "./CacheServiceErrorMapper";
import {ChannelCredentials, Interceptor} from "@grpc/grpc-js";

interface Claims {
    /**
     * control plane endpoint
     */
    cp: string,
    /**
     * cache endpoint
     */
    c: string
}

export interface CreateCacheResponse {}
export interface DeleteCacheResponse {}

export class Momento {
    private readonly client: control.control_client.ScsControlClient;
    private readonly interceptors: Interceptor[];
    private readonly cacheEndpoint: string;
    private readonly authToken: string;

    /**
     * @param {string} authToken - Momento jwt
     * @param {string} [endpointOverride] - optional endpoint override to be used when given an explicit endpoint by the Momento team
     */
    constructor(authToken: string, endpointOverride?: string) {
        const claims = this.decodeJwt(authToken);
        this.authToken = authToken;
        const headers = [{
            name: 'Authorization',
            value: authToken
        }]
        this.interceptors = [addHeadersInterceptor(headers)]
        const controlEndpoint = endpointOverride ? `control.${endpointOverride}` : claims.cp;
        this.cacheEndpoint = endpointOverride ? `cache.${endpointOverride}` : claims.c;
        this.client = new control.control_client.ScsControlClient(controlEndpoint, ChannelCredentials.createSsl())
    }

    private decodeJwt = (jwt?: string): Claims => {
        if(!jwt) {
            throw new InvalidArgumentError("malformed auth token")
        }
        try {
            return jwtDecode<Claims>(jwt)
        } catch (e) {
            throw new InvalidJwtError('failed to parse jwt')
        }
    }

    /**
     * gets a MomentoCache to perform gets and sets on
     * @param {string} name - name of cache
     * @returns MomentoCache
     */
    public getCache(name: string): MomentoCache {
        this.validateCacheName(name);
        return new MomentoCache(this.authToken, name, this.cacheEndpoint);
    }

    /**
     * creates a new cache in your Momento account
     * @param {string} name - cache name to create
     * @returns Promise<CreateCacheResponse>
     */
    public createCache(name: string): Promise<CreateCacheResponse> {
        this.validateCacheName(name);
        const request = new control.control_client.CreateCacheRequest({ cache_name: name })
        return new Promise((resolve, reject) => {
            this.client.CreateCache(request, { interceptors: this.interceptors}, (err, resp) => {
                if (err) {
                    if (err.code === Status.ALREADY_EXISTS) {
                        reject(new CacheAlreadyExistsError(`cache with name: ${name} already exists`))
                    } else {
                        reject(cacheServiceErrorMapper(err))
                    }
                } else {
                    resolve({})
                }
            })
        })
    }

    /**
     * deletes a cache and all of the items within it
     * @param {string} name - name of cache to delete
     * @returns Promise<DeleteCacheResponse>
     */
    public deleteCache(name: string): Promise<DeleteCacheResponse> {
        const request = new control.control_client.DeleteCacheRequest({ cache_name: name })
        return new Promise<DeleteCacheResponse>((resolve, reject) => {
            this.client.DeleteCache(request, { interceptors: this.interceptors }, (err, resp) => {
                if (err) {
                    if (err.code === Status.NOT_FOUND) {
                        reject(new CacheNotFoundError(`cache with name: ${name} does not exist`))
                    } else {
                        reject(cacheServiceErrorMapper(err))
                    }
                } else {
                    resolve({})
                }
            })
        })
    }

    private validateCacheName = (name: string) => {
        if (!name) {
            throw new InvalidArgumentError("cache name must not be null")
        }
    }
}
