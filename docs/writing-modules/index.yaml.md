title: Writing modules

-8<------------------------------------------------------------------

The topics in this section explain how to build a new DecentCMS
module.
DecentCMS modules can replace existing features, extend them, or
create entirely new ones.

Where should a module go?
-------------------------

Modules are made of all the files under a subdirectory of the
`/modules` directory.
A module may be put directly under the `/modules`directory, or it can
be part of a "module area".

Module areas are groups of modules that have a common origin, and
make sense being together.
An example of a module area is the "core" area, that groups all the
core modules that come standard with DecentCMS.
They provide essential features that are likely to be useful to any
DecentCMS web site.
Another advantage of module areas is that they make it easier to
manage a whole group of modules under a single Git repository.

Module areas are simply subdirectories of the `/modules` directory
that do not have a `package.json` file directly under it, but has
one or more modules under it.
You may not put areas under areas.

Anatomy of a module
-------------------

Under a module's directory, you will find some or all of these
directories and files:

* **docs**: The documentation for the module. At least an "index"
  topic (typically a `index.yaml.md` file) should be present.
* **lib**: Code that is not part of a DecentCMS service can be stored
  under this directory. Most modules won't have a `lib` directory.
  JavaScript files under this directory will be automatically
  discovered by the "API Documentation" feature.
* **node_modules**: The NPM dependencies and dev dependencies for
  the module. DecentCMS service dependencies do not need to exist
  in `node_modules`, as those are discovered and made available
  globally.
* **services**: JavaScript files in this directory expose DecentCMS
  services. This is the most important directory of a module, where
  its features are implemented.
* **test**: This directory should contain one or several JavaScript
  files that test all services in the module.
* **views**: Templates used by services in the module can be found
  in this directory, and will be automatically discovered by
  DecentCMS.
* **Gruntfile.js**: The [Grunt][grunt] file for a module describes
  all the automated tasks that are relevant to the module.
  At least, it should have a "default" task and a "test" task.
  The "default" task may just be the same as the "test" task.
  An easy way to get started with this is to just copy the
  `module-gruntfile.js` file from the root of the application to the
  root directory of the module, renaming it to `Gruntfile.js`.
* **package.json**: This is a standard NPM package manifest, with a
  few additional properties that DecentCMS can recognize.
  See "[the module manifest][manifest]" for more details.
* **placement.json** or **placement.js**:
  A file that describes how to dispatch shapes into zones.
  See "[placement files][placement]" for more details.

  [grunt]:     http://gruntjs.com/
  [manifest]:  /docs/writing-modules/manifest
  [placement]: /docs/writing-modules/placement