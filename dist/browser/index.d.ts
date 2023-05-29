/************************************* IMPORTS **************************************/
import { WindowManager, PathNode } from './utils/helpers';
import { StateObject, StateUpdateCallback, InitializationOptions, StorageOptions, managerID, StateSchema } from './types/index';
export declare let WINDOW: {
    [key: string]: any;
};
export default class Spiccato {
    private static managers;
    private static registerManager;
    static getManagerById(id: managerID): Spiccato;
    static clear(): void;
    private initOptions;
    _schema: StateSchema;
    _state: StateObject;
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
    private _initialized;
    private _role;
    windowManager: (WindowManager | null);
    private _eventListeners;
    [key: string]: any;
    constructor(stateSchema: StateSchema | undefined, options: InitializationOptions);
    get state(): StateObject;
    get id(): managerID;
    init(): void;
    private _applyState;
    private _persistToLocalStorage;
    getStateFromPath(path: string | string[]): any | undefined;
    setState(updater: StateObject | Function, callback?: StateUpdateCallback | null, updatedPaths?: string[][] | PathNode[] | null): Promise<StateObject>;
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
    addEventListener(eventType: string | string[] | PathNode, callback: Function): void;
    removeEventListener(eventType: string | string[] | PathNode, callback: Function): void;
    private emitEvent;
    private emitUpdateEventFromPath;
    /********** LOCAL STORAGE **********/
    connectToLocalStorage(storageOptions: StorageOptions): void;
    private _updateFromLocalStorage;
    private handleUnload;
}
