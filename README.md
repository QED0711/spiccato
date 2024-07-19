# Spiccato 

# ⚠️ Beta Release Notice

**This is a beta release (v1.0.1-beta) of the Spiccato package.**

Please be aware that this version is currently in beta and may contain bugs or incomplete features. There is no warranty for the beta release. For a stable build, please use the latest version in the 0.x.x series. There are breaking changes between version 0.x.x and 1.0.1-beta.

To install this beta version:

```bash
npm install spiccato@1.0.1-beta
```
----

`Spiccato` is a simple, lightweight, and efficient state management library built for both browser and backend applications. It automates several common state management patterns, is easily extendible and customizable, and makes typically complex tasks like state persistence simple to implement. It is written in typescript and has no dependencies. 

## Index
- [Installation](#installation)
- [Basic Usage](#basic-usage)
    - [setState](#setstate)
        - [Object Input](#object-input)
        - [Function Input](#function-input)
        - [Asynchronous Behavior & Callback Argument](#asynchronous-behavior--callback-argument)
        - [updatedPaths & More Efficient Updating](#updatedpaths--more-efficient-updating)
    - [Initialization Options](#initialization-options)
    - [Project Wide State Management](#project-wide-state-management)
    - [State Schema](#state-schema)
    - [State Accessors](#state-accessors)
        - [Immutable Access](#immutable-access)
        - [Dynamic Accessors](#dynamic-accessors)
        - [When to Use Dynamic Accessors](#when-to-use-dynamic-accessors)
    - [Customization](#customization)
        - [addCustomGetters](#addcustomgetters)
        - [addCustomSetters](#addcustomsetters)
        - [addCustomMethods](#addcustommethods)
        - [addNamespacedMethod](#addnamespacedmethods)
    - [Events](#events)
        - [addEventListener](#addeventlistener)
        - [Event Payload](#event-payload)
        - [removeEventListener](#removeeventlistener)
    - [Errors](#errors)
- [Typescript Support (improved in v^1.0.0)](#typescript-support)
    - [Introduction](#introduction)
    - [Basic Instantiation patterns in Typescript](#basic-instantiation-patterns-in-typescript)
    - [Advanced Instantiation Patterns In Typescript](#advanced-instantiation-patterns-in-typescript)
    - [Typing Your State Schema](#typing-your-state-schema)
    - [Type Exports](#type-exports)
- [Connect To Local Storage](#connect-to-local-storage)
    - [LocalStorage Concepts](#localstorage-concepts)
    - [Basic Usage](#basic-usage-1)
    - [Storage Options](#storage-options)
    - [State Persistence](#state-persistence)
    - [Inter window Communication](#inter-window-communication)
        - [windowManager](#windowmanager)
- [Command Line Interface](#command-line-interface)  
    - [package.json Script](#packagejson-script)  
    - [Keyword Arguments & File Structure](#keyword-arguments--file-structure)  
    - [CLI Flags & Options](#cli-flags--options)  
    - [Support File Flags](#support-file-flags)  
    - [Changing Default Names](#changing-default-names)  
---
## Installation

```
npm i spiccato 
```

## Basic Usage

Creating a new state manager is accomplished in two simple steps. 

1. **Define a State Schema**: State schemas are the default values for a state object. It contains all key value pairs that are expected to exist over the lifetime of the manager. 
2. **Initialize a StateManager instance**: Pass the defined state schema to the `Spiccato` constructor call. 

```javascript
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
manager.setters.setNum(5) // dynamic setter
console.log(manager.getters.getNum()) // => 5; dynamic getter
```
#### **setState**

`setState` is a low level method the you can access on your `spiccato` instance. It can be used to set all properties of an associated state, but more commonly just a subset of properties. This method accepts three arguments:

| Argument | Type(s) | Description |
| --- | --- | --- |
| updater | object \| function | This can be either an object or a function which returns an object. In either case, this object will be used to update the values of your state. |
| callback | function \| null | a callback that is executed *after* a state update has been performed. |
| updatedPaths | string[][] \| null | Defines what paths in your state are being updated. |

##### **Object Input**

When an object is passed, the state will update just the properties indicated in the object without modifying/removing any of the other properties in the state. However, be cautious when using an object to update nested structures. You will need to make sure that every call to `setState` updates every property in the nested structure or else the fundamental structure will change. In situations like this, it is better to use a `function` as an input (see below), or a [dynamic nested setter](#dynamic-accessors).

```javascript
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
console.log(manager.state.user) // => {name: "Jane Doe"}; address and phone properties are gone.
```

##### **Function Input**
As described above, object inputs to `setState` have some drawbacks when working with more complex state values like *objects* and *arrays*. In these situations, it is recommended that you use a function as the initial input. This function will receive one argument, which is the `state` at the time the function is called. The return value can either be an object with the necessary updated values, or an array of two elements where the first is the object with updated values and the second is an array indicating what paths have been updated. Like the object input, values in the returned object from this function are updated, and anything omitted is not updated. 

```javascript
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
    return {someBool: !prevState.someBool} // returns just an object
})

manager.setState(function(prevState){
    return [ 
        {user: {...prevState.user, name: "John Doe"}}, // updater object
        [manager.paths.user.name] // paths that have been updated
    ];
})
```
In this example, we call `setState` twice, each time with a function as an argument. In the first call, we take a boolean value and return its inverse. This could also be accomplished with an object input, but you would then have to access the boolean value outside the set state call so you could determine its inverse. 

In the second call, we take the more complex *user* object and set just a subset of its nested values. With `...prevState.user`, we are effectively creating a new user object with all the same properties as the incoming state's user object. We then change just the *name* parameter in this new object we have created. This way we are sure that we have completely preserved all the parameters we haven't touched in the *user* object. As a second element in the returned array, we have a paths array indicating what paths have just been updated. This isn't necessary, but does provide a slight [performance improvement](#updatedpaths--more-efficient-updating).

##### **Asynchronous Behavior & Callback Argument**

After `setState` has been called, you may want to access the newly updated state. You have two options for this, and they are *not* mutually exclusive. 

`setState` returns a `promise` that will resolve the updated state. Therefore, `setState` can be awaited in an async block. Alternatively (or in addition to), you can pass an optional callback as a second argument to `setState`. This callback will receive the updated state as its only argument. 

```javascript
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
##### **updatedPaths & More Efficient Updating**

The third argument you can pass to `setState` is `updatedPaths`, an array defining which paths the state update will effect. This can take the form of either a an array of string arrays (`string[][]`), or an array of `spiccato` path objects which are accessed on the instance's `paths` property.

There are some benefits to explicitly defining the paths that are about to be updated. When an update occurs, `spiccato` compares your previous state to the newly updated state to determine which paths have updated so it can notify the appropriate listeners. This operation is recursive and becomes more expensive for objects with deeply nested structures. However, if you tell `setState` what you are about to update, it will skip this recursive check and just call event listeners based on the paths you define.

When you use a functional argument in `setState`, you can return an array where the second element is this `updatedPaths` argument. If you take this route, the returned value from the function will supersede the direct input of `updatedPaths` to `setState`. This is particularly helpful if there is logic in your `setState` function that may or may not update certain values. By returning the `updatedPaths` value from the function call itself, you can always make sure that the `updatedPaths` array is an accurate representation of what has been updated. 

> Note: dynamic setters and nested setters make a call to `setState` under the hood. They make use of this efficiency boost by explicitly defining the updated paths. If the situation permits, dynamic setters and nested setters offer the easiest and most efficient solution for state updates. 

```javascript
const stateSchema = { 
    myVal: 0, 
    user: {
        name: "", 
        phone: {
            cell: "", 
            work: ""
        }
    } 
}

const manager = new Spiccato(stateSchema, {id: "explicateUpdatedPaths"})
manager.init()

// Example with array paths. For this update we don't need to check the user object for changes because we are explicitly telling it that we're only updating `myVal`
manager.setState({myVal: 1}, null, [["myVal"]])

// Example with an array of path objects from the instance's 'paths' property. Here we use a functional input to update nested paths. By explicitly defining the changed paths, we don't need to check the whole state structure for updates.  
manager.setState(
    prevState => ({
        user: {
            name: "Jane", 
            phone: {
                ...prevState.user.phone, 
                cell: "555-5555"
            }
        }
    }),
    null,
    [manager.paths.user.name, manager.paths.user.phone.cell]
)

```
However, you should be aware of some potential drawbacks in explicitly defining your state updates.

- If your defined paths do not exactly match your actual state update, you will either miss or erroneously trigger an event listener.
- If your state update doesn't actually change your state (i.e. just sets the same primitive value again), en event listener will still trigger based on your explicit updated paths definition. 

```javascript
/* AVOID THESE SCENARIOS */

const stateSchema = { val1: 0, val2: 0 }

const manager = new Spiccato(stateSchema, {id: "BADexplicitUpdatedPaths"})
manager.init()

// This will trigger an event listener even though `val1` is still `0` after the update. A recursive check would not have flagged this change as an update.
manager.setState({ val1: 0 }, null, [manager.paths.val1]) 

// The update and the explicit paths do not match, and event listeners for `val2` will not be fired
manager.setState({ val1: 1, val2: 2 }, null, [manager.paths.val1])

```
---
### Initialization Options
| Property | Type  | Default | Description  |  
|---|---|---|---|
| id  | string (required) | null | A unique ID that can be used to retrieve the registered instance at a later time |
| dynamicGetters | boolean   | true | Whether or not to dynamically generate getter methods based on the initialized state schema |
| dynamicSetters | boolean | true | Whether or not to dynamically generate setter methods based on the initialized state schema |
| allowDynamicAccessorOverride | boolean | true | If true, the user can replace a dynamic getter/setter with a function of the same name in either `addCustomGetters` or `addCustomSetters` | 
| nestedGetters | boolean | true | Whether or not to dynamically generate nested getter methods based on the initialized state schema |
| nestedSetters | boolean | true | Whether or not to dynamically generate nested setter methods based on the initialized state schema |
| debug | boolean | false | Whether or not to log out debug messages when utilizing the initialized manager |
| enableWriteProtection | boolean | true |**WARNING**: *Disabling this removes safeguards that disallow direct state mutation. Disable only when absolutely necessary.* When active, only allows users access to an immutable state object. There is a performance cost that comes from a recursive copying operation to create this immutable object. If performance is a concern, you may consider disabling this safeguard.  |

---
### Project Wide State Management

After a `Spiccato` manager has been initialized, you may want to access that same manager in several parts of your project. This can be achieved with standard JavaScript import/exports, or through the `Spiccato` class. 

**JS Import/Export**
```javascript
const manager = new Spiccato({/* stateSchema here */}, {id: "managerAccess"})
manager.init()

export default manager;


/*********** SOME OTHER FILE ***********/
import manager from 'path/to/manager/init/file';
```

**Reference Lookup**
```javascript
const manager = new Spiccato({/* stateSchema here */}, {id: "managerAccess"})
manager.init()

/*********** SOME OTHER FILE ***********/
import Spiccato from 'spiccato'

const manager = Spiccato.getManagerByID("managerAccess")
```

---
### State Schema

**State Schemas** define the default key value pairs of the internal state for a `Spiccato` instance. Schemas are used during initialization of the instance to create dynamic setters and getters (if prescribed by the user in the initialization options), as well as throughout the life of the instance whenever state is accessed. 

It is important that schemas are *complete* at time of initialization. This means that all the key value pairs that will need to exist at some point in the execution of the code *do* exist in the schema definition. Any key value pairs added after initialization will not be processed by the `Spiccato` instance and will have limited functionality in terms of dynamic setters, getters, and events.  

Schemas are not inherently typed. When you define your schema and you have "null" values that are expected to be filled at a later time, it is best practice to assign those values to the falsey/empty type that they represent. However, there is nothing stopping you from assigning a value to `null` if that is required in your code. 

For Example:

```javascript
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
Each `spiccato` instance has a `state` property. You can access values through this property, but by default, you cannot modify any value directly from this property. This safeguard is put in place when setting the initialization property, `enableWriteProtection`, to true. 

There is a performance cost associated with write protecting your state in this way. If performance is a concern, you may consider disabling this feature. Note that if you disable write protection, any direct mutations will work, but event emitters associated with that state will not fire. This uncoupling of state updates can lead to unexpected and difficult to debug behavior. It is recommended to leave write protection enabled unless absolutely necessary.

A compromise between safety and performance is to enable write protection in development mode to ensure all state updates are handled appropriately and predictably, and then disable it in production. The precise implementation of this logic will change depending on your environment, but it could look something like this:

```javascript
const manager = Spiccato({myVal: 0}, {id: "immutability"})
manager.init({ enableWriteProtection: process.env.NODE_ENV === "development"})

manager.state.myVal // => 0

manager.state.myVal = 1 // This will throw an error in development mode
```
#### Dynamic Accessors
An alternative way to access and set state values is through dynamically generated accessors. 

The default initialization behavior of a `spiccato` instance automatically creates accessor methods (getters and setters) for the each parameter in the associated state. In the case of nested values, nested accessors are also created. This behavior can be modified at the time of initialization. See [Initialization Options](#initialization-options) for more information on how to modify this behavior.
For example, take the following state schema and initialization:
```javascript
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
    nestedSetters: true,
})
manager.init()
```

For this schema, dynamically generated accessor methods are stored in `setters` and `getters` in the following way.

```javascript
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

#### When to Use Dynamic Accessors
Dynamic getters are particularly useful in closures. In a closure, when you access a state property directly, that value gets burned into the closure. A dynamic getter will always fetch a fresh version of the state property so your closure can know if it has updated.

```javascript
// This will cause an issue because `manager.state.myBool` is now burned into this closure and will not update. 
setInterval(() => {
    if(manager.state.myBool) {
        /* DO SOMETHING HERE */
    }
}, 1000)

// This is the correct way to handle this situation
setInterval(() => {
    if(manager.getters.getMyBool()) {
        /* DO SOMETHING HERE */
    }
}, 1000)
```

Dynamic setters offer a shortcut to the more low level `setState` functionality. They have all the same behavior as `setState` (in fact, they call `setState` under the hood) including asynchronous functionality, callbacks, and explicit update paths. If you are ever performing a simple state update operation on a single parameter, dynamic setters are the easiest solution.

```javascript
// with `setState` you are responsible for ensuring only the state you want updated gets updated.
manager.setState({...manager.state.complexObject, value: 1}, (updatedState) => {
    /* do something with callback here */
})

// with dynamic setters, all complexity is abstracted away for you. 
manager.setters.setComplexObject_value(
    1, 
    (updatedState) => {
    /* do something with callback here */
    }, 
    {explicitUpdatePath: true}
);
```

---
### Customization

You will likely find it necessary to extend the functionality of your state management beyond the dynamic getter and setter patterns described above. This is easily achieved with a number of customization options that are available on your `spiccato` instance.  

> NOTE: It is important that you call the `.init()` method prior to adding custom getters and setters. Failure to do so will result in an error being thrown because the  `addCustomGetters` and `addCustomSetters` will exhibit strange behavior if your try to overwrite a dynamic getter/setter.  

The following four methods follow a similar pattern. They each take in an object where the keys are the custom function names, and the values are the functions themselves (`addNamespacedMethods` is slightly different, see below). The custom functions get bound to your `spiccato` instance, and can access the `this` parameter within their body. Because of this binding procedure, it is important that you do not pass in *arrow functions* to these methods, as they cannot be bound like typical JavaScript functions. 

As an example:

```javascript
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

> **NOTE**: You can replace/overwrite dynamic getter and setter functionality by adding a custom getter/setter of the same name. 
#### addCustomGetters
The `addCustomGetters` method allows you to append customized getter function to the `getters` parameter of your state manager. 

In the example below, you would get dynamic getters for a `user` `firstName` and `lastName`. The custom getter function that is added, `getUserFullName`, allows you to derive a new value based on existing state. Getting derived values from you state is the primary purpose of these custom getter methods.

```javascript
const stateSchema = {user: {firstName: "Foo", lastName: "Bar"}}

/* initialize manager code here ... */

manager.addCustomGetters({
    getUser_firstName(){
        // This function now replaces the dynamic nested getter fro the `firstName` property
    }, 

    getUserFullName(){
        return this.state.user.firstName + " " + this.state.user.lastName;
    }
})

manager.getters.getUserFullName() // "Foo Bar"
```

#### addCustomSetters
The `addCustomSetters` method allows you to append customized setter functions to the `setters` parameter of you state manager. Custom setters should call the `this.setState` method in their body.

In the example below, we have an initialized state with a `cart` array. If you used the dynamic setter called `setCart`, you would have to first get the array, add an item to it, and then pass the new array to the setter. The custom setter, `addOrderToCart` encapsulates this logic and makes it easier to reuse in the future. 

Custom setters are often helpful when dealing with arrays and objects and you want to set a particular index or property without modifying the entire structure. They are also useful when some logic is needed prior to setting a state value.

```javascript
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

The `addCustomMethods` method allows you to add functionality and flexibility to your state manager. Where `getters` and `setters` have specific and well defined purposes for accessing and modifying state, methods are less strictly defined. In essence, whenever you want to have simple and direct access to your state and all its built in functionality (setters/getters) within a function call, methods may provide a good option. 

Some common uses for custom methods are: 
- Making a network request and then using the response as an input for a setter.
- Accessing state values and then using them to perform an external action such as updating the DOM or some other external variable. 

```javascript
const stateSchema = {isAdmin: false};

/* initialize manager code here ... */

manager.addCustomMethods({

    / *
      * This method shows/hides content in the page based on certain state configurations.
      * All the logic is self contained, and so this method can be called from anywhere in your application and you can expect it to perform correctly
    * /
    showOrHideAdminOptions(){
        const adminOptions = document.querySelector("#admin-options-container")
        adminOptions.style.visibility = this.state.isAdmin ? "visible" : "hidden" 
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

Namespaced methods are essentially custom methods, but that can be logically organized based on their purpose. The argument to `addNamespacedMethods` is also an object, but the first level of keys are the namespaces pointing to nested objects, and the nested objects are the function names and function implementations. 

```javascript
const stateSchema = {orderHistory: []};

/* initialize manager code here ... */

manager.addNamespacedMethods({
    // 'API' becomes a new namespace we can access directly on the manager 
    API: {
        getOrderHistory(userID){
            fetch(`https://orderHistoryEndpoint/${userID}/orders`)
                .then(response => response.json())
                .then(data => {
                    this.setters.setOrderHistory(data.orders)
                })
        }
    }
})

manager._API.getOrderHistory(1);
```

Note that in `v^1.0.0`, namespaces are by default prepended with a underscore (`_`). The reason for this is addressed in the [Advanced Instantiation Patterns in Typescript](#advanced-instantiation-patterns-in-typescript) section. In a typescript setting, you should follow the pattern outlined there for type safety. In a normal JavaScript setting, you can include a second argument to the `addNamespacedMethods` call. This is a boolean, and indicates if these typescript support guidelines should be followed. Set this to `false` and there will be no `_` prepended to your namespaced methods.

```javascript
manager.addNamespacedMethods({
    API: {/* implementation here */}
}, false)

manager.API // you can now access your namespace without the `_` prefix 
```

---
### Events

When a `Spiccato` instance is initialized, it dynamically creates events for all the properties defined in the state schema. 

#### AddEventListener

You can add event listeners to a `Spiccato` instance. In keeping with common JS event subscriptions patterns, you simply call the `addEventListener` method on your instance, passing in either an event name *or* an array of paths within your state. You can add multiple event listeners to the same event. 

**Name Input**: Event names conform to the following format: "on_" + PATH_TO_STATE_PROPERTY + "_update". If you have a state property named "myVal", the associated event that would trigger when that property changes would be "on_myVal_update". In the case of nested properties, it follows the same format with each level of nesting being separated by an underscore "\_". E.G. "on_level1_level2_value_update".

**Path Input**: Rather than formatting a string like the examples above, you may like to put in the path to your state resource when adding your event listener. This can be accomplished in two ways. First, you can put in a `string[]` denoting the path to your resource. For example: ["myVal"], or ["level1", "level2", "value"]. Alternatively, your `spiccato` instance will have a `paths` property. This property provides an idiomatic way to input paths to event listeners that prevents common formatting or spelling errors when writing out long string sequences. You can do something like: `manager.paths.myVal`, or `manager.paths.level1.level2.value`. Should you attempt to access a path that is not defined in your `stateSchema`, a `StatePathNotExistError` will be thrown. 

```javascript
const manager = new Spiccato({
        num: 1,
        user: {
            phone: {
                cell: "555-5555",
                work: "123-4567"
            }
        }
    }, 
    {id: "main"}
)
manager.init();

// Path object input (recommended)
manager.addEventListener(manager.paths.user.phone.work, function(payload){
    /* do something here */
})

// Formatted event name input
manager.addEventListener("on_num_update", function(payload) {
    /* do something here */
})

// String array input
manager.addEventListener(["user", "phone", "cell"], function(payload){
    /* do something here */
})


```
#### Event Payload
The event `payload` is an object with two properties, `path` and `value`. The `path` property is the full path to the state resource from the top level of your state object. The `value` property is the value after the update. 

You can also subscribe for *any* updates to your state object with the `"update"` event type.

```javascript
manager.addEventListener("update", function(payload){
    /* do something here */
})
```

For the general `update` event, the payload differs slightly. Since there is no single path being subscribed to, the payload for this event type only has a `state` property with the current values for the entire state object. 

#### RemoveEventListener

You can remove an event listener with a familiar pattern as well. Similarly, `removeEventListener` can take in a `string`, `string[]`, or `paths object` as its first argument defining the path. 

```javascript
// define your callback
const callback = (payload) => {
    /* do something here */
}
const otherCallback = (payload) => {
    /* do something here */
}

// add your callback to a particular vent
manager.addEventListener("update", callback)
manager.addEventListener(manager.paths.myVal, otherCallback)

// remove callback/event listener when it is no longer needed
manager.removeEventListener("update", callback)
manager.removeEventListener(manager.paths.myVal, otherCallback)
```

> **Note**: It is important you pass in the same function reference when you remove a listener as you did when you originally subscribed. 

---
### Errors

`Spiccato` exposes custom errors that you can import into your project.

```javascript
import {/* SOME_ERROR_TYPE */} from 'spiccato/errors';
```

| Error | Reason | Remediation |
| --- | --- | --- |
| ProtectedNamespaceError | The user has added a namespaced method that overwrites an existing `spiccato` property (e.g. state, getters, setters, etc.) | Select a different namespace for your namespaced method |
| ImmutableStateError | The user has attempted to modify state directly without a setter. This error is not thrown when `enableWriteProtection` is false. | Use `setState`, or a setter (dynamic or custom) to modify state. Alternatively, set `enableWriteProtection` in initialization options to false. |
| InvalidStateUpdateError | The user has provided an invalid value for the first argument to `setState` | Ensure that all calls to `setState` receive either an object or a function that returns an object as the first argument. |
| StatePathNotExistError | The user has attempted to access a property within the instance `paths` object that does not exist | Ensure that the `stateSchema` does define the indicated path and that all path properties are spelled correctly | 
| ReservedStateKeyError | The user has supplied a key in state that is reserved by `spiccato` to perform additional functionality. | Select a different key name for the indicated state resource |
| ManagerNotFoundError | The class method, `getManagerByID`, returns `undefined`. This error must be thrown manually. | Check that the ID supplied is associated with an existing manager ID. |

---
## Typescript Support
*Version 1.0.0 and higher includes improved typescript support for full type safety and intellisense*  

### Introduction
`Spiccato` auto-generates much of its core functionality at runtime. As such, achieving full type safety through typescript can be challenging because the precise interface of the state manager is not known at compile time. Several utility types have been included to help ease the burden of achieving type safety with `Spiccato` state managers. Even with these utility types, the user must supply some information about the interface that will be generated.

---

### Basic Instantiation Patterns in Typescript

A basic typescript instantiation could be as simple as this:

```typescript
const stateSchema = {myVal: 0, myString: "hello"};

const manager = new Spiccato<typeof stateSchema>(stateSchema, {id: "tsDemo"});
manager.init()
```
while this will work if you only want to consume state, it will fail to provide type safety for any dynamic or custom getters, setters, or methods. To achieve this, you can opt for a slightly more verbose pattern like the following:

```typescript
// IMPORTS
import {GetterMethods, SetterMethods, StateObject, SpiccatoInstance} from 'spiccato/types';
import Spiccato from 'spiccato';

// STATE
const stateSchema = {myVal: 0, myString: "hello"};

// GETTERS
type CustomGetters = {
    myCustomGetter: () => string;
}
type Getters = GetterMethods<typeof stateSchema, CustomGetters>;

// SETTERS
type CustomSetters = {
    myCustomSetter: (n: number) => Promise<StateObject>;
}
type Setters = SetterMethods<typeof stateSchema, CustomSetters>;

// METHODS
type Methods = {
    myCustomMethod: (n: number) => void;
}

// SIGNATURE
type InstanceSignature = SpiccatoInstance<typeof stateSchema, Getters, Setters, Methods>;

// INSTANTIATION
const tsManager = new Spiccato<typeof stateSchema, Getters, Setters, Methods>(stateSchema, {id: "tsDemo"})
tsManager.init();

// Apply custom functionality below
tsManager.addCustomGetters({
    myCustomGetter(this: InstanceSignature) {return this.state.myString.repeat(this.myVal)},
})

tsManager.addCustomSetters({
    myCustomSetter(this: InstanceSignature, n: number) {
        return this.setState((prevState: typeof stateSchema) => {
            return { myString: prevState.myString.repeat(n) };
        })
    }
})

tsManager.addCustomMethods({
    myCustomMethod(this: instanceSignature, n: number) {
        console.log(n * this.state.myVal);
    }
})

```

There are a few points to highlight here. First are the utility types that you import from `spiccato/types`. Second, note the pattern for defining getters and setters. First, you define the shape of your custom getters/setters. This includes the function definition (arguments and return type) for each getter/setting that you will apply. Then you pass in generics for the state type and these customization definitions to the `GetterMethods` and `SetterMethods` types respectively. By passing in the state, this types will auto generate the dynamic getter and setter type definitions for you, and then you extend those definitions with your customizations. If you don't want to auto generate setters and getters, you can simple pass `{}` in place of your state type. 

### Advanced Instantiation Patterns in Typescript

In the event that you want to add namespaced methods to your manager, you will need to extend the base `Spiccato` class to accommodate the added accessor properties. 

```typescript
import {GetterMethods, SetterMethods, StateObject, SpiccatoInstance, SpiccatoExtended} from 'spiccato/types';
import Spiccato from 'spiccato';

const stateSchema = {myVal: 0, myString: "hello"};

type Getters = GetterMethods<typeof stateSchema, {}>;
type Setters = SetterMethods<typeof stateSchema, {}>;
type Methods = {};

type CustomNamespace = {
    someNamespacedMethod: () => void;
}

type Extensions = {
    customMethods: CustomNamespace;
}

type BaseSignature = SpiccatoInstance<typeof state, Getters, Setters, Methods>;
type InstanceSignature = SpiccatoExtended<BaseSignature, Extensions>;

class SpiccatoExtended extends Spiccato<typeof stateSchema, Getters, Setters, Methods, Extensions> {
    get customMethods(): CustomNamepsace { return this._customMethods as CustomNamespace };
}


const extendedManager = new SpiccatoExtended(stateSchema, {id: "extended"});
extendedManager.init();

extendedManager.addNamespacedMethods({
    customMethods: {
        someNamespaceMethod(this: InstanceSignature) {
            console.log(this.state.myVal);
        }
    }
})

```

In this example, the custom defined `SpiccatoExtended` class extends the base `Spiccato` class and adds a get accessor method called `customMethods`. This get accessor is typed to return an object that adheres to the shape of the `CustomNamepsace` type. in the accessor implementation, note that it actually returns `this._customMethods`. Internally, the manager instance has `this._customMethods` as a property, but it is untyped. By wrapping it in a get accessor, we can supply typing information to enforce type safety and provide intellisense completion. 

Finally, we call the `addNamespacedMethods` with an object that has `customMethods` as a property. This in turn points to another object with our actual method implementations. Note that we supply the `this` keyword definition in the signature, and assign it to the `InstanceSignature` type. This will give us full type safety and intellisense within the method.  

> Note: If you use the included [command line interface](#command-line-interface) to generate your state resource file structure and you include the `--typescript`, flag, this advanced type initialization pattern will be followed. 

---

### Typing your State Schema

When typing your state schema, there are some special considerations. These considerations particularly apply to state properties that are initialized as `null` or `undefined`, or properties that can take the form of multiple types. Consider the following:

```typescript
const myState = {myVal: null, myString: null};
```

if you use the `typeof` keyword to cast this to a qualified typescript `Type`, it won't be able to determine useful types for your state properties. If initializing a state property to `null` or `undefined` is necessary, you should consider one of the following approaches:

```typescript
// extension
const myState = {myVal: null, myString: null};

Type State = typeof myState & {
    myVal: null | number,
    myString: null | string
}
```

Or:

```typescript
// manual typing
Type State = {
    myVal: null | number,
    myString: null | string
}
```
It is also important that you follow one of these approaches if a particular state property can be multiple types.

```typescript
Type State = {
    myVal: null | number | number[] // etc.
}
```


---

### Type Exports

```typescript
import type {/* SOME TYPE HERE */} from 'spiccato/types';
```

| Type | Description |
| --- | --- |
| StateSchema | Type for the state schema passed into a `spiccato` initialization. |
| StateObject | Type for the manifestation of state after `spiccato` instance is initialized |
| SpiccatoInstance | Type that defines the baseline, unextended manager instance. Takes 4 generics <State = {}, Getters = {}, Setters ={}, Methods = {}>. These generics define the interfaces for state, getters, setters, and methods, respectively. |
| SpiccatoExtended | Type that defines a manager instance that has namespace extensions. Takes 2 generics <BaseInstance, Extensions = {}>. The base instance is a `SpiccatoInstance`, and the extensions define the interface(s) to any added namespaces. |
| GetterMethods | A utility type to merge auto generated getters with custom getter method definitions. Takes 3 generics <T, Custom, Depth=12>. `T` is the state type, `Custom` are the custom defined getter method definitions, and `Depth` defines how deep a nested getter traversal should burrow into the state definition (the max is 12 levels) |
| SetterMethods | A utility type to merge auto generated setters with custom setter method definitions. Takes 3 generics <T, Custom, Depth=12>. `T` is the state type, `Custom` are the custom defined setter method definitions, and `Depth` defines how deep a nested setter traversal should burrow into the state definition (the max is 12 levels) |
| managerID | Type for ID associated with a specific manager | 
| EventPayload | Type for payload that is passed as an argument to the callback of a fired event |
| InitializationOptions | Interface for initialization options passed to a `spiccato` initialization. |
| StorageOptions | Interface for storage options passed to `connectToLocalStorage` call. |


---

## Connect to Local Storage

When deployed in a browser environment, you will have access to the `localStorage` API. `localStorage` allows you to save key value pairs to a specific domain and retrieve those values at a later time, even after page reloads. 

`Spiccato` allows you to easily mirror your state in `localStorage`. There are two main reasons you may want to do this: 

- Persist state on a certain domain that survives page reloads
- Synchronize state updates between two or more windows on the same domain. 

### LocalStorage Concepts

The browser's `localStorage` API allows you to store key value pairs specific to a domain. However, the values in these pairs must always be strings. The browser will coerce non-string types into strings. In the case of primitives, they simply become their string representation (e.g. 5 becomes '5', true becomes 'true', etc. ). However, for non-primitives like objects and arrays, they become *"[object Object]"*. Therefore, when mirroring your state in `localStorage`, you must first `stringify` it, or all your data will be lost. 

`Spiccato` handles this process for you, but is still bound by the limits of JavaScript object stringification. For instance, you cannot have circular structures or functions in your state if it is being connected to `localStorage`. To learn more about stringification, see [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify). In situations where your state does have a value that cannot be stringified, you can omit that specific value though `privateState` (see [storageOptions](#storage-options)).

You should also be aware that placing state in `localStorage` makes it easily accessible to the end user. Any `localStorage` value can be accessed and modified without any special permissions, and so you should refrain from placing any values in there that you do not want the end user to have complete control over. 

---
### Basic Usage

```javascript
const stateSchema = {
    user: {name: "", isAdmin: false},
    cart: [],
}

const manager = new Spiccato(stateSchema, {id: "localStorageDemo"});

manager.connectToLocalStorage({
    persistKey: "lsDemo", // this is the key under which the state will be saved in localStorage
    initializeFromLocalStorage: false, // store in localStorage only for this session
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
| providerID | string (required) | null | The id of the window that is designated as the state provider. |  
| subscriberIDs | string[] | [] | An array of IDs indicating which spawned windows may subscribe to and receive state updates. |  
| clearStorageOnUnload | bool | true | Whether of not to clear the state loaded to `localStorage` when the provider window is closed. |
| removeChildrenOnUnload | bool | true | Whether of not to recursively close spawned children windows when the provider window (or relative parent window) is closed. |
| privateState | string[] or string[][] or (instance path object)[] | [] | An array of strings, array of nested string arrays, or array of instance path objects (defined on `instance.paths`). Indicates state paths that will not be persisted to local storage. Provider windows will have access to all state regardless, but subscriber windows will only have access to state values not defined within this option. | 
| deepSanitizeState | bool | true | Whether or not any subscribers will have basic knowledge of private state? By default (true), subscribers will initialize without any knowledge that private state paths exist. This means that dynamic setters, getters, etc. will not be created for any paths defined within `privateState`. Set to false if you still want to your subscribers to know about private state but not the underlying data from the provider. 

---

### State Persistence

The following configuration shows how to persist your state in a browser in such a way that it will survive a page reload. 

```javascript
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
    privateState: [manager.paths.accessKey]
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

```javascript
manager.state // => {colorMode: "dark", accessKey: ""}
```

### Inter Window Communication

`localStorage` can be used to share state between two or more windows on the same domain that are open at the same time. However, synchronizing state across windows can be a complex task that requires you to consider many contingencies. `Spiccato` abstracts this complexity behind the `connectToLocalStorage` functionality and a `windowManager` API. 

#### windowManager

If you're using `Spiccato` inside a browser environment, your state manager instance will be initialized with a `windowManager` property. At a basic level, the `windowManager` wraps `window.open` and `window.close` methods. However, it also adds functionality to track references to spawned windows, send initialization parameters to those windows, and synchronize the lifecycle of spawned windows relative to their immediate parent. 

**!!!IMPORTANT!!!** - If you're are using `spiccato` to manage state between multiple windows, you should use this `windowManager` API to open/close those windows. If you use the browser's standard methods for managing spawned windows, you will miss out on some additional functionality that `spiccato` provides. 

Spawning a new window and managing its state from the parent (or the other way around) is simple:

```javascript
const stateSchema = {
    backgroundColor: "#FFF",
    superSecretKey: ""
};
const manager = new Spiccato(stateSchema, {id: "multiWindowDemo"});
manager.connectToLocalStorage({
    persistKey: "config",
    initializeFromLocalStorage: false,
    clearStorageOnUnload: true,
    removeChildrenOnUnload: true
    providerWindow: "main", // defines the originating state provider window
    subscriberWindows: ["config"], // defines what windows may receive state updates
    privateState: [manager.paths.superSecretKey],
    deepSanitizeState: true
});

manager.init();
manager.windowManager.open("/settings", "config", {height: 500, width: 500});
```
In this example we initialize a new `spiccato` state manager and connect it to local storage. When managing state between multiple windows, there are a few important options that must be passed to the `connectToLocalStorage` call. 

First, you must define a `providerWindow`. At time of initialization, if the window that is open doesn't have a `window.name` property set, it will be assigned this `providerName`. There can only be one provider window at a time. The provider window can access all state properties even if some of those properties have been marked as private. 

Second, you must provide an inclusive array of all subscriber window names that you intend to recognize throughout the lifecycle of your application. If the example above, our call to `connectToLocalStorage` says that it will recognize one subscriber window named `config`.

Finally, in our `manager.windowManager.open` call, we tie everything together. Here, we're saying *"open a window at the route '/settings', name that window 'config', and pass it the following init params."* When that window opens and initializes its local `spiccato` instance, since its name links it to the approved list of subscribers, it will look at the current state given by the provider window and set that as the default value. Note that it will not receive the *superSecretKey* state parameter because that is marked as private and only the provider will have access to it. Because `deepSanitizeState` is set to true, the subscriber window will not even know that `superSecretKey` is a property that the provider window has access to, and will ignore it when setting up its own dynamic setters and getters. 

To programmatically close a spawned window, you only need to call the `windowManager.close` method. 

```javascript
manager.windowManager.close("config");
```

Since the `windowManager` tracks references to all spawned windows, you only need to provide the name of the window to the `close` method and it will remotely close that instance. You can also close all spawned instances like this:

```javascript
manager.windowManager.removeSubscribers();
```

In your `connectToLocalStorage` call, if you set `removeChildrenOnUnload` to `true`, then when the immediate parent of a spawned window is closed all it's immediate children will be closed as well. Note the spawned windows may spawn addition children windows. If the original provider window closes, all spawned windows will close recursively. If spawned window closes that had additional children windows, that window and its children will close recursively, but any parents/grandparents will remain.  

---

## Command Line Interface

A CLI is included with the `Spiccato` install, and it allows you to quickly create a `spiccato` state manager instance and associated support files (getters, setters, methods, etc.). 

> **Note**: The CLI is only implemented for UNIX systems at this time. 

### Package.json Script

The easiest way to execute the CLI script is to add a shortcut to your `package.json` file. 

```json
"scripts": {
    "spiccato-cli": "node ./node_modules/spiccato/cli.js"
}
```

### Keyword Arguments & File Structure

The CLI allows you to specify a root directory in which to save all your state management resources. This is done with the `--root=` argument. You can also specify a name for your manager with the `--name=` argument. If you don't provide a `root` or `name` argument in your call to the CLI, a setup wizard will prompt you to enter values for each. 

As an example:
```
node ./node_modules/spiccato/cli.js --root=./path/to/root --name=main
```
```
<ROOT>
|___<NAME>
    |___<NAME>Manager.js (Spiccato initialization & configuration)
    |___stateSchema.js (required: default state for Spiccato instance)
    |___getters.js (optional: custom getter definitions)
    |___setters.js (optional: custom setter definitions)
    |___methods.js (optional: custom method definitions)
```
The `--typescript` flag is supported in version ^1.0.0. If this is included, all generated files will be `.ts` files, and an additional `types.ts` will be generated in the `<NAME>` directory. See the [Advanced Instantiation Patterns in Typescript](#advanced-instantiation-patterns-in-typescript) for details on how these `.ts` files are formatted. 

Here is an example with the `--typescript` flag:

```
node ./node_modules/spiccato/cli.js --root=./path/to/root --name=main --typescript
```
```
<ROOT>
|___<NAME>
    |___<NAME>Manager.ts (Spiccato initialization & configuration)
    |___stateSchema.ts (required: default state for Spiccato instance)
    |___getters.ts (optional: custom getter definitions)
    |___setters.ts (optional: custom setter definitions)
    |___methods.ts (optional: custom method definitions)
    |___types.ts (included every time --typescript is used)
```

### CLI Flags & Options

> **Note**: the examples below assume you have setup a `package.json` script like the one shown above. Replace `spiccato-cli` with your script name, or simply run directly through node. If you are running through a `package.json` script, make sure to include the `--` before any arguments/flags so they get passed to the script.

If you run the CLI without any options or flags set, you will be taken to a setup wizard which will walk you through setting up your Spiccato instance. Simply follow the instructions printed to your terminal. 

### Keyword Options
| Keyword Flag | Value | Description |
| --- | --- | --- |
| --root | file path string | Where to place the state resource files relative to the current directory |
| --name | name of the state resource | the folder name and name of the state manager to be applied |
| --typescript | none | Include this keyword flag to generate a `types.ts` file, and to build your manager file and resource files with typescript support |
### Support File Flags

If you indicate any of the flags below, a support file for that item will be created, and it will automatically be added to your Spiccato instance. 

| Flag | Support File | Description |
| --- | --- | --- |
| -S | stateSchema.js | Default state | 
| -g | getters.js | Custom getters |  
| -s | setters.js | Custom setters |  
| -m | methods.js | Custom methods | 

**Example:**

In the example below, a file called `mainManager.js` will be created for you housing the `Spiccato` instance configuration, as well as three support files, `stateSchema.js`, `setters.js`, and `methods.js`. These will all be saved into a directory called `main`. Since this call did not specify a `root`, you will be prompted to supply one.

```
npm run spiccato-cli -- --name=main -Ssm
```

### Changing Default Names

If you want to change the name of a support file to be more syntactically correct based on your usage, you can do that by specifying `--<SUPPORT_FILE_NAME>=<DESIRED_NAME>`. If you specify a support file in this way, you do not need to include its flag also.  

Possible support file names are `state`, `getters`, `setters`, and `methods`. 

**Example:**

```
npm run spiccato-cli -- --name=main -Sgs --methods=API 
```

Now, rather than a file named `methods.js`, you will have a file called `API.js`. Note that this only changes the file name, and not the name within your Spiccato instance. 

As the example above shows, you can combine flags and rename files in the same command. The above will create the following state management resource for you:

```
<ROOT>
|___main
    |___mainManager.js
    |___stateSchema.js
    |___getters.js
    |___setters.js
    |___API.js
```
