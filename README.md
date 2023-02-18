# Spiccato 

`Spiccato` is a simple, lightweight, and efficient state management library built for both browser and backend applications. It automates several common state management patterns, is easily extendible and customizable, and makes typically complex tasks like state persistence simple to implement. It is written in typescript and has no dependencies. 

## Index

### Installation

### Basic Usage

Creating a new state manager is accomplished in two simple steps. 

1. **Define a State Schema**: State schemas are the default values for a state object. It contains all key value pairs that are expected to exist over the lifetime of the manager. 
2. **Initialize a StateManager instance**: Pass the defined state schema to the `AdaptiveState` constructor call. 

```
import Spiccato from 'spiccato';

// Defined State Schema
const stateSchema = {
    num: 1,
    str: "Hello, world!"
}

// Pass the schema to the initialization of the instance
const manager = new Spiccato(stateSchema, {id: "myState"})
manager.init()

console.log(manager.state.num) // 1
manager.setState({num: 2})
console.log(manager.state.num) // 2 
```
#### **setState**

`setState` is a low level method the you can access on your `spiccato` instance. It is used to set all properties of an associated state, but more commonly just a subset of properties . This method can take in one of two types for its first argument: an `object` or a `function`. It can take an optional second argument of a `callback` called after the state has been set. `setState` returns a promise that will resolve to an updated state. 

##### **Object Input**

