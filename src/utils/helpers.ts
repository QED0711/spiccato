import { ImmutableStateError, StatePathNotExistError } from "../errors";
import { StateObject, StateSchema } from "../types";

const proxyHandlers: { [key: string]: Function } = {
    set(obj: { [key: string]: any }, property: any, value: any): void {
        throw new ImmutableStateError("State cannot be mutated directly. Use `setState` or a dynamic setter instead.")
    },
    deleteProperty(obj: { [key: string]: any }, property: any) {
        throw new ImmutableStateError("State properties cannot be removed after initialization.")
    }
}

export const createStateProxy = (state: StateObject, schema: StateSchema): StateObject => {
    const proxied: StateObject = {};

    const traverse = (schemaVal: any, value: any, container: any) => {
        if (
            schemaVal === null ||
            schemaVal === undefined ||
            typeof value !== "object" ||
            Array.isArray(value) ||
            (typeof schemaVal === "object" && !Array.isArray(schemaVal) && !Object.keys(schemaVal).length) // checks when schema initializes an empty object
        ) {
            return value
        }

        for (let k of Object.keys(schemaVal)) {
            container[k] = traverse(schemaVal[k], value[k], container[k] || {})
            if (typeof container[k] === "object" && container[k] !== null && !Array.isArray(container[k])) {
                container[k] = new Proxy(container[k], proxyHandlers)
            }
        }
        return container
    }

    traverse(schema, state, proxied);
    return new Proxy(proxied, proxyHandlers);

}

export const formatAccessor = (path: string | string[], accessorType: string = "get") => {
    path = Array.isArray(path) ? path.join("_") : path;
    return accessorType + path[0].toUpperCase() + path.slice(1)
}

export const getNestedRoutes = (state: { [key: string]: any }) => {

    const paths: (string[])[] = [];
    const traverse = (element: any, currentPath: string[] = []) => {
        if (typeof element !== "object" || Array.isArray(element) || !element) {
            currentPath.length > 1 && paths.push(currentPath);
            return;
        }

        currentPath.length > 1 && paths.push(currentPath)
        for (let key of Object.keys(element)) {
            traverse(element[key], [...currentPath, key])
        }
    }

    traverse(state);
    return paths;
}

export const nestedSetterFactory = (state: { [key: string]: any }, path: string[]) => (newValue: any) => {
    let copy = { ...state },
        currentPath = copy,
        key;
    for (let i = 0; i < path.length; i++) {
        key = path[i];
        if (i < path.length - 1) {
            currentPath[key] = { ...currentPath[key] }
        } else {
            currentPath[key] = newValue
        }
        currentPath = currentPath[key]
    }
    return copy;
}

export const sanitizeState = (state: { [key: string]: any }, privatePaths: (string | string[])[]) => {
    const sanitized = { ...state }
    const removed = new Map()
    for (let path of privatePaths ?? []) {
        if (typeof Array.isArray(path)) {
            let copy = sanitized;
            for (let i = 0; i < path.length; i++) {
                // console.log(copy, path[i], "\n")
                if (i === path.length - 1) {
                    removed.set(path, copy[path[i]])
                    delete copy[path[i]]
                    break;
                }
                copy = copy[path[i]]
            }
        } else if (typeof path === "string") {
            delete sanitized[path];
        }
    }
    return [sanitized, removed];
}


export const restoreState = (state: { [key: string]: any }, removed: { [key: string]: any }) => {
    const restored = { ...state }
    let copy;
    for (let [path, value] of removed.entries()) {
        path = Array.isArray(path) ? path : [path]
        copy = restored;
        for (let i = 0; i < path.length; i++) {
            if (i == path.length - 1) {
                copy[path[i]] = value;
            } else {
                copy = copy[path[i]];
            }
        }
    }
    return restored
}

