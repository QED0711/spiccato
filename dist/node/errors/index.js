"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerNotFoundError = exports.ProtectedNamespaceError = exports.ImmutableStateError = void 0;
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
class ManagerNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "ManagerNotFoundError";
    }
}
exports.ManagerNotFoundError = ManagerNotFoundError;
