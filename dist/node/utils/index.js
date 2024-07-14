"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNamespace = createNamespace;
function createNamespace(namespace) {
    return function (constructor) {
        return class extends constructor {
            constructor(...args) {
                super(...args);
                this["_" + namespace] = {};
            }
            get [namespace]() {
                return this["_" + namespace];
            }
        };
    };
}
