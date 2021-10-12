import {InterceptingCall, Interceptor} from "@grpc/grpc-js";

interface Header {
    name: string,
    value: string
}

export const addHeadersInterceptor = (headers: Header[]): Interceptor => {
    return ((options, nextCall) => {
        return new InterceptingCall(nextCall(options), {
            start: (metadata, listener, next) => {
                headers.forEach((h) => metadata.add(h.name, h.value))
                next(metadata, {})
            }
        })
    })
}
