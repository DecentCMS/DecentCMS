title: Structure of a site

-8<------------------------------------------------------------------

A Decent CMS site is described by a files under a subdirectory of the
`/sites` folder.
There can be more than one site (also called a tenant) under a single
Decent CMS instance.

The settings.json file
----------------------

The `settings.json` file contains the description of the site.

A complete description of this file can be found
[here](/docs/decent-core-multi-tenancy/the-settings-file).

The content folder
------------------

The content folder is where files describing content items can be
found if the file content store feature is active.
The folder structure reflects the content item ids.
For example, an item accessible as `/path/to/item` has the id
`path/to/item`, and will be described by a `item.json`, `item.yaml`,
or `item.yaml.md` file in the `content/path/to` directory.

Landing pages can also be stored under the `index` name.
For example, the `/path/to` URL can be described by a `to.yaml.md`
file, as described in the previous paragraph, but it can also be
described by an `index.json`, `index.yaml`, or `index.yaml.md`
file under the `content/path/to` directory.

The media folder
----------------

The media folder contains all asset files for the site.
Those assets are served directly under the `/media` path.
For example, `/sites/mysite/media/logos/logo.svg` will
be served when `media/logos/logo.svg` is requested.

The navigation folder
---------------------

The navigation folder contains a JSON file for each navigation menu
in the site.
The name of the file without extension is the name of the menu.
The folder should at least contain one `default.json` file for the
default menu.

The format of the navigation file is described in
[this topic](/docs/decent-core-navigation/navigation-file).

The widget folder
-----------------

The widget folder contains an `index.json` file that contains a
description of widget layers and pointers to the widgets that they
contain.
The folder also contains one file per widget, named with the widget's
id, and the `.json`, `.yaml`, or `.yaml.md` extension, if the file
content store feature is active.

The format for the `index.json` layer file is described in
[this topic](/docs/decent-core-widgets/layer-file).

The logs folder
---------------

Depending on the site's logging configuration, the logs folder
typically contains one log file per day, that has records of events
and errors that the application went through.