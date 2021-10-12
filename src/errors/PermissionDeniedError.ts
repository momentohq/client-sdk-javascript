import {ClientSdkError} from "./ClientSdkError";

export class PermissionDeniedError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "PermissionDeniedError"
    }
}