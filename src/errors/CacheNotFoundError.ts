import {ClientSdkError} from "./ClientSdkError";

export class CacheNotFoundError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "CacheNotFoundError";
    }
}