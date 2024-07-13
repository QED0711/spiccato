/************************************* IMPORTS **************************************/
import { WindowManager, PathNode } from './utils/helpers';
import { StateObject, StateUpdateCallback, InitializationOptions, StorageOptions, managerID, StateSchema, GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, NamespacedMethods } from './types/index';
export declare let WINDOW: {
    [key: string]: any;
};
export default class Spiccato<State extends StateSchema = StateSchema, Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>> = {}, Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>> = {}, Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>> = {}> {
    private static managers;
    private static registerManager;
    static getManagerById(id: managerID): Spiccato<StateSchema, {}, {}, {}>;
    static clear(): void;
    private initOptions;
    _schema: StateSchema;
    _state: StateObject;
    _getters: {
        [key: string]: Function;
    };
    _setters: {
        [key: string]: Function;
    };
    _methods: {
        [key: string]: Function;
    };
    private _bindToLocalStorage;
    private _initialized;
    private _role;
    windowManager: (WindowManager | null);
    private _eventListeners;
    [key: string]: any;
    constructor(stateSchema: StateSchema | undefined, options: InitializationOptions);
    get state(): State;
    get id(): managerID;
    get getters(): Getters;
    get setters(): Setters;
    get methods(): Methods;
    init(): void;
    private _applyState;
    private _persistToLocalStorage;
    getStateFromPath(path: string | string[]): any | undefined;
    setState(updater: StateObject | Function, callback?: StateUpdateCallback | null, updatedPaths?: string[][] | PathNode[] | null): Promise<StateObject>;
    addCustomGetters(getters: {
        [key: string]: Function;
    }): void;
    addCustomSetters(setters: SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>): void;
    addCustomMethods(methods: {
        [key: string]: Function;
    }): void;
    addNamespacedMethods(namespaces: NamespacedMethods<SpiccatoInstance<State, Getters, Setters, Methods>>): void;
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
