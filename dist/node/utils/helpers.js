"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathTree = exports.PathNode = exports._localStorage = exports.WindowManager = exports.stateSchemaHasFunctions = exports.hasCircularReference = exports.getUpdatedPaths = exports.restoreState = exports.sanitizeState = exports.nestedSetterFactory = exports.getNestedRoutes = exports.formatAccessor = exports.createStateProxy = void 0;
const errors_1 = require("../errors");
const proxyHandlers = {
    set(obj, property, value) {
        throw new errors_1.ImmutableStateError("State cannot be mutated directly. Use `setState` or a dynamic setter instead.");
    },
    deleteProperty(obj, property) {
        throw new errors_1.ImmutableStateError("State properties cannot be removed after initialization.");
    }
};
const createStateProxy = (state, schema) => {
    const proxied = {};
    const traverse = (schemaVal, value, container) => {
        if (schemaVal === null ||
            schemaVal === undefined ||
            typeof value !== "object" ||
            Array.isArray(value) ||
            (typeof schemaVal === "object" && !Array.isArray(schemaVal) && !Object.keys(schemaVal).length) // checks when schema initializes an empty object
        ) {
            return value;
        }
        for (let k of Object.keys(schemaVal)) {
            container[k] = traverse(schemaVal[k], value[k], container[k] || {});
            if (typeof container[k] === "object" && container[k] !== null && !Array.isArray(container[k])) {
                container[k] = new Proxy(container[k], proxyHandlers);
            }
        }
        return container;
    };
    traverse(schema, state, proxied);
    return new Proxy(proxied, proxyHandlers);
};
exports.createStateProxy = createStateProxy;
const formatAccessor = (path, accessorType = "get") => {
    path = Array.isArray(path) ? path.join("_") : path;
    return accessorType + path[0].toUpperCase() + path.slice(1);
};
exports.formatAccessor = formatAccessor;
const getNestedRoutes = (state) => {
    const paths = [];
    const traverse = (element, currentPath = []) => {
        if (typeof element !== "object" || Array.isArray(element) || !element) {
            currentPath.length > 1 && paths.push(currentPath);
            return;
        }
        currentPath.length > 1 && paths.push(currentPath);
        for (let key of Object.keys(element)) {
            traverse(element[key], [...currentPath, key]);
        }
    };
    traverse(state);
    return paths;
};
exports.getNestedRoutes = getNestedRoutes;
const nestedSetterFactory = (state, path) => (newValue) => {
    let copy = Object.assign({}, state), currentPath = copy, key;
    for (let i = 0; i < path.length; i++) {
        key = path[i];
        if (i < path.length - 1) {
            currentPath[key] = Object.assign({}, currentPath[key]);
        }
        else {
            currentPath[key] = newValue;
        }
        currentPath = currentPath[key];
    }
    return copy;
};
exports.nestedSetterFactory = nestedSetterFactory;
const sanitizeState = (state, privatePaths) => {
    const sanitized = Object.assign({}, state);
    const removed = new Map();
    for (let path of privatePaths !== null && privatePaths !== void 0 ? privatePaths : []) {
        if (typeof Array.isArray(path)) {
            let copy = sanitized;
            for (let i = 0; i < path.length; i++) {
                // console.log(copy, path[i], "\n")
                if (i === path.length - 1) {
                    removed.set(path, copy[path[i]]);
                    delete copy[path[i]];
                    break;
                }
                copy = copy[path[i]];
            }
        }
        else if (typeof path === "string") {
            delete sanitized[path];
        }
    }
    return [sanitized, removed];
};
exports.sanitizeState = sanitizeState;
const restoreState = (state, removed) => {
    const restored = Object.assign({}, state);
    let copy;
    for (let [path, value] of removed.entries()) {
        path = Array.isArray(path) ? path : [path];
        copy = restored;
        for (let i = 0; i < path.length; i++) {
            if (i == path.length - 1) {
                copy[path[i]] = value;
            }
            else {
                copy = copy[path[i]];
            }
        }
    }
    return restored;
};
exports.restoreState = restoreState;
const getUpdatedPaths = (update, prevState, stateSchema) => {
    const paths = [];
    const traverse = (schemaVal, updatedVal, prevVal, path = [], level = 0) => {
        if (typeof updatedVal !== "object" ||
            Array.isArray(updatedVal) ||
            !updatedVal ||
            (schemaVal === null && (updatedVal !== schemaVal && updatedVal !== undefined)) // allows a null schema val and an updated val that is an object
        ) {
            if (updatedVal !== prevVal) {
                path.length > 0 && paths.push(path);
            }
            return;
        }
        if (schemaVal === null || schemaVal === undefined)
            return; // don't traverse objects not fully defined in the schema
        for (let key of Object.keys(schemaVal)) {
            if (key in updatedVal
                || (key in prevVal && level > 0)) { // only continue check if the key in question was explicitly set in the update OR it is in a nested object that has changed (this is what the `level` checks)
                traverse(schemaVal[key], ((!!updatedVal && key in updatedVal) ? updatedVal[key] : null), ((!!prevVal && key in prevVal) ? prevVal[key] : null), [...path, key], level + 1);
            }
        }
    };
    traverse(stateSchema, update, prevState);
    return paths;
};
exports.getUpdatedPaths = getUpdatedPaths;
function hasCircularReference(stateSchema) {
    try {
        JSON.stringify(stateSchema);
    }
    catch (err) {
        if (!!(err === null || err === void 0 ? void 0 : err.toString().match(/circular/gi)))
            return true;
    }
    return false;
}
exports.hasCircularReference = hasCircularReference;
function stateSchemaHasFunctions(stateSchema) {
    for (const key in stateSchema) {
        if (typeof stateSchema[key] === "function")
            return true;
        if (typeof stateSchema[key] === "object" && !Array.isArray(stateSchema[key]) && stateSchema[key] !== null) {
            if (stateSchemaHasFunctions(stateSchema[key])) {
                return true;
            }
        }
    }
    return false;
}
exports.stateSchemaHasFunctions = stateSchemaHasFunctions;
const createParamsString = (params) => {
    let str = "";
    for (let param of Object.keys(params)) {
        str += (param + "=" + params[param] + ",");
    }
    return str;
};
/* CLASSES */
class WindowManager {
    constructor(window) {
        this.subscribers = [];
        this.window = window;
    }
    open(url, name, queryParams) {
        if (this.window) {
            this.subscribers[name] = this.window.open(url, name, createParamsString(queryParams));
        }
    }
    close(name) {
        var _a;
        (_a = this.subscribers[name]) === null || _a === void 0 ? void 0 : _a.close();
        delete this.subscribers[name];
    }
    removeSubscribers() {
        for (let subscriber of Object.values(this.subscribers)) {
            subscriber.close();
        }
    }
}
exports.WindowManager = WindowManager;
class _localStorage {
    constructor() {
        this.state = {};
    }
    getItem(key) {
        return this.state[key];
    }
    setItem(key, value) {
        this.state[key] = value;
    }
    removeItem(key) {
        delete this.state[key];
    }
    clear() {
        this.state = {};
    }
}
exports._localStorage = _localStorage;
class PathNode {
    constructor(path) {
        this.__$path = path;
    }
    extendPath(prop) {
        this[prop] = new Proxy(new PathNode([...this.__$path, prop]), {
            get(target, name) {
                if (target.hasOwnProperty(name)) {
                    return target[name];
                }
                if (name in target.__proto__) { // allows access to the methods defined on the objects prototype
                    return target.__proto__[name];
                }
                throw new errors_1.StatePathNotExistError(`Path '${target.__$path.join(".")}.${name}' does not exist in the state schema`);
            }
        });
    }
}
exports.PathNode = PathNode;
class PathTree {
    constructor(obj) {
        this.root = new PathNode([]);
        this.processPaths(obj, this.root);
    }
    processPaths(obj, currentNode) {
        if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
            for (let [key, val] of Object.entries(obj)) {
                currentNode.extendPath(key);
                if (typeof val === 'object') {
                    this.processPaths(val, currentNode[key]);
                }
            }
        }
    }
}
exports.PathTree = PathTree;
