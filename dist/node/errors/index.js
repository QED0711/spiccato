"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitializationError = exports.StatePathNotExistError = exports.InvalidStateUpdateError = exports.InvalidStateSchemaError = exports.ManagerNotFoundError = exports.ReservedStateKeyError = exports.ProtectedNamespaceError = exports.ImmutableStateError = void 0;
class ImmutableStateError extends Error {
    constructor(message) {
        super(message);
        this.name = "ImmutableStateError";
    }
}
exports.ImmutableStateError = ImmutableStateError;
class ProtectedNamespaceError extends Error {
    constructor(message) {
        super(message);
        this.name = "ProtectedNamespaceError";
    }
}
exports.ProtectedNamespaceError = ProtectedNamespaceError;
class ReservedStateKeyError extends Error {
    constructor(message) {
        super(message);
        this.name = "ReservedStateKeyError";
    }
}
exports.ReservedStateKeyError = ReservedStateKeyError;
class ManagerNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "ManagerNotFoundError";
    }
}
exports.ManagerNotFoundError = ManagerNotFoundError;
class InvalidStateSchemaError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidStateSchemaError";
    }
}
exports.InvalidStateSchemaError = InvalidStateSchemaError;
class InvalidStateUpdateError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidStateUpdateError";
    }
}
exports.InvalidStateUpdateError = InvalidStateUpdateError;
class StatePathNotExistError extends Error {
    constructor(message) {
        super(message);
        this.name = "StatePathNotExistError";
    }
}
exports.StatePathNotExistError = StatePathNotExistError;
class InitializationError extends Error {
    constructor(message) {
        super(message);
        this.name = "InitializationError";
    }
}
exports.InitializationError = InitializationError;