export const getUpdatedPaths = (update: StateObject, prevState: StateObject, stateSchema: StateObject): string[][] => {
    const paths: string[][] = [];

    const traverse = (schemaVal: any, updatedVal: any, prevVal: any, path: string[] = [], level: number = 0) => {
        if (
            typeof updatedVal !== "object" ||
            Array.isArray(updatedVal) ||
            !updatedVal ||
            (schemaVal === null && (updatedVal !== schemaVal && updatedVal !== undefined)) // allows a null schema val and an updated val that is an object
        ) {
            if (updatedVal !== prevVal) {
                path.length > 0 && paths.push(path);
            }
            return
        }

        if (schemaVal === null || schemaVal === undefined) return; // don't traverse objects not fully defined in the schema

        for (let key of Object.keys(schemaVal)) {
            if (
                key in updatedVal
                || (key in prevVal && level > 0)
            ) { // only continue check if the key in question was explicitly set in the update OR it is in a nested object that has changed (this is what the `level` checks)
                traverse(
                    schemaVal[key],
                    ((!!updatedVal && key in updatedVal) ? updatedVal[key] : null),
                    ((!!prevVal && key in prevVal) ? prevVal[key] : null),
                    [...path, key],
                    level + 1
                )
            }
        }
    }

    traverse(stateSchema, update, prevState)
    return paths;
}

export function hasCircularReference(stateSchema: StateSchema): boolean {
    try {
        JSON.stringify(stateSchema)
    } catch (err) {
        if (!!err?.toString().match(/circular/gi)) return true;
    }
    return false
}

export function stateSchemaHasFunctions(stateSchema: StateSchema): boolean {
    for (const key in stateSchema) {
        if (typeof stateSchema[key] === "function") return true;
        if (typeof stateSchema[key] === "object" && !Array.isArray(stateSchema[key]) && stateSchema[key] !== null) {
            if (stateSchemaHasFunctions(stateSchema[key] as StateSchema)) {
                return true;
            }
        }
    }
    return false;
}

const createParamsString = (params: { [key: string]: any }): string => {
    let str = ""
    for (let param of Object.keys(params)) {
        str += (param + "=" + params[param] + ",")
    }
    return str;
}


/* CLASSES */
export class WindowManager {

    /* Instance Properties */
    private subscribers: { [key: string]: any };
    window: { [key: string]: any } | null;

    constructor(window: { [key: string]: any } | null) {
        this.subscribers = [];
        this.window = window;
    }

    open(url: string, name: string, queryParams: { [key: string]: any }) {
        if (this.window) {
            this.subscribers[name] = this.window.open(url, name, createParamsString(queryParams))
        }
    }

    close(name: string) {
        this.subscribers[name]?.close();
        delete this.subscribers[name]
    }

    removeSubscribers() {
        for (let subscriber of Object.values(this.subscribers)) {
            subscriber.close()
        }
    }

}

export class _localStorage {
    private state: { [key: string]: string }
    constructor() {
        this.state = {}
    }

    getItem(key: string) {
        return this.state[key]
    }

    setItem(key: string, value: string) {
        this.state[key] = value;
    }

    removeItem(key: string) {
        delete this.state[key]
    }

    clear() {
        this.state = {};
    }
}


export class PathNode {
    public __$path: string[];
    [key: string]: any;

    constructor(path: string[]){
        this.__$path = path;
    }

    extendPath(prop: string){
        this[prop] = new Proxy(new PathNode([...this.__$path, prop]), {
            get(target: PathNode, name: string) {
                if(target.hasOwnProperty(name)) {
                    return target[name];
                }
                if (name in target.__proto__) { // allows access to the methods defined on the objects prototype
                    return target.__proto__[name];
                }
                throw new StatePathNotExistError(`Path '${target.__$path.join(".")}.${name}' does not exist in the state schema`);
            }
        })

    }
}

export class PathTree {
    public root: PathNode;

    constructor(obj: StateObject){
        this.root = new PathNode([]);
        this.processPaths(obj, this.root);
    }

    processPaths(obj: StateObject , currentNode: PathNode){
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