import { WindowManager } from './utils/helpers.js';
type managerID = string;
interface StateObject {
    [k: string]: any;
}
interface StateUpdateCallback {
    (state: {
        [key: string]: any;
    }): void;
}
interface InitializationOptions {
    id: managerID;
    dynamicGetters?: boolean;
    dynamicSetters?: boolean;
    nestedGetters?: boolean;
    nestedSetters?: boolean;
}
interface StorageOptions {
    persistKey: string;
    initializeFromLocalStorage?: boolean;
    providerID?: string;
    subscriberIDs?: string[];
    clearStorageOnUnload?: boolean;
    removeChildrenOnUnload?: boolean;
    privateState?: (string | string[])[];
}
export type EventPayload = {
    path?: string | string[];
    value?: any;
    state?: StateObject;
};
export declare let WINDOW: {
    [key: string]: any;
};
export declare class StateManager {
    private static managers;
    private static registerManager;
    static getManagerById(id: managerID): StateManager;
    static clear(): void;
    private initOptions;
    state: StateObject;
    getters: {
        [key: string]: Function;
    };
    setters: {
        [key: string]: Function;
    };
    methods: {
        [key: string]: Function;
    };
    private _bindToLocalStorage;
    windowManager: (WindowManager | null);
    private _eventListeners;
    [key: string]: any;
    constructor(state: StateObject | undefined, options: InitializationOptions);
    init(): void;
    private _applyState;
    private _persistToLocalStorage;
    setState(updater: StateObject | Function, callback?: StateUpdateCallback | null): Promise<unknown>;
    addCustomGetters(getters: {
        [key: string]: Function;
    }): void;
    addCustomSetters(setters: {
        [key: string]: Function;
    }): void;
    addCustomMethods(methods: {
        [key: string]: Function;
    }): void;
    addNamespacedMethods(namespaces: {
        [key: string]: {
            [key: string]: Function;
        };
    }): void;
    /********** EVENTS **********/
    addEventListener(eventType: string, callback: Function): void;
    removeEventListener(eventType: string, callback: Function): void;
    private emitEvent;
    connectToLocalStorage(storageOptions: StorageOptions): void;
    private _udpateFromLocalStorage;
    private handleUnload;
}
export {};
