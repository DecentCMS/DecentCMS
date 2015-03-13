title: The format of navigation files

-8<------------------------------------------------------------------

The navigation files that can be found in a site's "navigation"
directory describe the menus that are available to the system.
The `default.json` file in particular describes the default menu for
the site.
By editing this file, you can modify the menu's hierarchical
structure and its contents.

```json
[
  {"name": "home", "title": "Home", "href": "/"},
  {"name": "blog", "title": "Blog", "href": "http://weblogs.asp.net/bleroy"},
  {
    "name": "projects",
    "title": "Projects",
    "href": "/projects",
    "items": [
      {"name": "orchard", "title": "Orchard CMS", "href": "http://orchardproject.net"},
      {"name": "decent", "title": "Decent CMS", "href": "http://decentcms.org"},
      {"name": "nwazetcommerce", "title": "Nwazet Commerce",
       "href": "https://bitbucket.org/bleroy/nwazet.commerce"},
      {"name": "fluentpath", "title": "FluentPath", "href": "https://fluentpath.codeplex.com/"},
      {"name": "flasync", "title": "Flasync", "href": "https://github.com/bleroy/flasync"}
    ]
  },
  {"name": "contact", "title": "Contact", "href": "/contact"}
]
```

Each menu entry consists of an object with the following properties:

* **name**: a technical name for the menu entry. Use lowercase
  letters, digits, and dashes.
* **title**: the title for the item.
* **href**: the target URL for the item.
* **items**: the array of sub-items.

How does this work?
-------------------

If the "navigation" feature is enabled on a site, a special handler
will place a "menu" shape into the top-level "navigation" zone of the
layout.
This shape's `items` property is populated from a call to
the `addRootItems` method of `navigation-provider` services.

The `file-navigation-provider` service, which is part of the feature
of the same name, is an implementation of the `navigation-provider`
service that parses the `/sites/mysite/navigation/default.json`
file for menu items.