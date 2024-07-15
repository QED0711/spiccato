"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyNamespace = applyNamespace;
exports.withNamespaceMixin = withNamespaceMixin;
exports.createNamespace = createNamespace;
function applyNamespace(Base, namespace) {
    return class extends Base {
        get [namespace]() {
            return this[`_${namespace}`];
        }
    };
}
function withNamespaceMixin(Base, namespace) {
    return class extends Base {
        constructor(...args) {
            super(...args);
            this["_" + namespace] = {};
        }
        get [namespace]() {
            return this["_" + namespace];
        }
    };
}
function createNamespace(namespace) {
    return function (constructor) {
        return withNamespaceMixin(constructor, namespace);
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
