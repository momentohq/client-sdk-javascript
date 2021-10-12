import {grpc} from "@momento/wire-types-typescript";

grpc.InterceptingCall

export const authInterceptor = (token: string): grpc.Interceptor => {
    return (options, nextCall) => {
        return new grpc.InterceptingCall(nextCall(options), {
            start: function (metadata, listener, next) {
                metadata.add("Authorization", token)
                next(metadata, {})
            },
        })
    }
}
