export interface StateObject {[key: string]: any};
export interface StateSchema {[key: string]: null | number | string | any[] | object}
export interface StateUpdateCallback {
    (state: { [key: string]: any }): void;
};
export type managerID = string;
export interface InitializationOptions {
    id: managerID,
    dynamicGetters?: boolean,
    dynamicSetters?: boolean,
    nestedGetters?: boolean,
    nestedSetters?: boolean,
    debug?: boolean,
    performanceMode?: boolean,
};
export interface StorageOptions {
    persistKey: string,
    initializeFromLocalStorage?: boolean,
    providerID?: string,
    subscriberIDs?: string[],
    clearStorageOnUnload?: boolean,
    removeChildrenOnUnload?: boolean,
    privateState?: (string | string[])[],
};
export type EventPayload = {
    path?: string | string[],
    value?: any,
    state?: StateObject
}