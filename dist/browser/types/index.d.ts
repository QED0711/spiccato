import { PathNode } from "../utils/helpers";
export type StateObject = Record<string, any>;
export type StateGenericValue = null | undefined | boolean | number | string | any[] | object;
export type StateSchema = Record<string, StateGenericValue>;
export interface StateUpdateCallback {
    (state: Record<string, any>): void;
}
export type managerID = string;
export interface InitializationOptions {
    id: managerID;
    dynamicGetters?: boolean;
    dynamicSetters?: boolean;
    allowDynamicAccessorOverride?: boolean;
    nestedGetters?: boolean;
    nestedSetters?: boolean;
    debug?: boolean;
    enableWriteProtection?: boolean;
}
export interface StorageOptions {
    persistKey: string;
    initializeFromLocalStorage?: boolean;
    providerID?: string;
    subscriberIDs?: string[];
    clearStorageOnUnload?: boolean;
    removeChildrenOnUnload?: boolean;
    privateState?: (string | string[] | PathNode)[];
    deepSanitizeState?: boolean;
}
export interface DynamicSetterOptions {
    explicitUpdatePath?: boolean;
}
export type EventPayload = {
    path?: string | string[];
    value?: any;
    state?: StateObject;
};
