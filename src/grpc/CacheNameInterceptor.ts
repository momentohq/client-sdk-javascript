import {InterceptingCall, Interceptor} from "@grpc/grpc-js";

export const cacheNameInterceptor = (cacheName: string): Interceptor => {
    return (options, nextCall) => {
        return new InterceptingCall(nextCall(options), {
            start: function (metadata, listener, next) {
                metadata.add("cache", cacheName)
                next(metadata, {})
            },
        })
    }
}
