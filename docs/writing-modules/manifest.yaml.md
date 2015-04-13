title: The module manifest
number: 1

-8<------------------------------------------------------------------

The `package.json` file, also called "module manifest", is where
module authors can declare what their module consists of.

It is a standard [NPM manifest file][npm-manifest], with a few
additional properties that DecentCMS understands.

Here is an example of a module manifest, taken from
`/modules/core/documentation`:

```json
{
  "name": "decent-core-documentation",
  "friendlyName": "Core Documentation",
  "version": "0.0.1",
  "description": "Online documentation for DecentCMS",
  "features": {
    "documentation": {
      "name": "Online documentation",
      "description": "Makes online documentation for all modules available under the /docs path."
    },
    "api-documentation": {
      "name": "Online API documentation",
      "description": "Makes online documentation extracted from JsDoc comments from libraries and services in all modules available under the /apidocs path."
    }
  },
  "main": "./index",
  "scripts": {
    "test": "./test/index"
  },
  "author": "Bertrand Le Roy",
  "license": "MIT",
  "dependencies": {
    "async": "*",
    "jsdoc-to-markdown": "*"
  },
  "devDependencies": {
    "chai": "*",
    "grunt-mocha-test": "*",
    "mocha": "*",
    "proxyquire": "*"
  }
}
```

The `name` property is the technical package name.
It is recommended that you use the "decent-" prefix for all DecentCMS
modules, followed with the module area name if there is one, and then
the name of the module.
In the example above, "decent-core-documentation" is the name for the
"documentation" DecentCMS module from the "core" area.

The `friendlyName` property is an addition from DecentCMS that may be
used to give the module a more human-readable name than what the name
property can give.

The `features` section describes all the features available in the
module.
A feature is a group of services that can be enabled and disabled for
each site, through the site settings.
Each feature has a name and a description.
Features can declare their own dependencies, but it is not
recommended.
Instead, services should require other services, and fail gracefully
when the required services can't be found.

The `dependencies` section is the standard NPM section where
dependencies are defined.
It should only mention dependencies on Node modules, not dependencies
on other DecentCMS modules (see above).

The `devDependencies` folder is where NPM dependencies that are not
required at runtime are declared. For example, libraries used only
when testing or grunting the module can be declared here rather than
in `dependencies`.

An optional `priority` number can be assigned to a module that will
determine in what order the services in the module get registered,
and the order in which templates will be resolved.
The lowest priority value makes the module more important, so a P0
module will have its services and templates resolved before those of
a P1 module.
Themes have priority -1 by default, so they take precedence over all
modules in principle.
The default priority number for modules that are not themes is 9999.
No matter what the priorities are, services will be resolved in a
deterministic order if one of the service has a dependency on
another: the service that depends on the other will be selected over
the one that is depended upon.

  [npm-manifest]: https://docs.npmjs.com/files/package.json