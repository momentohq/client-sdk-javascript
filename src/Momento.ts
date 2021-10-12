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

export class Momento {
    private readonly client: control.control_client.ScsControlClient;
    private readonly interceptors: Interceptor[];
    private readonly controlEndpoint: string;
    private readonly cacheEndpoint: string;
    private readonly authToken: string;
    constructor(authToken: string, endpointOverride?: string) {
        const claims = Momento.decodeJwt(authToken);
        this.authToken = authToken;
        this.interceptors = [authInterceptor(authToken)]
        this.controlEndpoint = endpointOverride ? `control.${endpointOverride}` : claims.cp;
        this.cacheEndpoint = endpointOverride ? `cache.${endpointOverride}` : claims.c;
        this.client = new control.control_client.ScsControlClient(this.controlEndpoint, ChannelCredentials.createSsl())
    }

    private static decodeJwt(jwt?: string): Claims {
        if(!jwt) {
            throw new IllegalArgumentError("malformed auth token")
        }
        try {
            return jwtDecode<Claims>(jwt)
        } catch (e) {
            throw new ClientSdkError("failed to parse jwt")
        }

    }

    public getCache(name: string): Cache {
        this.validateCachename(name);
        return new Cache(this.authToken, name, this.cacheEndpoint);
    }

    public createCache(name: string): Promise<control.control_client.CreateCacheResponse> {
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
                if(resp) {
                    resolve(resp)
                }
                reject(new ClientSdkError("unable to create cache"))
            })
        })
    }

    private validateCachename(name: string) {
        if (!name) {
            throw new IllegalArgumentError("cache name must not be null")
        }
    }
}