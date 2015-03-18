title: Writing a service
number: 5

-8<------------------------------------------------------------------

DecentCMS services are just classes that fulfill a specific named
contract. Services can consume other services, using existing or new
contracts, thus providing a generic mechanism for extensibility,
where extensions to core services can expose their own extensibility
points.

The constructor for a service class must take the scope object as its
parameter.

```js
/**
 * My service implements the "do-something-custom" service contract.
 */
var MyService = function MyService(scope) {
  this.scope = scope;
}
```

The scope will act as the service locator for the service's methods:

```js
MyService.prototype.doSomething = function doSomething(a, b) {
  var myDependency = this.scope.require('my-dependency');
  // do something with myDependency if it's not null.
}
```

The scope can also be used to obtain the settings for the feature the
service is part of:

```js
var site = this.scope.require('shell');
var settings = site.features['my-feature'];
var mySetting = settings['my-setting'];
```

The `mySetting` variable will then contain the value defined in the
site's `settings.json` file under the `features.my-feature` section:

```json
"features": {
  "my-feature": {
    "my-setting": "The value for my setting"
  }
```

A service must export its constructor:

```js
module.exports = MyService;
```

It should also declare the feature it's part of, the service contract
it implements, and the scope it should depend on:

```js
MyService.feature = 'my-feature';
MyService.service = 'do-something-custom';
MyService.scope = 'shell';
```

The scope is especially important to define for services that must
persist throughout the lifetime of their scope.
For example, a service the instances of which must remain available
for the duration of the request would have a declared scope of
"request", and should be marked as scope singletons:

```js
MyService.isScopeSingleton = true;
```

This way, all code that requires that service during a given request
will get the same instance.
Within two distinct requests however, you'll get distinct instances.

Features should also be declared in the module manifest, under the
`features` section of the `package.json` file:

```json
"features": {
  "my-feature": {
    "name": "My feature",
    "description": "A specific implementation of 'do-something-custom'."
  },
```
