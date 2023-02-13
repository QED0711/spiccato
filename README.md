# Adaptive-State

`Adaptive-State` is a simple, lightweight, and efficient state management library built for both browser and backend applications. It automates several common state management patterns, is easily extendible,  and makes typically complex tasks like state persistence simple to implement. It is written in typescript and has no dependencies. 

## Index

### Installation

### Usage

```
import AdaptiveState from 'adaptive-state';
const state = {
    num: 1,
    str: "Hello, world!"
}
const manager = new AdaptiveState(state, {id: "myState"})

console.log(manager.state.num) // 1
manager.setters.setNum(2)
console.log(manager.state.num) // 2 


```

### Initialization Options
### State Schema
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