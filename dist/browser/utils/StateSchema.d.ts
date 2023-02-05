interface Schema {
    [key: string]: any;
}
declare class StateSchema {
    private schema;
    constructor(schema: Schema);
    generateValueMap(): void;
}
