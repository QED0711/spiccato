import Spiccato from "..";
import { PathNode } from "../utils/helpers";

export interface StateObject { [key: string]: any };
export interface StateSchema { [key: string]: null | undefined | boolean | number | string | any[] | object };
export interface StateUpdateCallback {
    (state: { [key: string]: any }): void;
};
export type managerID = string;
export interface InitializationOptions {
    id: managerID,
    dynamicGetters?: boolean,
    dynamicSetters?: boolean,
    allowDynamicAccessorOverride?: boolean,
    nestedGetters?: boolean,
    nestedSetters?: boolean,
    debug?: boolean,
    enableWriteProtection?: boolean,
};
export interface StorageOptions {
    persistKey: string,
    initializeFromLocalStorage?: boolean,
    providerID?: string,
    subscriberIDs?: string[],
    clearStorageOnUnload?: boolean,
    removeChildrenOnUnload?: boolean,
    privateState?: (string | string[] | PathNode)[],
    deepSanitizeState?: boolean,
};
export interface DynamicSetterOptions {
    explicitUpdatePath?: boolean,
};
export type EventPayload = {
    path?: string | string[],
    value?: any,
    state?: StateObject
}

export type SpiccatoInstance<State, Getters, Setters, Methods> = {
    state: State,
    getters: Getters,
    setters: Setters,
    methods: Methods,
    setState: (updater: StateObject | Function, callback?: StateUpdateCallback | null, updatedPaths?: string[][] | PathNode[] | null) => Promise<StateObject>
}

export type SpiccatoExtended<Base, Extensions> = Base & Extensions;

export type GettersSchema<ThisType> = { [key: string]: (this: ThisType, ...args: any[]) => any; }
export type SettersSchema<ThisType> = { [key: string]: (this: ThisType, ...args: any[]) => any; }
export type MethodsSchema<ThisType> = { [key: string]: (this: ThisType, ...args: any[]) => any; }
export type ExtensionSchema<ThisType> = {[key: string]: any};
export type NamespacedMethods<Instance> = {
    [namespace: string]: {
        [key: string]: (this: Instance, ...args: any[]) => any
    }
}