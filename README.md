# Adaptive-State

`Adaptive-State` is a simple, lightweight, and efficient state management library built for both browser and backend applications. It automates several common state management patterns, is easily extendible,  and makes typically complex tasks like state persistence simple to implement. It is written in typescript and has no dependencies. 

## Index

### Installation

### Usage

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
| debugger | boolean | false | Whether or not to whether or not to log out debug messages when using the initialized manager |

### State Schema

`State Schemas` define the default key value pairs of the internal state for an `AdaptiveState` instance. Schemas are used during initialization of the instance to create dynamic setters and getters (if prescribed by the user), as well as throughout of the life of the instance whenever state is accessed. 

It is important that schemas are *complete* at time of initialization. This means that all the key value pairs that will need to exist at some point in the execution of the code *do* exist during initialization. Any key value pairs added after initialization will not have the same benfits of those that were created prior to initialization.  
 
### Customization
#### Getters
#### Setters
#### Methods
### Event Subscription

You can add event liseners to an `AdaptiveState` instance. In keeping with common JS event subscriptions patterns, you simply call the `addEventListener` method on your instance, passing in an event name and a callback to be executed when that event triggers.

```
const manager = new AdaptiveState({num: 1}, {id: "main"})
manager.addEventLisener("on_num_update", function(payload) {
    /* do something here */
})
```

The event `payload` is an object with two properties, `path` and `value`. The `path` property is the full path to the state resource from the top level of your state object. The `value` property is the value after the update. 

You can also subscribe for *any* updates to your state object with the `"update"` event.


## Connect to Local Storage

### Storage Options

## CLI