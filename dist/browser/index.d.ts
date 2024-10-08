/************************************* IMPORTS **************************************/
import { WindowManager, PathNode } from './utils/helpers';
import type { StateObject, StateUpdateCallback, InitializationOptions, StorageOptions, managerID, StateSchema, GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, NamespacedMethods, ExtensionSchema, SpiccatoExtended, StatePath, StatePaths, SetStateFunction, SetStateUnsafeFunction } from './types/index';
export declare let WINDOW: Record<string, any>;
export default class Spiccato<State extends StateSchema = StateSchema, Getters extends GettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Setters extends SettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Methods extends MethodsSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}, Extensions extends ExtensionSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>> = {}> {
    private static managers;
    private static registerManager;
    static getManagerById(id: managerID): Spiccato<StateSchema, {}, {}, {}, {}>;
    static get state(): Record<string, StateObject>;
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
    private _paths;
    [key: string]: any;
    constructor(stateSchema: StateSchema | undefined, options: InitializationOptions);
    get state(): State;
    get id(): managerID;
    get paths(): StatePaths<State>;
    get getters(): Getters;
    get setters(): Setters;
    get methods(): Methods;
    init(): this;
    private _applyState;
    private _persistToLocalStorage;
    getStateFromPath(path: string | string[]): any | undefined;
    setState(updater: StateObject | SetStateFunction<State>, callback?: StateUpdateCallback | null, updatedPaths?: string[][] | PathNode[] | StatePath[] | null): Promise<StateObject>;
    setStateUnsafe(updater: SetStateUnsafeFunction<State>, callback?: StateUpdateCallback | null): Promise<State>;
    addCustomGetters(getters: GettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): this;
    addCustomSetters(setters: SettersSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): this;
    addCustomMethods(methods: MethodsSchema<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>): this;
    addNamespacedMethods(namespaces: NamespacedMethods<SpiccatoExtended<SpiccatoInstance<State, Getters, Setters, Methods>, Extensions>>, tsSupport?: boolean): this;
    /********** EVENTS **********/
    addEventListener(eventType: string | string[] | PathNode | StatePath, callback: Function): this;
    removeEventListener(eventType: string | string[] | PathNode | StatePath, callback: Function): this;
    private emitEvent;
    private emitUpdateEventFromPath;
    /********** LOCAL STORAGE **********/
    connectToLocalStorage(storageOptions: StorageOptions): void;
    private _updateFromLocalStorage;
    private handleUnload;
}
