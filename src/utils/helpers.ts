export const formatAccessor = (path: string | string[], accessorType: string = "get") => {
    path = Array.isArray(path) ? path.join("_") : path;
    return accessorType + path[0].toUpperCase() + path.slice(1)
}

export const getNestedRoutes = (state: { [key: string]: any }) => {

    const paths: (string[])[] = [];
    const traverse = (element: any, currentPath: string[] = []) => {
        if (typeof element !== "object" || Array.isArray(element) || !element) {
            currentPath.length > 1 && paths.push(currentPath);
            return;
        }

        currentPath.length > 1 && paths.push(currentPath)
        for (let key of Object.keys(element)) {
            traverse(element[key], [...currentPath, key])
        }
    }

    traverse(state);
    return paths;
}

export const nestedSetterFactory = (state: { [key: string]: any }, path: string[]) => (newValue: any) => {
    let copy = { ...state },
        currentPath = copy,
        key;
    for (let i = 0; i < path.length; i++) {
        key = path[i];
        if (i < path.length - 1) {
            currentPath[key] = { ...currentPath[key] }
        } else {
            currentPath[key] = newValue
        }
        currentPath = currentPath[key]
    }
    return copy;
}

export const sanitizeState = (state: { [key: string]: any }, privatePaths: (string | string[])[]) => {
    const sanitized = { ...state }
    const removed = new Map()
    for (let path of privatePaths ?? []) {
        if (typeof Array.isArray(path)) {
            let copy = sanitized;
            for (let i = 0; i < path.length; i++) {
                // console.log(copy, path[i], "\n")
                if (i === path.length - 1) {
                    removed.set(path, copy[path[i]])
                    delete copy[path[i]]
                    break;
                }
                copy = copy[path[i]]
            }
        } else if (typeof path === "string") {
            delete sanitized[path];
        }
    }
    return [sanitized, removed];
}


export const restoreState = (state: {[key: string]: any}, removed: {[key: string]: any} ) => {
    const restored = {...state}
    let copy;
    for(let [path, value] of removed.entries()){
        path = Array.isArray(path) ? path : [path]
        copy = restored;
        for(let i = 0; i < path.length; i++){
            if(i == path.length - 1) {
                copy[path[i]] = value;
            } else {
                copy = copy[path[i]];
            }
        }
    }
    return restored
}

export const getUpdatedPaths = (update: {[key: string]: any}, prevState: {[key: string]: any}): string[][] => {
    const paths: string[][] = [];

    const traverse = (updatedVal: any, prevVal: any, path: string[] = []) => {
        if(typeof updatedVal !== "object" || Array.isArray(updatedVal) || !updatedVal){
            if(updatedVal !== prevVal){
                path.length > 0 && paths.push(path);
            } 
            return
        }

        path.length > 0 && paths.push(path)
        for(let key of Object.keys(updatedVal)){
            traverse(updatedVal[key], ((!!prevVal && key in prevVal) ? prevVal[key] : null), [...path, key])
        }
    }

    traverse(update, prevState)
    return paths;
}


const createParamsString = (params: {[key: string]: any}): string => {
    let str = ""
    for (let param of Object.keys(params)) {
        str += (param + "=" + params[param] + ",")
    }
    return str;
}


/* CLASSES */
export class WindowManager{

    /* Instance Properties */
    private subscribers: {[key: string]: any};
    window: {[key: string]: any} | null;

    constructor(window: {[key: string]: any} | null){
        this.subscribers = [];
        this.window = window;
    }

    open(url: string, name: string, queryParams: {[key: string]: any}){
        if(this.window){
             this.subscribers[name] = this.window.open(url, name, createParamsString(queryParams) )
        }
    }

    close(name: string){
        this.subscribers[name]?.close();
        delete this.subscribers[name]
    }

    removeSubscribers(){
        for(let subscriber of Object.values(this.subscribers)){
            subscriber.close()
        }
    }

}

export class _localStorage {
    private state: {[key: string]: string}
    constructor(){
        this.state = {}
    }

    getItem(key: string) {
        return this.state[key]
    }

    setItem(key:string, value:string){
        this.state[key] = value;
    }

    removeItem(key:string){
        delete this.state[key]
    }

    clear(){
        this.state = {};
    }
}