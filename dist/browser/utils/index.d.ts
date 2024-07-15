import { GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, StateSchema } from "../types";
type Constructor<T = {}> = new (...args: any[]) => T;
export declare function applyNamespace<State extends StateSchema, Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, TBase extends Constructor<SpiccatoInstance<State, Getters, Setters, Methods>>>(Base: TBase, namespace: string): {
    new (...args: any[]): {
        state: State;
        getters: Getters;
        setters: Setters;
        methods: Methods;
        setState: (updater: import("../types").StateObject | Function, callback?: import("../types").StateUpdateCallback | null, updatedPaths?: string[][] | import("./helpers").PathNode[] | null) => Promise<import("../types").StateObject>;
        paths: import("./helpers").PathNode;
        windowManager: import("./helpers").WindowManager | null;
    };
} & TBase;
export declare function withNamespaceMixin<TBase extends new (...args: any[]) => any, NSMethods extends MethodsSchema<InstanceType<TBase>>>(Base: TBase, namespace: string): TBase & {
    new (...args: any[]): InstanceType<TBase> & {
        [key in typeof namespace]: NSMethods;
    };
};
export declare function createNamespace<State extends StateSchema, Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>>(namespace: string): ClassDecorator;
export {};
