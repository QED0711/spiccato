/************************************* IMPORTS **************************************/
import { WindowManager, PathNode } from './utils/helpers';
import type { StateObject, StateUpdateCallback, InitializationOptions, StorageOptions, managerID, StateSchema } from './types/index';
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
    getters: Record<string, Function>;
    setters: Record<string, Function>;
    methods: Record<string, Function>;
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
    addCustomGetters(getters: Record<string, Function>): Spiccato;
    addCustomSetters(setters: Record<string, Function>): Spiccato;
    addCustomMethods(methods: Record<string, Function>): Spiccato;
    addNamespacedMethods(namespaces: {
        [key: string]: Record<string, Function>;
    }): Spiccato;
    /********** EVENTS **********/
    addEventListener(eventType: "update" | string | string[] | PathNode, callback: Function): Spiccato;
    removeEventListener(eventType: "update" | string | string[] | PathNode, callback: Function): Spiccato;
    private emitEvent;
    private emitUpdateEventFromPath;
    /********** LOCAL STORAGE **********/
    connectToLocalStorage(storageOptions: StorageOptions): void;
    private _updateFromLocalStorage;
    private handleUnload;
}
