import { GettersSchema, SettersSchema, MethodsSchema, SpiccatoInstance, StateSchema } from "../types";

type Constructor<T = {}> = new (...args: any[]) => T;

export function applyNamespace<
    State extends StateSchema,
    Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    TBase extends Constructor<SpiccatoInstance<State, Getters, Setters, Methods>>
>(Base: TBase, namespace: string) {
    return class extends Base {
        get [namespace](): NSMethods {
            return (this as any)[`_${namespace}`] as NSMethods;
        }
    };
}

export function withNamespaceMixin<
    TBase extends new (...args: any[]) => any,
    NSMethods extends MethodsSchema<InstanceType<TBase>>
>(Base: TBase, namespace: string): TBase & {new (...args: any[]): InstanceType<TBase> & {[key in typeof namespace]: NSMethods}} {
    return class extends Base {
        constructor(...args: any[]) {
            super(...args);
            (this as any)["_" + namespace] = {};
        }
        get [namespace](): NSMethods {
            return (this as any)["_" + namespace] as NSMethods;
        }
    }
}

export function createNamespace<
    State extends StateSchema,
    Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
    NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>
>(namespace: string): ClassDecorator {
    return function (constructor: Function) {
        return withNamespaceMixin(constructor as any, namespace);
    };
}

// export function createNamespace<
//     State extends StateSchema,
//     Getters extends GettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
//     Setters extends SettersSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
//     Methods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
//     NSMethods extends MethodsSchema<SpiccatoInstance<State, Getters, Setters, Methods>>,
// >(namespace: string) {
//     return function <T extends { new(...args: any[]): SpiccatoInstance<State, Getters, Setters, Methods> }>(constructor: T): T {
//         return class extends constructor {
//             constructor(...args: any[]) {
//                 super(...args);
//                 (this as any)["_" + namespace] = {};
//             }

//             get [namespace](): NSMethods {
//                 return (this as any)["_" + namespace] as NSMethods;
//             }
//         }
//     }
// }