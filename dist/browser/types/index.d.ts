import { PathNode, WindowManager } from "../utils/helpers";
export interface StateObject {
    [key: string]: any;
}
export interface StateSchema {
    [key: string]: null | undefined | boolean | number | string | any[] | object;
}
export interface StateUpdateCallback {
    (state: {
        [key: string]: any;
    }): void;
}
export type StatePath = {
    __$path: string[];
    extendPath: any;
};
export type StatePaths<T> = {
    __$path: string[];
    extendPath: any;
} & {
    [K in keyof T]: T[K] extends StateSchema ? StatePaths<T[K]> : StatePath;
};
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
    privateState?: (string | string[] | PathNode | StatePath)[];
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
export type SpiccatoInstance<State, Getters, Setters, Methods> = {
    state: State;
    getters: Getters;
    setters: Setters;
    methods: Methods;
    setState: (updater: StateObject | Function, callback?: StateUpdateCallback | null, updatedPaths?: string[][] | PathNode[] | null) => Promise<StateObject>;
    paths: PathNode;
    windowManager: WindowManager | null;
};
export type SpiccatoExtended<Base, Extensions> = Base & Extensions;
export type GettersSchema<ThisType> = {
    [key: string]: (this: ThisType, ...args: any[]) => any;
};
export type SettersSchema<ThisType> = {
    [key: string]: (this: ThisType, ...args: any[]) => any;
};
export type MethodsSchema<ThisType> = {
    [key: string]: (this: ThisType, ...args: any[]) => any;
};
export type ExtensionSchema<ThisType> = {
    [key: string]: any;
};
export type NamespacedMethods<Instance> = {
    [namespace: string]: {
        [key: string]: (this: Instance, ...args: any[]) => any;
    };
};
type SingleLevelGetters<T, Depth extends number, Prefix extends string = ''> = {
    [K in keyof T as Depth extends 12 ? `get${Capitalize<Prefix>}${Uncapitalize<string & K>}` : `get${Capitalize<Prefix>}${Uncapitalize<string & K>}`]: () => T[K];
};
type NestedGetters<T, Depth extends number, Prefix extends string = ''> = Depth extends 0 ? {} : {
    [K in keyof T]: T[K] extends Array<any> ? SingleLevelGetters<T, Depth, Prefix> : T[K] extends object ? SingleLevelGetters<T[K], Depth, `${Capitalize<Prefix>}${Lowercase<string & K>}_`> & NestedGetters<T[K], Decrement<Depth>, `${Prefix}${string & K}_`> : {};
}[keyof T];
export type AutoGetters<T, Depth extends number = 12, Prefix extends string = ''> = SingleLevelGetters<T, Depth, Prefix> & NestedGetters<T, Depth, Prefix>;
type SingleLevelSetters<T, Depth extends number, Prefix extends string = ''> = {
    [K in keyof T as Depth extends 12 ? `set${Capitalize<Prefix>}${Uncapitalize<string & K>}` : `set${Capitalize<Prefix>}${Uncapitalize<string & K>}`]: () => T[K];
};
type NestedSetters<T, Depth extends number, Prefix extends string = ''> = Depth extends 0 ? {} : {
    [K in keyof T]: T[K] extends Array<any> ? SingleLevelSetters<T, Depth, Prefix> : T[K] extends object ? SingleLevelSetters<T[K], Depth, `${Capitalize<Prefix>}${Uncapitalize<string & K>}_`> & NestedSetters<T[K], Decrement<Depth>, `${Prefix}${string & K}_`> : {};
}[keyof T];
export type AutoSetters<T, Depth extends number = 12, Prefix extends string = ''> = SingleLevelSetters<T, Depth, Prefix> & NestedSetters<T, Depth, Prefix>;
type Decrement<N extends number> = N extends 12 ? 11 : N extends 11 ? 10 : N extends 10 ? 9 : N extends 9 ? 8 : N extends 8 ? 7 : N extends 7 ? 6 : N extends 6 ? 5 : N extends 5 ? 4 : N extends 4 ? 3 : N extends 3 ? 2 : N extends 2 ? 1 : N extends 1 ? 0 : 0;
export type GetterMethods<T, Custom, Depth extends number = 10> = AutoGetters<T, Depth> & Custom & GettersSchema<any>;
export type SetterMethods<T, Custom, Depth extends number = 10> = AutoSetters<T, Depth> & Custom & SettersSchema<any>;
export {};