When an object is passed, the state will update just the properties indicated in the object without modifying/removing any of the other properties in the state. However, be cautious when using an object to update nested structures. You will need to make sure that every call to `setState` updates every property in the nested structure or else the fundamental structure will change. In situations like this, it is better to use a `function` as an input (see below), or a [dynamic nested setter](#dynamic-accessors).

```
const stateSchema = {
    someBool: true,
    user: {
        name: "",
        address: "",
        phone: "",
    }
}

const manager = new Spiccato(stateSchema, {id: "setStateDemo"})
manager.init()

// this is fine and doesn't change any other state
manager.setState({someBool: false}) 

// This is also fine because it sets all the defined properties of the nested object
manager.setState({user: {name: "John Doe", address: "123 Main st", phone: "555-5555"}})

// Watch out here! This fundamentally changes the state schema because it only sets some properties of the nested state
manager.setState({user: {name: "Jane Doe"}})
```

##### **Function Input**
As described above, object inputs to `setState` have some drawbacks when working with more complex state values like *objects* and *arrays*. In these situations, it is recommended that you use a function as the initial input. This function will receive one argument, which is the `state` at the time the function is called, and it must return an object with the necessary updated values. Like the object input, values in the returned object from this function are updated, and anything omitted is not updated. 

```
const stateSchema = {
    someBool: true,
    user: {
        name: "",
        address: "",
        phone: "",
    }
}

const manager = new Spiccato(stateSchema, {id: "setStateWithFunction"})
manager.init()

manager.setState(function(prevState){
    return {someBool: !prevState.someBool}
})

manager.setState(function(prevState){
    return {user: {...prevState.user, name: "John Doe"}};
})
```
In this example, we call `setState` twice, each time with a function as an argument. In the first call, we take a boolean value and return its inverse. This could also be accomplished with an object input, but you would then have to access the boolean value outside the set state call so you could determine its inverse. 

In the second call, we take the more complex *user* object and set just a subset of its nested values. With `...prevState.user`, we are effectively creating a new user object with all the same properties as the incoming state's user object. We then change just the *name* parameter in this new object we have created. This way we are sure that we have completely preserved all the parameters we haven't touched in the *user* object.

##### **Asynchronous Behavior & Callback Argument**

After `setState` has been called, you may want to access the newly updated state. You have two options for this, and they are *not* mutially exclusive. 

`setState` returns a `promise` that will resolve the updated state. Therefore, `setState` can be awaited in an async block. Alternatively (or in addition to), you can pass an optional callback as a second argument to `setState`. This callback will receive the updated state as its only argument. 

```
const stateSchema = {myVal: 0}

const manager = new Spiccato(stateSchema, {id: "asyncAndCallback"})
manager.init()

// Async/Await functionality
const someAsyncFunc = async () => {
    const updatedState = await manager.setState({myVal: 1})
    console.log(updatedState.myVal) // => 1
}

// Callback functionality
manager.setState({myVal: 2}, (updatedState) => {
    console.log(updatedState.myVal) // => 2
})
```

---
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

**State Schemas** define the default key value pairs of the internal state for a `Spiccato` instance. Schemas are used during initialization of the instance to create dynamic setters and getters (if prescribed by the user in the initialization options), as well as throughout the life of the instance whenever state is accessed. 

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

---
### State Accessors
#### Immutable Access
Each `spiccato` instance has a `state` property. You can access values through this property, but you cannot modify any value directly from this property. 

```
const manager = Spiccato({myVal: 0}, {id: "immutability"})
manager.init()

manager.state.myVal // => 0

manager.state.myVal = 1 // This will throw an error
```
#### Dynamic Accessors
An alternative way to access and set state values is through dynamically generated accessors. 

The default initialization behavior of a `spiccato` instance automatically creates accessor methods (getters and setters) for the each parameter in the associated state. In the case of nested values, nested accessors are also create. This behavior can be modified at the time of initialization. See [Initialization Options](#initialization-options) for more information on how to modify this behavior.

For example, take the following state schema and initialization:
```
const stateSchema = {
    num: 0,
    user: {
        name: "",
        age: 0 
    }
}

const manager = new Spiccato(stateSchema, {
    id: "dynamicAccessors",
    dynamicGetters: true,
    dynamicSetters: true,
    nestedGetters: true,
    nextedSetters: true,
})
manager.init()
```

For this schema, dynamically generated accessor methods are stored in `setters` and `getters` in the following way.

```
// getters
manager.getters.getNum() // => state.num
manager.setters.getUser() // => state.user
manager.getters.getUser_name() // => state.user.name
manager.getters.getUser_age() // => state.user.age

// setters
manager.setters.setNum(1)
manager.setters.setUser({name: "name", age: 10})
manager.setters.setUser_name("some string")
manager.setters.setUser_age(1)
```
---
### Customization

You will likely find it necessary to extend the functionality of your state management beyond the dynamic getter and setter patterns described above. This is easily achieved with a number of customization options that are available on any `spiccato` instance.  

The following four methods follow a similar pattern. They each take in an object where the keys are the custom function names, and the values are the functions themselves (`addNamespacedMethods` is slightly different, see below). The custom functions get bound to your `spiccato` instance, and can access the `this` parameter within their body. Because of this binding procedure, it is important that you do not pass in *arrow functions* to these methods, as they cannot be bound like typical JavaScript functions. 

As an example:

```
{
    someFunction(){
        /* This is the recommended format */
    },

    someOtherFunction: function (){
        /* This will also work */
    },

    badIdea: () => {
        /* This will not work */
    }
}
```
#### addCustomGetters
The `addCustomGetters` method allows you to append customized getter function to the `getters` parameter of your state manager. 

In the example below, you would get dynamic getters for a `user` `firstName` and `lastName`. The custom getter function that is added, `getUserFullName`, allows you to derive a new value based on existing state. Getting derived values from you state is the primary purpose of these custom getter methods.

```
const stateSchema = {user: {firstName: "Foo", lastName: "Bar"}}

/* initialize manager code here ... */

manager.addCustomGetters({
    getUserFullName(){
        return this.state.user.firstName + " " + this.state.user.lastName;
    }
})

manager.getters.getUserFullName() // "Foo Bar"
```

#### addCustomSetters
The `addCustomSetters` method allows you to append customized setter functions to the `setters` paramter of you state manager. Custom setters should call the `this.setState` method in their body.

In the example below, we have an initialized state with a `cart` array. If you used the dynamic setter called `setCart`, you would have to first get the array, add an item to it, and then pass the new array to the setter. The custom setter, `addOrderToCart` encapsulates this logic and makes it easier to reuse in the future. 

Custom setters are often helpful when dealing with arrays and objects and you want to set a particular index or property without modifying the entire structure. They are also usefuly when some logic is needed prior to setting a state value.

```
const stateSchema = {cart: []};

/* initialize manager code here ... */

manager.addCustomSetters({
    addOrderToCart(order){
        this.setState(prevState => {
            const updatedCart = [...prevState.cart, order];
            return {cart: updatedCart}
        })
    }
})

const order = {/* some order definition here */}
manager.setters.addOrderToCart(order)

```

#### addCustomMethods

The `addCustomMethods` method allows you to add functionality and flexability to your state manager. Where `getters` and `setters` have specific and well defined purposes for accessing and modifying state, methods are less strictly defined. In essence, whenever you want to have simple and direct access to your state and all its built in functionality (setters/getters) within a function call, methods may provide a good option. 

Some common uses for custom methods are: 
- Making a network request and then using the response as an input for a setter.
- Accessing state values and then using them to perform an external action such as updating the DOM or some other external variable. 

```
const stateSchema = {isAdmin: false};

/* initialize manager code here ... */

manager.addCustomMethods({

    / *
      * This method shows/hides content in the page based on certain state configurations.
      * All the logic is self contained, and so this method can be called from anywhere in your application and you can expect it to perform correctly
    * /
    showOrHideAdminOptions(){
        const adminOptions = document.querySelector("#admin-options-container")
        adminOptions.style.visiblity = this.state.isAdmin ? "visible" : "hidden" 
    },

    / * 
      * This method makes a network call and sets the state according to the response. 
      * Notice how it also calls the previous custom method we defined.
    * /
    getUserFromID(userID){
        fetch(`https://some_endpoint/user/${userID}`)
            .then(response => response.json())
            .then(data => {
                this.setters.setIsAdmin(data.role === "admin")
                this.methods.showOrHideAdminOptions()
            })
    },
})

