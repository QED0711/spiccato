/************************************* IMPORTS **************************************/
import { WindowManager } from './utils/helpers';
import { StateObject, StateUpdateCallback, InitializationOptions, StorageOptions, managerID } from './types/index';
export declare let WINDOW: {
    [key: string]: any;
};
export default class Spiccato {
    private static managers;
    private static registerManager;
    static getManagerById(id: managerID): Spiccato;
    static clear(): void;
    private initOptions;
    private _schema;
    private _state;
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
    get state(): StateObject;
    init(): void;
    private _applyState;
    private _persistToLocalStorage;
    setState(updater: StateObject | Function, callback?: StateUpdateCallback | null): Promise<StateObject>;
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
    addEventListener(eventType: string | string[], callback: Function): void;
    removeEventListener(eventType: string, callback: Function): void;
    private emitEvent;
    private emitUpdateEventFromPath;
    /********** LOCAL STORAGE **********/
    connectToLocalStorage(storageOptions: StorageOptions): void;
    private _updateFromLocalStorage;
    private handleUnload;
}
