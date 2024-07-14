import { GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, StateSchema } from "../types";

export function createNamespace<
    State extends StateSchema,
    Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
>(namespace: string) {
    return function <T extends { new(...args: any[]): SpiccatoInstance<State, Getters, Setters, Methods> }>(constructor: T): T {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                (this as any)["_" + namespace] = {};
            }

            get [namespace](): NSMethods {
                return (this as any)["_" + namespace] as NSMethods;
            }
        }
    }
}