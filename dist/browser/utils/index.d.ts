import { GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, StateSchema } from "../types";
export declare function createNamespace<State extends StateSchema, Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>, NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>>(namespace: string): <T extends {
    new (...args: any[]): SpiccatoInstance<State, Getters, Setters, Methods>;
}>(constructor: T) => T;
