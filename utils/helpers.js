"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeState = exports.nestedSetterFactory = exports.getNestedRoutes = exports.formatAccessor = void 0;
const formatAccessor = (path, accessorType = "get") => {
    path = Array.isArray(path) ? path.join("_") : path;
    return accessorType + path[0].toUpperCase() + path.slice(1);
};
exports.formatAccessor = formatAccessor;
const getNestedRoutes = (state) => {
    const paths = [];
    const traverse = (element, currentPath = []) => {
        if (typeof element !== "object" || Array.isArray(element) || !element) {
            currentPath.length > 1 && paths.push(currentPath);
            return;
        }
        currentPath.length > 1 && paths.push(currentPath);
        for (let key of Object.keys(element)) {
            traverse(element[key], [...currentPath, key]);
        }
    };
    traverse(state);
    return paths;
};
exports.getNestedRoutes = getNestedRoutes;
const nestedSetterFactory = (state, path) => (newValue) => {
    let copy = Object.assign({}, state), currentPath = copy, key;
    for (let i = 0; i < path.length; i++) {
        key = path[i];
        if (i < path.length - 1) {
            currentPath[key] = Object.assign({}, currentPath[key]);
        }
        else {
            currentPath[key] = newValue;
        }
        currentPath = currentPath[key];
    }
    return copy;
};
exports.nestedSetterFactory = nestedSetterFactory;
const sanitizeState = (state, privatePaths) => {
    const sanitized = Object.assign({}, state);
    for (let path of privatePaths !== null && privatePaths !== void 0 ? privatePaths : []) {
        if (typeof Array.isArray(path)) {
            let copy = sanitized;
            for (let i = 0; i < path.length; i++) {
                console.log(copy, path[i], "\n");
                if (i === path.length - 1) {
                    delete copy[path[i]];
                    break;
                }
                copy = copy[path[i]];
            }
        }
        else if (typeof path === "string") {
            delete sanitized[path];
        }
    }
    return sanitized;
};
exports.sanitizeState = sanitizeState;
