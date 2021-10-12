import {ClientSdkError} from "./ClientSdkError";

export class InternalServerError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "InternalServerError"
    }
}