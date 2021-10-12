export class ClientSdkError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class CacheAlreadyExistsError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "CacheAlreadyExistsError"
    }
}

export class CacheNotFoundError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "CacheNotFoundError";
    }
}

export class InternalServerError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "InternalServerError"
    }
}

export class InvalidArgumentError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidArgumentError"
    }
}

export class PermissionDeniedError extends ClientSdkError {
    constructor(message: string) {
        super(message);
        this.name = "PermissionDeniedError"
    }
}
