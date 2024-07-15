/************************************* IMPORTS **************************************/
import { WindowManager, PathNode } from './utils/helpers';
import { StateObject, StateUpdateCallback, InitializationOptions, StorageOptions, managerID, StateSchema, GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, NamespacedMethods, ExtensionSchema, SpiccatoExtended } from './types/index';
export declare let WINDOW: {
    [key: string]: any;
};
export default class Spiccato<State extends StateSchema = StateSchema, Getters extends GettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Setters extends SettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Methods extends MethodsSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Extensions extends ExtensionSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}> {
    private static managers;
    private static registerManager;
    static getManagerById(id: managerID): Spiccato<StateSchema, {}, {}, {}, {}>;
    static clear(): void;
    private initOptions;
    _schema: StateSchema;
    _state: StateObject;
    private _getters;
    private _setters;
    private _methods;
    private _bindToLocalStorage;
    private _initialized;
    private _role;
    windowManager: (WindowManager | null);
    private _eventListeners;
    paths: PathNode;
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
    addCustomGetters(getters: GettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): void;
    addCustomSetters(setters: SettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): void;
    addCustomMethods(methods: MethodsSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): void;
    addNamespacedMethods(namespaces: NamespacedMethods<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): void;
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
