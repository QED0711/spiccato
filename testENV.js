
class _localStorage {

    constructor(){
        this.state = {}
    }

    getItem(key) {
        return this.state[key]
    }

    setItem(key, value){
        this.state[key] = value;
    }

    removeItem(key){
        delete this.state[key]
    }

    clear(){
        this.state = {};
    }
}

this.window = {
    localStorage: new _localStorage()
}
module.exports = {StateManager} = require("./index")
