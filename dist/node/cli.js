const fs = require("fs");
const path = require("path");

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// Get Arguments 
const argString = process.argv.slice(2).join(" ")

// const nameSearch = /\s?\w+\s?/g
const rootSearch = /--root=[\w\.\/]+/
const nameSearch = /--name=\w+/
const typescriptSearch = /--typescript/
const chainSearch = /\-[Sgsm]+/g
const keywordSearch = /(state|getters|setters|methods)=\w+/g

/* 
::::::::::::::::
:: ARG PARSER ::
::::::::::::::::
*/
const argParser = () => {

    const FILES = {
        stateSchema: null,
        getters: null,
        setters: null,
        methods: null,
    }

    const FLAG_MAP = {
        S: "stateSchema",
        g: "getters",
        s: "setters",
        m: "methods",
    }

    // 1. Search for flags
    let foundFlags = argString.match(chainSearch)

    foundFlags = foundFlags ?
        foundFlags
            .map(f => f.replace(/-/g, ""))
            .join("")
            .split("")
            .map(f => FLAG_MAP[f])
        :
        [];

    // 2. search for keyword arguments
    const keywords = argString.match(keywordSearch) || []

    const foundKeywords = []
    const foundKeywordValues = {}

    keywords.forEach(kwAssignment => {
        const [kw, val] = kwAssignment.split('=')
        foundKeywords.push(kw)
        foundKeywordValues[kw] = val
    })

    // 3. combine flags and keyword arguments
    const allFlags = Array.from(new Set([...foundFlags, ...foundKeywords]))

    // 4. apply filenames (user specified from keyword arguments or default from flags)
    allFlags.forEach(f => FILES[f] = f ? foundKeywordValues[f] || f : null)

    // 5. return results
    return FILES

}

/* 
::::::::::::::::::
:: FILE WRITERS ::
::::::::::::::::::
*/

const writeManager = (root, name, ts, supportFiles) => {
    let supportImports = ""
    for (let sf of Object.values(supportFiles)) {
        if (sf) supportImports += `import ${sf} from './${sf}'\n`
    }

    const fileContents = `
import Spiccato from 'spiccato';
${ts ? `import {${capName(name)}State, ${capName(name)}Getters, ${capName(name)}Setters, ${capName(name)}Methods, ${capName(name)}Extensions} from './types'` : ""}
${supportImports}
${ts ? `
class SpiccatoExtended extends Spiccato<${capName(name)}State, ${capName(name)}Getters, ${capName(name)}Setters, ${capName(name)}Methods, ${capName(name)}Extensions> {
    /* 
    place 'get' methods here for your custom namespaces. See documentation for details.
    Example: 
    get myCustomNamespace(): MyCustomNamespace {
        return this._myCustomNamespace as MyCustomNamespace
    }
    */
}
` : ""}
${supportFiles.stateSchema ? `const ${name}Manager = new ${ts ? "SpiccatoExtended" : "Spiccato"}(${supportFiles.stateSchema}, {id: "${name}"})` : `const ${name}Manager = new Spiccato({}, {id: "${name}"})`}

// Uncomment below to connect state to localStorage
/*
${name}Manager.connectToLocalStorage({ 
    persistKey: "${name}"
})
*/

${name}Manager.init(); ${(!!supportFiles.getters || !!supportFiles.setters) && "// IMPORTANT: This must be called prior to addCustomGetters and addCustomSetters"}

${supportFiles.getters ? `${name}Manager.addCustomGetters(${supportFiles.getters})` : ""}
${supportFiles.setters ? `${name}Manager.addCustomSetters(${supportFiles.setters})` : ""}
${supportFiles.methods ? `${name}Manager.addCustomMethods(${supportFiles.methods})` : ""}

export default ${name}Manager; 
export const ${name}Paths = ${name}Manager.paths;
`
    // create state directory if it doesn't exist
    !fs.existsSync(root) && fs.mkdirSync(root, { recursive: true })

    // create/overwrite previous directory of named resource
    try {
        fs.mkdirSync(`${root}/${name}`)
    } catch (err) {
        if (err.code === "EEXIST") {
            console.log("\n=== Root directory already exists ===\n")
        }
    }

    // create manager file
    fs.writeFileSync(`${root}/${name}/${name}Manager.${ts ? "ts" : "js"}`, fileContents)
    console.log(`created ${root}/${name}/${name}Manager.${ts ? "ts" : "js"}`)
}


