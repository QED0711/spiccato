export const formatAccessor = (path, accessorType = "get") => {
    path = Array.isArray(path) ? path.join("_") : path;
    return accessorType + path[0].toUpperCase() + path.slice(1);
};
export const getNestedRoutes = (state) => {
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
export const nestedSetterFactory = (state, path) => (newValue) => {
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
export const sanitizeState = (state, privatePaths) => {
    const sanitized = Object.assign({}, state);
    const removed = new Map();
    for (let path of privatePaths !== null && privatePaths !== void 0 ? privatePaths : []) {
        if (typeof Array.isArray(path)) {
            let copy = sanitized;
            for (let i = 0; i < path.length; i++) {
                // console.log(copy, path[i], "\n")
                if (i === path.length - 1) {
                    removed.set(path, copy[path[i]]);
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
    return [sanitized, removed];
};
export const restoreState = (state, removed) => {
    const restored = Object.assign({}, state);
    let copy;
    for (let [path, value] of removed.entries()) {
        path = Array.isArray(path) ? path : [path];
        copy = restored;
        for (let i = 0; i < path.length; i++) {
            if (i == path.length - 1) {
                copy[path[i]] = value;
            }
            else {
                copy = copy[path[i]];
            }
        }
    }
    return restored;
};
export const getUpdatedPaths = (update, prevState) => {
    const paths = [];
    const traverse = (updatedVal, prevVal, path = []) => {
        if (typeof updatedVal !== "object" || Array.isArray(updatedVal) || !updatedVal) {
            if (updatedVal !== prevVal) {
                path.length > 0 && paths.push(path);
            }
            return;
        }
        path.length > 0 && paths.push(path);
        for (let key of Object.keys(updatedVal)) {
            traverse(updatedVal[key], ((!!prevVal && key in prevVal) ? prevVal[key] : null), [...path, key]);
        }
    };
    traverse(update, prevState);
    return paths;
};
const createParamsString = (params) => {
    let str = "";
    for (let param of Object.keys(params)) {
        str += (param + "=" + params[param] + ",");
    }
    return str;
};
/* CLASSES */
export class WindowManager {
    constructor(window) {
        this.subscribers = [];
        this.window = window;
    }
    open(url, name, queryParams) {
        if (this.window) {
            this.subscribers[name] = this.window.open(url, name, createParamsString(queryParams));
        }
    }
    close(name) {
        var _a;
        (_a = this.subscribers[name]) === null || _a === void 0 ? void 0 : _a.close();
        delete this.subscribers[name];
    }
    removeSubscribers() {
        for (let subscriber of Object.values(this.subscribers)) {
            subscriber.close();
        }
    }
}
export class _localStorage {
    constructor() {
        this.state = {};
    }
    getItem(key) {
        return this.state[key];
    }
    setItem(key, value) {
        this.state[key] = value;
    }
    removeItem(key) {
        delete this.state[key];
    }
    clear() {
        this.state = {};
    }
}
