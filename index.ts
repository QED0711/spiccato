import { formatAccessor, getNestedRoutes, nestedSetterFactory, sanitizeState } from './utils/helpers.js'
/* TYPES */
type managerID = string;


interface StateObject {
    [k: string]: any
}

interface StateUpdateCallback {
    (state: { [key: string]: any }): void;
}

export type EventPayload = {
    path?: string | string[],
    value?: any,
    state?: StateObject
}

interface InitializationOptions {
    id: managerID,
    dynamicGetters?: boolean,
    dynamicSetters?: boolean,
    nestedGetters?: boolean,
    nestedSetters?: boolean,
    persist?: boolean,
    windowID?: string,
    subscriberIDs?: string[],
    clearOnWindowUnload?: boolean,
    privateState?: (string | string[])[], 
}

const DEFAULT_INIT_OPTIONS: InitializationOptions = {
    id: "",
    dynamicGetters: true,
    dynamicSetters: true,
    nestedGetters: true,
    nestedSetters: true,
    persist: false,
    clearOnWindowUnload: true, 
    privateState: [],
}

export class StateManager {
    /* Class Properties */
    private static managers: { [key: string]: StateManager } = {};

    private static registerManager(instance: StateManager) {
        if (instance.initOptions.id in this.managers) {
            console.warn(`State Manager with id: '${instance.initOptions.id}' already exists. It has been overwritten`)
        }
        this.managers[instance.initOptions.id] = instance;
    }

    static getManagerById(id: managerID) {
        return this.managers[id];
    }

    /* Instance Properties */
    private initOptions: InitializationOptions;
    state: StateObject;
    getters: { [key: string]: Function };
    setters: { [key: string]: Function };
    methods: { [key: string]: Function };
    private _eventListeners: { [key: string]: Function[] }
    [key: string]: any; /* for runtime added properties */

    constructor(state: StateObject = {}, options: InitializationOptions) {
        this.initOptions = { ...DEFAULT_INIT_OPTIONS, ...options };
        this.state = state;

        this.getters = {}
        this.setters = {}
        this.methods = {}

        this._applyState();
        this._eventListeners = {};

        (this.constructor as typeof StateManager).registerManager(this)
    }

    private _applyState() {
        for (let k in this.state) {
            if (this.initOptions.dynamicGetters) {
                this.getters[formatAccessor(k, "get")] = () => {
                    return this.state[k];
                }
            }

            if (this.initOptions.dynamicSetters) {
                this.setters[formatAccessor(k, "set")] = (v: any, callback: StateUpdateCallback | null) => {
                    return new Promise(async resolve => {
                        resolve(await this.setState({ [k]: v }, callback));
                        this.emitEvent("on_" + k + "_update", { path: k, value: v })
                    })
                }
            }
        }

        // nested interactions
        const createNestedGetters = this.initOptions.dynamicGetters && this.initOptions.nestedGetters;
        const createNestedSetters = this.initOptions.dynamicSetters && this.initOptions.nestedSetters;
        if (createNestedGetters || createNestedSetters) {
            const nestedPaths: (string[])[] = getNestedRoutes(this.state);
            for (let path of nestedPaths) {

                if (createNestedGetters) {
                    this.getters[formatAccessor(path, "get")] = () => {
                        let value = this.state[path[0]];
                        for (let i = 1; i < path.length; i++) {
                            value = value[path[i]];
                        }
                        return value;
                    }
                }

                if (createNestedSetters) {
                    this.setters[formatAccessor(path, "set")] = (v: any, callback: StateUpdateCallback | null) => {
                        const updatedState = nestedSetterFactory(this.state, path)(v);
                        return new Promise(async resolve => {
                            resolve(await this.setState(updatedState, callback));
                            this.emitEvent("on_" + path.join("_") + "_update", { path, value: v })
                        })
                    }
                }
            }
        }
    }

    persistToLocalStorage(state: StateObject){
        if(this.initOptions.persist && !!this.initOptions.windowID){
            const sanitized = sanitizeState(state, this.initOptions.privateState || []) 
            this.localStorage.setItem(this.initOptions.windowID, JSON.stringify(sanitized))
        }
    }

    setState(updater: StateObject | Function, callback: StateUpdateCallback | null = null) {
        return new Promise(resolve => {
            if (typeof updater === 'object') {
                this.state = { ...this.state, ...updater };
            } else if (typeof updater === 'function') {
                this.state = { ...this.state, ...updater({ ...this.state }) };
            }
            const updated = { ...this.state }
            resolve(updated);
            callback?.(updated);
            this.emitEvent("update", { state: updated })
            if(this.initOptions.persist && this.initOptions.windowID){
                window.localStorage.setItem(this.initOptions.windowID, JSON.stringify(this.state))
            }
        })
    }

    addCustomGetters(getters: { [key: string]: Function }) {
        for (let [key, callback] of Object.entries(getters)) {
            getters[key] = callback.bind(this);
        }
        this.getters = { ...this.getters, ...getters }
    }

    addCustomSetters(setters: { [key: string]: Function }) {
        for (let [key, callback] of Object.entries(setters)) {
            setters[key] = callback.bind(this);
        }
        this.setters = { ...this.setters, ...setters };
    }

    addCustomMethods(methods: { [key: string]: Function }) {
        for (let [key, callback] of Object.entries(methods)) {
            methods[key] = callback.bind(this);
        }
        this.methods = { ...this.methods, ...methods };
    }

    addNamespacedMethods(namespaces: { [key: string]: { [key: string]: Function } }) {
        for (let ns in namespaces) {
            this[ns] = {}
            for (let [key, callback] of Object.entries(namespaces[ns])) {
                this[ns][key] = callback.bind(this);
            }
        }
    }

    addEventListener(eventType: string, callback: Function) {
        if (eventType in this._eventListeners) {
            this._eventListeners[eventType].push(callback);
        } else {
            this._eventListeners[eventType] = [callback];
        }
    }

    removeEventListener(eventType: string, callback: Function) {
        this._eventListeners[eventType] = this._eventListeners[eventType]?.filter(cb => cb !== callback);
    }

    private emitEvent(eventType: string, payload: EventPayload) {
        this._eventListeners[eventType]?.forEach(callback => {
            callback(payload);
        })
    }


}


