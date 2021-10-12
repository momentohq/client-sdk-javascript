import {ClientSdkError} from "./ClientSdkError";

export class CacheAlreadyExistsError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "CacheAlreadyExistsError"
    }
}