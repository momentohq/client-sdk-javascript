import {control} from '@momento/wire-types-typescript';
import jwtDecode from "jwt-decode";
import {Cache} from "./Cache";
import {authInterceptor} from "./grpc/AuthInterceptor";
import {IllegalArgumentError} from "./errors/IllegalArgumentError";
import {ClientSdkError} from "./errors/ClientSdkError";
import {Status} from "@grpc/grpc-js/build/src/constants";
import {CacheAlreadyExistsError} from "./errors/CacheAlreadyExistsError";
import {errorMapper} from "./errors/GrpcErrorMapper";
import {ChannelCredentials, Interceptor} from "@grpc/grpc-js";

type Claims = {
    cp: string,
    c: string
}

export type CreateCacheResponse = {}
export type DeleteCacheResponse = {}

export class Momento {
    private readonly client: control.control_client.ScsControlClient;
    private readonly interceptors: Interceptor[];
    private readonly controlEndpoint: string;
    private readonly cacheEndpoint: string;
    private readonly authToken: string;

    /**
     * creates an instance of Momento
     * @param {string} authToken - Momento jwt
     * @param {string=} endpointOverride - optional endpoint override to be used when given an explicit endpoint by the Momento team
     */
    constructor(authToken: string, endpointOverride?: string) {
        const claims = this.decodeJwt(authToken);
        this.authToken = authToken;
        this.interceptors = [authInterceptor(authToken)]
        this.controlEndpoint = endpointOverride ? `control.${endpointOverride}` : claims.cp;
        this.cacheEndpoint = endpointOverride ? `cache.${endpointOverride}` : claims.c;
        this.client = new control.control_client.ScsControlClient(this.controlEndpoint, ChannelCredentials.createSsl())
    }

    private decodeJwt = (jwt?: string): Claims => {
        if(!jwt) {
            throw new IllegalArgumentError("malformed auth token")
        }
        try {
            return jwtDecode<Claims>(jwt)
        } catch (e) {
            throw new ClientSdkError("failed to parse jwt")
        }

    }

    /**
     * gets a MomentoCache to perform gets and sets on
     * @param {string} name - name of cache
     * @returns Cache
     */
    public getCache(name: string): Cache {
        this.validateCachename(name);
        return new Cache(this.authToken, name, this.cacheEndpoint);
    }

    /**
     * creates a new cache in your Momento account
     * @param {string} name - cache name to create
     * @returns Promise<CreateCacheResponse>
     */
    public createCache(name: string): Promise<CreateCacheResponse> {
        this.validateCachename(name);
        const request = new control.control_client.CreateCacheRequest({ cache_name: name })
        return new Promise((resolve, reject) => {
            this.client.CreateCache(request, { interceptors: this.interceptors}, (err, resp) => {
                if (err) {
                    if (err.code === Status.ALREADY_EXISTS) {
                        reject(new CacheAlreadyExistsError(`cache with name: ${name} already exists`))
                    }
                    reject(errorMapper(err))
                }
                resolve({})
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
                    reject(errorMapper(err))
                }
                resolve({})
            })
        })
    }

    private validateCachename = (name: string) => {
        if (!name) {
            throw new IllegalArgumentError("cache name must not be null")
        }
    }
}