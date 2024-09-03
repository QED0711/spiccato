import { StateObject, StateSchema } from "../types";
export declare const createStateProxy: (state: StateObject, schema: StateSchema) => StateObject;
export declare const formatAccessor: (path: string | string[], accessorType?: string) => string;
export declare const getNestedRoutes: (state: {
    [key: string]: any;
}) => string[][];
export declare const nestedSetterFactory: (state: {
    [key: string]: any;
}, path: string[]) => (newValue: any) => {
    [x: string]: any;
};
export declare const sanitizeState: (state: StateObject, privatePaths: (string | string[])[]) => ({
    [x: string]: any;
} | Map<string | string[], string[]>)[];
export declare const restoreState: (state: {
    [key: string]: any;
}, removed: {
    [key: string]: any;
}) => {
    [x: string]: any;
};
export declare const getUpdatedPaths: (update: StateObject, prevState: StateObject, stateSchema: StateObject) => string[][];
export declare function hasCircularReference(stateSchema: StateSchema): boolean;
export declare function stateSchemaHasFunctions(stateSchema: StateSchema): boolean;
export declare class WindowManager {
    private subscribers;
    window: {
        [key: string]: any;
    } | null;
    constructor(window: {
        [key: string]: any;
    } | null);
    open(url: string, name: string, queryParams: {
        [key: string]: any;
    }): void;
    close(name: string): void;
    removeSubscribers(): void;
}
export declare class _localStorage {
    private state;
    constructor();
    getItem(key: string): string;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
export declare class PathNode {
    __$path: string[];
    [key: string]: any;
    constructor(path: string[]);
    extendPath(prop: string): void;
}
export declare class PathTree {
    root: PathNode;
    constructor(obj: StateObject);
    processPaths(obj: StateObject, currentNode: PathNode): void;
}
