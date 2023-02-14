# Spiccato 

`Spiccato` is a simple, lightweight, and efficient state management library built for both browser and backend applications. It automates several common state management patterns, is easily extendible and customizable, and makes typically complex tasks like state persistence simple to implement. It is written in typescript and has no dependencies. 

## Index

### Installation

### Basic Usage

Creating a new state manager is accomplished in two simple steps. 

1. **Define a State Schema**: State schemas are the default values for a state object. It contains all key value pairs that are expected to exist over the lifetime of the manager. 
2. **Initialize a StateManager instance**: Pass the defined state schema to the `AdaptiveState` constructor call. 

```
import AdaptiveState from 'adaptive-state';

// Defined State Schema
const state = {
    num: 1,
    str: "Hello, world!"
}

// Pass the schema to the initialize of the instance
const manager = new AdaptiveState(state, {id: "myState"})

console.log(manager.state.num) // 1
manager.setters.setNum(2)
console.log(manager.state.num) // 2 
```

### Initialization Options
| Property | Type  | Default | Description  |  
|---|---|---|---|
| id  | string (required) | null | A unique ID that can be used to retrieve the registered instance at a later time |
| dynamicGetters | boolean   | true | Whether or not to dynamically generate getter methods based on the initialized state schema |
| dynamicSetters | boolean | true | Whether or not to dynamically generate setter methods based on the initialized state schema |
| nestedGetters | boolean | true | Whether or not to dynamically generate nested getter methods based on the initialized state schema |
| nestedSetters | boolean | true | Whether or not to dynamically generate nested setter methods based on the initialized state schema |
| debug | boolean | false | Whether or not to log out debug messages when utilizing the initialized manager |

### State Schema

**State Schemas** define the default key value pairs of the internal state for a `Spiccato` instance. Schemas are used during initialization of the instance to create dynamic setters and getters (if prescribed by the user in the initialization options), as well as throughout of the life of the instance whenever state is accessed. 

It is important that schemas are *complete* at time of initialization. This means that all the key value pairs that will need to exist at some point in the execution of the code *do* exist in the schema definition. Any key value pairs added after initialization will not be processed by the `Spiccato` instance and will have limited functionality in terms of dynamic setters, getters, and events.  

Schemas are not inherently typed. When you define your schema and you have "null" values that are expected to be filled at a later time, it is best practice to assign those values to the falsey/empty type that they represent. However, there is nothing stopping you from assigning a value to `null` if that is required in your code. 

For Example:

```
const stateSchema = {
    isAdmin: false, // boolean false
    count: 0, // zero for number type
    message: "", // empty string
    items: [], // empty array 
    credentials: {}, // empty object,
    someOtherValue: null // this will work, but use sparingly
}
```

| Type | "Null" Placeholder |
|---|---|
| Boolean | false |
| Number | 0 |
| String | "" |
| Array | [] |
| Object | {} |

### Customization
#### Getters
#### Setters
#### Methods
---
### Events

When a `Spiccato` instance is initialized, it dynamically creates events for all the properties defined in the state schema. 

#### AddEventListener

You can add event liseners to a `Spiccato` instance. In keeping with common JS event subscriptions patterns, you simply call the `addEventListener` method on your instance, passing in either an event name *or* a `string[]` array denoting the path to a state property and a callback to be executed when that event triggers. You can add multiple event listeners to the same event. 

Event names conform to the following format: "on_" + PATH_TO_STATE_PROPERTY + "_update". If you have a state property named "myVal", the associated event that would trigger when that property changes would be "on_myVal_update". In the case of nested properties, it follows the same format with each level of nesting being separated by an underscore "\_". E.G. "on_level1_level2_value_update".
```
const manager = new AdaptiveState({num: 1}, {id: "main"})
manager.addEventLisener("on_num_update", function(payload) {
    /* do something here */
})
```

The event `payload` is an object with two properties, `path` and `value`. The `path` property is the full path to the state resource from the top level of your state object. The `value` property is the value after the update. 

You can also subscribe for *any* updates to your state object with the `"update"` event type.

```
manager.addEventListener("update", function(payload){
    /* do something here */
})
```

For the general `update` event, the payload differs slightly. Since there is no single path being subscribed to, the payload for this event type only has a `state` property with the current values for the entire state. 

#### RemoveEventListener
---

## Connect to Local Storage

### Storage Options

## CLI