manager.methods.getUserFromID(1);
```

#### addNamespacedMethods

Namespaced methods are essentially custom methods, but that can be logically organized based on their purpose. The argument to `addNamespacedMethods` is also an object, but the first level of keys are the namespaces pointing to nested objects, and the nested objects are the function names and function definitions. 

```
const stateSchema = {orderHistory: []};

/* initialize manager code here ... */

manager.addNamespacedMethods({
    // 'API' becomes a new namespace we can access directly on the manager 
    API: {
        getOrderHistory(userID){
            fetch(`https://orderHistoryEndpoint/${userID}/orders)
                .then(response => response.json())
                .then(data => {
                    this.setters.setOrderHistory(data.orders)
                })
        }
    }
})

manager.API.getOrderHistory(1);
```
---
### Events

When a `Spiccato` instance is initialized, it dynamically creates events for all the properties defined in the state schema. 

#### AddEventListener

You can add event liseners to a `Spiccato` instance. In keeping with common JS event subscriptions patterns, you simply call the `addEventListener` method on your instance, passing in either an event name *or* a `string[]` array denoting the path to a state property and a callback to be executed when that event triggers. You can add multiple event listeners to the same event. 

Event names conform to the following format: "on_" + PATH_TO_STATE_PROPERTY + "_update". If you have a state property named "myVal", the associated event that would trigger when that property changes would be "on_myVal_update". In the case of nested properties, it follows the same format with each level of nesting being separated by an underscore "\_". E.G. "on_level1_level2_value_update".
```
const manager = new Spiccato({
        num: 1,
        user: {
            phone: {
                cell: "555-5555",
                "work": "123-4567"
            }
        }
    }, 
    {id: "main"}
)
manager.init();

manager.addEventLisener("on_num_update", function(payload) {
    /* do something here */
})

manager.addEventListener(["user", "phone", "cell"], function(payload){
    /* do something here */
})
```
#### Event Payload
The event `payload` is an object with two properties, `path` and `value`. The `path` property is the full path to the state resource from the top level of your state object. The `value` property is the value after the update. 

You can also subscribe for *any* updates to your state object with the `"update"` event type.

```
manager.addEventListener("update", function(payload){
    /* do something here */
})
```

For the general `update` event, the payload differs slightly. Since there is no single path being subscribed to, the payload for this event type only has a `state` property with the current values for the entire state object. 

#### RemoveEventListener

You can remove an event listener with a familiar pattern as well.

```
// define your callback
const callback = (payload) => {
    /* do something here */
}

// add your callback to a particular event
manager.addEventListener("update", callback)

// remove callback/event listener when it is no longer needed
manager.removeEventListener("update", callback)
```

Note that it is important you pass in the same function reference when you remove a listener as you did when you originally subscribed. 

---

## Connect to Local Storage

When deployed in a browser environment, you will have access to the `localStorage` API. `localStorage` allows you to save key value pairs to a specific domain and retrieve those values at a later time, even after page reloads. 

`Spiccato` allows you to easily mirror your state in `localStorage`. There are two main reasons you may want to do this: 

- Persist state on a certain domain that survives page reloads
- Synchronize state updates between two or more windows on the same domain. 

### LocalStorage Concepts

The browser's `localStorage` API allows you to store key value pairs specific to a domain. However, the values in these pairs must always be strings. The browser will coerce non-string types into strings. In the case of primitives, they simply become their string representation (e.g. 5 becomes '5', true becomes 'true', etc. ). However, for non-primitives like objects and arrays, they become *"[object Object]"*. Therefore, when mirroring your state in `localStorage`, you must first `stringify` it, or all your data will be lost. 

`Spiccato` handles this process for you, but is still bound by the limits of JavaScript object stringification. For instance, you cannot have circular structures or functions in your state if it is being connected to `localStorage`. To learn more about stringification, see [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify). In situations where your state does have a value that cannot be stringified, you can omit that specific value though `privateState` (see [storageOptions](#storage-options)).

You should also be aware that placing state in `localStorage` makes it easily accessible to the end user. Any `localStorage` value can be accessed and modified without any special permisions, and so you should refrain from placing any values in there that you do not want the end user to have complete control over. 

---
### Basic Usage

```
cosnt stateSchema = {
    user: {name: "", isAdmin: false},
    cart: [],
}

const manager = new Spiccato(stateSchemea, {id: "localStorageDemo"});

manager.connectToLocalStorage({
    persistKey: "lsDemo", // this is the key under which the state will be saved in localStorage
    iniitalizeFromLocalStorage: false, // store in localStorage only for this session
    privateState: [["user", "isAdmin"]] // keep some state private so the end user cannot access it. 
    providerID: "stateProvider"
})

manager.init()

localStorage.getItem("lsDemo") // => '{user: {name: ""}, cart: []}'
manager.setters.setUser_name("Sally");
localStorage.getItem("lsDemo") // => '{user: {name: "Sally"}, cart: []}'
```

Note in this example how the `init` method is called *after* `connectToLocalStorage`. This is necessary to setup all the required functionality that will handle `localStorage` persistence and updates.  

### Storage Options

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| persistKey | string (required) | null | A unique key within the domain. This is the key under which the state will be stored in localStorage. |
| initializeFromLocalStorage | bool | false | Whether or not to take the default state values from local storage at time of initialization |
| providerID | string (required) | null | The id of the window that is desginated as the state provider. |  
| subscriberIDs | string[] | [] | An array of IDs indicating which spawned windows may subscribe to and receive state updates. |  
| clearStorageOnUnload | bool | true | Whether of not to clear the state loaded to `localStorage` when the provider window is closed. |
| removeChildrenOnUnload | bool | true | Whether of not to recurrsively close spawnd children windows when the provider window (or relative parent window) is closed. |
| privateState | string[] or string[][] | [] | An array of strings or array of nested string arrays. Indicates state paths that will not be persisted to local storage. Provider windows will have access to all state regardless, but subscriber windows will only have access to state not defined within this option. | 

---

### State Persistence

The following configuration shows how to persist your state in a browser in such a way that it will survive a page reload. 

```
const stateSchema = {
    colorMode: "light",
    accessKey: ""
};

const manager = new Spiccato(stateSchema, {id: "persistDemo"});

manager.connectToLocalStorage({
    persistKey: "statePersistDemo",
    initializeFromLocalStorage: true,
    providerID: "persistProvider",
    clearStorageOnUnload: false,
    privateState: ["accessKey"]
})

manager.init();

manager.setters.setColorMode("dark");
manager.setters.setAccessKey("12345");
manager.state // => {colorMode: "dark", accessKey: "12345"}

```

The main options to pay attention to here are the `initializeFromLocalStorage` and `clearStorageOnUnload`. 

When `initializeFromLocalStorage` is set to true, the `spiccato` instance will first look in local storage to get its default state values. Anything not found in `localStorage` but that exists in the `stateSchema` will be initialized in their usual way. In this instance, we don't want the end user having total control over the `accessKey` parameter, but we do want to persist their choice in `colorMode`. We have setup our `privateState` accordingly.

Second, we want to make sure we don't reset the `localStorage` state when we reload the page, so we set `clearStorageOnUnload` to false. This is the main parameter that allows us to persist state over page reloads. 

When the user reloads the page, this is what their state will look like:

```
manager.state // => {colorMode: "dark", accessKey: ""}
```

### Inter Window Communication

`localStorage` can be used to share state between two or more windows on the same domain that are open at the same time. However, synchronizing state across windows can be a complex task that requires you to consider many contingencies. `Spiccato` abstracts this complexity behind the `connectToLocalStorage` functionality and a `windowManager` API. 

#### windowManager


---

## CLI