import {ClientSdkError} from "./ClientSdkError";

export class IllegalArgumentError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "IllegalArgumentError"
    }
}