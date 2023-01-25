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
    for (let path of privatePaths ?? []) {
        if (typeof Array.isArray(path)) {
            let copy = sanitized;
            for (let i = 0; i < path.length; i++) {
                console.log(copy, path[i], "\n")
                if (i === path.length - 1) {
                    delete copy[path[i]]
                    break;
                }
                copy = copy[path[i]]
            }
        } else if (typeof path === "string") {
            delete sanitized[path];
        }
    }
    return sanitized;
}