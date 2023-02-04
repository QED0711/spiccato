
interface Schema {
    [key: string]: any
}
class StateSchema {

    private schema: Schema;

    constructor(schema: Schema){
        this.schema = schema;
    }

    generateValueMap(){
        
    }
}