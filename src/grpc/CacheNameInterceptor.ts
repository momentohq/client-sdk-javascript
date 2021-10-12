import {grpc} from "@momento/wire-types-typescript";

grpc.InterceptingCall

export const cacheNameInterceptor = (cacheName: string): grpc.Interceptor => {
    return (options, nextCall) => {
        return new grpc.InterceptingCall(nextCall(options), {
            start: function (metadata, listener, next) {
                metadata.add("cache", cacheName)
                next(metadata, {})
            },
        })
    }
}
