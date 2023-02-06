"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Get Arguments 
const argString = process.argv.slice(2).join(" ");
// const nameSearch = /\s?\w+\s?/g
const nameSearch = /--name=\w+/;
const chainSearch = /\-[scmr]+/g;
const keywordSearch = /(state|setters|constants|methods|reducers)=\w+/g;
/*
::::::::::::::::
:: ARG PARSER ::
::::::::::::::::
*/
const argParser = () => {
    const FILES = {
        state: null,
        setters: null,
        methods: null,
        reducers: null,
        constants: null,
    };
    const FLAG_MAP = {
        s: "state",
        c: "setters",
        m: "methods",
        r: "reducers",
        k: "constants"
    };
    // 1. Search for flags
    let foundFlags = argString.match(chainSearch);
    foundFlags = foundFlags ?
        foundFlags
            .map(f => f.replace(/-/g, ""))
            .join("")
            .split("")
            .map(f => FLAG_MAP[f])
        :
            [];
    // 2. search for keyword arguments
    const keywords = argString.match(keywordSearch) || [];
    const foundKeywords = [];
    const foundKeywordValues = {};
    keywords.forEach(kwAssignment => {
        const [kw, val] = kwAssignment.split('=');
        foundKeywords.push(kw);
        foundKeywordValues[kw] = val;
    });
    // 3. combine flags and keyword arguments
    const allFlags = Array.from(new Set([...foundFlags, ...foundKeywords]));
    // 4. apply filenames (user specified from keyword arguments or default from flags)
    allFlags.forEach(f => FILES[f] = f ? foundKeywordValues[f] || f : null);
    // 5. return results
    return FILES;
};
/*
::::::::::::::::::
:: FILE WRITERS ::
::::::::::::::::::
*/
const writeProvider = (name, supportFiles) => {
    let supportImports = "";
    let sf;
    for (let sfKey of Object.keys(supportFiles)) {
        sf = supportFiles[sfKey];
        // if(sf) supportImports += `const ${sf} = require('./${sf}')\n`
        if (sf)
            supportImports += `import ${sf} from './${sf}'\n`;
    }
    // console.log(supportImports)
    const fileContents = `
import CantusFirmus from 'cantus-firmus';

${supportImports}

${supportFiles.state ? `const ${name} = new CantusFirmus(${supportFiles.state})` : `const ${name} = new CantusFirmus({})`}

${supportFiles.setters ? `${name}.addCustomSetters(${supportFiles.setters})` : ""}
${supportFiles.methods ? `${name}.addMethods(${supportFiles.methods})` : ""}
${supportFiles.reducers ? `${name}.addReducers(${supportFiles.reducers})` : ""}
${supportFiles.constants ? `${name}.addConstants(${supportFiles.constants})` : ""}

export const ${capName(name)}Context = ${name}.context;
export const ${capName(name)}Provider = ${name}.createProvider();

`;
    // create state directory if it doesn't exist
    !fs_1.default.existsSync("./src/state/") && fs_1.default.mkdirSync("./src/state");
    // create/overwrite previous directory of named resource
    fs_1.default.mkdirSync(`./src/state/${name}`);
    // create provider file
    fs_1.default.writeFileSync(`./src/state/${name}/${name}Provider.js`, fileContents);
    console.log(`created ./src/state/${name}/${name}Provider.js`);
};
const writeSupportFiles = (name, files) => {
    let sf, fileContents;
    for (let sfKey of Object.keys(files)) {
        sf = files[sfKey];
        if (sf) {
            fileContents = genSupportFileTemplate(sf, sfKey);
            fs_1.default.writeFileSync(`./src/state/${name}/${sf}.js`, fileContents);
            console.log(`created ./src/state/${name}/${sf}.js`);
        }
    }
};
/*
:::::::::::::
:: HELPERS ::
:::::::::::::
*/
const PROMPT = (question) => {
    return new Promise(resolve => rl.question(question, input => resolve(input)));
};
const genSupportFileTemplate = (supportFile, fileType) => {
    return `
const ${supportFile} = {

    // your ${fileType} here...

}

export default ${supportFile};
`;
};
const capName = (name) => {
    let newName = name.split("");
    newName[0] = newName[0].toUpperCase();
    return newName.join("");
};
const noFiles = (files) => {
    for (let file of Object.keys(files)) {
        if (files[file])
            return false;
    }
    return true;
};
/*
:::::::::::::::::::::
:: SCRIPT EXECUTOR ::
:::::::::::::::::::::
*/
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // 1. get the name of the state resource from the user (either from the --name flag or from PROMPT)
    const name = ((_c = (_b = (_a = argString.match(nameSearch)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.split("=")) !== null && _c !== void 0 ? _c : yield PROMPT("What would you like to name this state resource: "));
    console.log("State Resource: ", name);
    // 2a. find any flags or keyword arguments in the argument string
    let filesToMake = argParser();
    // 2b. If no arguments given, walk through assigning values
    if (noFiles(filesToMake)) {
        console.log("\n=== No arguments detected ===");
        console.log("Initializing Setup Wizard");
        console.log("\nFor each support file listed, provide a name. If you want the default name, just press ENTER. If you do not want to include the support file, type '-'.\n");
        let currentFile;
        for (let file of Object.keys(filesToMake)) {
            currentFile = (yield PROMPT(file + ": "));
            filesToMake[file] = currentFile.toLowerCase() === "-" ? null : currentFile.length ? currentFile : file;
        }
    }
    rl.close();
    // 3. write the main provider file
    writeProvider(name, filesToMake);
    // 4. write support files
    writeSupportFiles(name, filesToMake);
});
run();