const writeSupportFiles = (root, name, ts, files) => {
    let sf,
        fileContents

    for (let sfKey of Object.keys(files)) {
        sf = files[sfKey]
        if (sf) {
            fileContents = genSupportFileTemplate(sf, sfKey)
            fs.writeFileSync(`${root}/${name}/${sf}.${ts ? "ts" : "js"}`, fileContents)
            console.log(`created ${root}/${name}/${sf}.${ts ? "ts" : "js"}`)
        }
    }
}

const writeTypesFile = (root, name, files) => {
    const stateType = capName(name) + "State";
    const fileContents = `
import { GetterMethods, SetterMethods, SpiccatoInstance, SpiccatoExtended } from 'spiccato/types';
import stateSchema from './${files.stateSchema}';

// STATE
export type ${stateType} = typeof ${files.stateSchema ?? "stateSchema"} & {

};

// GETTERS
type CustomGetters = {
    // place custom getter method type signatures here
};
export type ${capName(name)}Getters = GetterMethods<${stateType}, CustomGetters>;

// SETTERS
type CustomSetters = {
    // place custom setter method type signatures here
};
export type ${capName(name)}Setters = SetterMethods<${stateType}, CustomSetters>;

// METHODS
export type ${capName(name)}Methods = {
    // place custom method type signatures here
};

// NAMESPACE METHODS
/* 
Example:
export type MyCustomNamespace = {
    someNamespacedMethod: (n: number) => void;
}
*/

// EXTENSIONS
export type ${capName(name)}Extensions = {
    // place custom namespaces here. Example:
    // myCustomNamespace: MyCustomNamespace;
};

// INSTANCES
type BaseInstance = SpiccatoInstance<${stateType}, ${capName(name)}Getters, ${capName(name)}Setters, ${capName(name)}Methods>;
export type ${capName(name)}Instance = SpiccatoExtended<BaseInstance, ${capName(name)}Extensions>;
`
    // create types file
    fs.writeFileSync(`${root}/${name}/types.ts`, fileContents);
    console.log(`created ${root}/${name}/types.ts`);

}






/* 
:::::::::::::
:: HELPERS ::
:::::::::::::
*/
const prompt = (question) => {
    return new Promise(resolve => rl.question(question, input => resolve(input)))
}

const genSupportFileTemplate = (supportFile, fileType) => {
    return `
const ${supportFile} = {

    // your ${fileType} here...

}

export default ${supportFile};
`
}

const capName = (name) => {
    let newName = name.split("")
    newName[0] = newName[0].toUpperCase()
    return newName.join("")
}

const noFiles = (files) => {
    for (let file of Object.keys(files)) {
        if (files[file]) return false
    }
    return true
}


/* 
:::::::::::::::::::::
:: SCRIPT EXECUTOR ::
:::::::::::::::::::::
*/
const run = async () => {

    // 1a. get the root of the project destination from the user (either from the --root flag or from prompt)
    let root = argString.match(rootSearch)
    root = root ? root[0].split("=")[1] : await prompt("Where would you like to save this state resource: ")
    root = path.normalize(root);

    // 1b. get boolean if this is a typescript build
    const ts = !!argString.match(typescriptSearch);

    // 1c. get the name of the state resource from the user (either from the --name flag or from prompt)
    let name = argString.match(nameSearch)
    name = name ? name[0].split("=")[1] : await prompt("What would you like to name this state resource: ")

    console.log("State Resource: ", name)

    // 2a. find any flags or keyword arguments in the argument string
    let filesToMake = argParser()

    // 2b. If no arguments given, walk through assigning values
    if (noFiles(filesToMake)) {
        console.log("\n=== No arguments detected ===")
        console.log("Initializing Setup Wizard")
        console.log("\nFor each support file listed, provide a name. If you want the default name, just press ENTER. If you do not want to include the support file, type '-'.\n")
        let currentFile;
        for (let file of Object.keys(filesToMake)) {
            currentFile = await prompt(file + ": ")
            filesToMake[file] = currentFile.toLowerCase() === "-" ? null : currentFile.length ? currentFile : file
        }
    }

    rl.close()

    // 3. write the main provider file
    writeManager(root, name, ts, filesToMake)

    // 4. write types file if typescript indicated
    ts && writeTypesFile(root, name, filesToMake);

    // 5. write support files
    writeSupportFiles(root, name, ts, filesToMake)

}

run();
