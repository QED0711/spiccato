export class ImmutableStateError extends Error {
    constructor(message: string){
        super(message);
        this.name = "ImmutableStateError";
    }
}

export class ProtectedNamespaceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProtectedNamespaceError";
    }
}

export class ReservedStateKeyError extends Error {
    constructor(message: string){
        super(message);
        this.name = "ReservedStateKeyError";
    }
}

export class ManagerNotFoundError extends Error {
    constructor(message: string){
        super(message);
        this.name = "ManagerNotFoundError";
    }
}

export class InvalidStateSchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidStateSchemaError";
    }
}

export class InvalidStateUpdateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidStateUpdateError";
    }
}

export class StatePathNotExistError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "StatePathNotExistError"
    }
}

export class InitializationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InitializationError"
    }
}