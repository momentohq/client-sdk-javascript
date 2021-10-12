import {InterceptingCall, Interceptor} from "@grpc/grpc-js";


export const authInterceptor = (token: string): Interceptor => {
    return (options, nextCall) => {
        return new InterceptingCall(nextCall(options), {
            start: function (metadata, listener, next) {
                metadata.add("Authorization", token)
                next(metadata, {})
            },
        })
    }
}
