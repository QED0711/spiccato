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
const stateSchema = {
    num: 1,
    str: "Hello, world!"
}

// Pass the schema to the initialization of the instance
const manager = new Spiccato(stateSchema, {id: "myState"})

console.log(manager.state.num) // 1
manager.setState({num: 2})
console.log(manager.state.num) // 2 
```
#### **setState**

`setState` is a low level method that can be used to set all properties of an associated state, but more commonly just a subset of properties . This method can take in one of two types for its first argument: an `object` or a `function`

When an object is passed in, the state will update just the properties indicated in the object without modifying/removing any of the other properties in the state. However, be cautious when using an object to update nested structures. You will need to make sure that every call to `setState` updates every property in the nested structure or else the fundamental structure will change. In situations like this, it is better to use a `function` as an input (see below), or a [dynamic nested setter](#dynamic-accessors) (detailed below).

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

// this is fine and doesn't change any other state
manager.setState({someBool: false}) 

// This is also fine because it sets all the defined properties of the nested object
manager.setState({user: {name: "John Doe", address: "123 Main st", phone: "555-5555"}})

// Watch out here! This fundamentally changes the state schema because it only sets some properties of the nested state
manager.setState({user: {name: "Jane Doe"}})
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

---
### State Accessors
#### Immutable Access
Each `spiccato` instance has a `state` property. You can access values through this property, but you cannot modify any value directly from this property. 

```
const manager = Spiccato({myVal: 0}, {id: "immutability"})
manager.state.myVal // => 0

manager.state.myVal = 1 // This will throw an error
```
#### Dynamic Accessors
An alternative way to access and set state values is through dynamically generated accessors. 

The default initialization behavior of a `spiccato` instance automatically creates accessor methods (getters and setters) for the each parameter in the associated state. In the case of nested values, nested accessors are also create. This behavior can be modified at the time of initialization. See [Initialization Options](#Initilization-Options) for more information on how to modify this behavior.

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
- Accessing state values and then using them to perform an external action such as updating the DOM. 

```
const stateSchema = {isAdmin: false};

/* initialize manager code here ... */

manager.addCustomMethods({

    // This method shows/hides content in the page based on certain state configurations. All the logic is self contained, and so this method can be called from anywhere in your application and you can expect it to perform correctly
    showOrHideAdminOptions(){
        const adminOptions = document.querySelector("#admin-options-container")
        adminOptions.style.visiblity = this.state.isAdmin ? "visible" : "hidden" 
    },

    // This method makes a network call and sets the state according to the response. Notice how it also calls the previous custom method we defined.
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

Namespaced methods are essentially custom methods, but that can be logically organized based on their purpose. The argument to `addNamespacedMethods` is also an object, but the first level of keys are the namespaces pointing nested objects, and the nested objects are the function names and function definitions. 

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

For the general `update` event, the payload differs slightly. Since there is no single path being subscribed to, the payload for this event type only has a `state` property with the current values for the entire state object. 

#### RemoveEventListener

You can remove an event listener wit ha familiar pattern as well.

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

### Storage Options

## CLI