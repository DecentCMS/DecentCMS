title: Design principles
number: 2

-8<------------------------------------------------------------------

Core principles
---------------

DecentCMS and its core modules are built following the following set
of principles:

* **Modular**: The core provides very little, all features are
  provided by services within modules.
* **Extensible**: All services can be replaced and extended.
* **Composition**: All components have a single, limited
  responsibility, and are composed to build larger entities.
* **Decoupled**: Services are loosely coupled, and hard dependencies
  are avoided.
* **Familiar**: When a component, API, or pattern already exists and
  has been successful, use it.
  Don't reinvent, don't be exotic in the core.
  Weird and experimental stuff belongs in optional modules.
* **Simple**: Simple designs, with a focus on core features that are
  needed by all.
* **Open**: Everything is open-source, but can be used in commercial
  applications.
  Open standards are preferred.
* **Easy**: Different personas will get different and adapted entry
  points into the system.
  Developers get a clean, clear, and extensible API, designers get
  tools to determine what templates to write, webmasters get
  complete control over the structure of the site and its contents,
  content creators get an easy, task-based set of tools and wizards,
  and end-users get modern, responsive, and fast sites.
  The barrier to entry is kept low, and no concept is required
  knowledge until it's needed. Friction is minimized.
* **Ready**: Out of the box, the most common types of sites can be
  built: blog, commerce, community.
  You only have to build what's unusual about your site.
* **Scalable**: Sites are fast no matter their scale, at boot and
  then on every request.
  Tooling exists to diagnose and fix performance issues.
* **Proven**: All features are tested, and we'll eat our own dogfood.
* **Documented**: All features come with documentation, literally:
  documentation is actually packaged with the code and tests for
  each module.
  JsDoc comments are used on all public APIs.

Module checklist
----------------

All modules, especially core modules, should respect the following
guidelines:

* **Localizable**: All message strings that are visible to users
  should be enclosed in a call to the 't' localization helper.
* **Accessible**: All user interface must be accessible, have
  keyboard support, and be compatible with screen readers.
* **Tested**: Modules should come with tests covering all of its
  major features.
* **Documented**: Modules should come with a `/docs` folder that
  should contain at least an `index.yaml.md` file explaining the
  purpose and usage of the module's features.
  All public API must be decorated with [JsDoc][jsdoc] comments.

  [jsdoc]: http://usejsdoc.org/